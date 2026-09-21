import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HeroCard, MastermindCard, VillainGroup, HenchmanGroup, SchemeCard, Expansion } from '../types';
import {
  getStoredApiUrl,
  setStoredApiUrl,
  normalizeApiUrl,
  fetchCardsFromApi,
} from '../utils/apiConfig';
import { evaluateSchemeDifficulty } from '../utils/schemeEvaluator';

export type DataSourceType = 'custom-api' | 'api' | 'static';

interface DataState {
  expansions: Expansion[];
  heroes: HeroCard[];
  masterminds: MastermindCard[];
  villains: VillainGroup[];
  henchmen: HenchmanGroup[];
  schemes: SchemeCard[];
  isLoading: boolean;
  error: string | null;
  apiUrl: string;
  dataSource: DataSourceType;
  setApiUrl: (url: string) => void;
  resetApiUrl: () => void;
  refreshData: (customUrl?: string) => Promise<boolean>;
  reloadCards: (customUrl?: string) => Promise<boolean>;
  translateVillainsTerms: boolean;
  setTranslateVillainsTerms: (val: boolean) => void;
  toggleTranslateVillainsTerms: () => void;
}

const STORAGE_TRANSLATE_KEY = 'legendary_translate_villains_v1';

const defaultState: DataState = {
  expansions: [],
  heroes: [],
  masterminds: [],
  villains: [],
  henchmen: [],
  schemes: [],
  isLoading: true,
  error: null,
  apiUrl: '',
  dataSource: 'static',
  setApiUrl: () => {},
  resetApiUrl: () => {},
  refreshData: async () => false,
  reloadCards: async () => false,
  translateVillainsTerms: false,
  setTranslateVillainsTerms: () => {},
  toggleTranslateVillainsTerms: () => {},
};

const DataContext = createContext<DataState>(defaultState);

export const useData = () => useContext(DataContext);

export function cleanCorruptedRulesText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\b10\s+Rule\b/gi, '10 Sidekicks')
    .replace(/\b4\s+Rule\b/gi, '4 Sidekicks')
    .replace(/\b2\s+Rule\b/gi, '2 Sidekicks')
    .replace(/\btwo\s+Rule\b/gi, 'two Sidekicks')
    .replace(/\bAll\s+Rule\b/gi, 'All Sidekicks')
    .replace(/\ba\s+Rule\b/gi, 'a Sidekick')
    .replace(/\bthe\s+Rule\s+Stack\b/gi, 'the Sidekick Stack')
    .replace(/\bRule\s+Stack\b/gi, 'Sidekick Stack')
    .replace(/\bRule\s+in\s+the\s+Villain\s+Deck\b/gi, 'Sidekicks in the Villain Deck')
    .replace(/\bdefeat\s+a\s+Rule\b/gi, 'defeat a Sidekick')
    .replace(/\bgain\s+a\s+Rule\b/gi, 'gain a Sidekick')
    .replace(/\breturns?\s+a\s+Rule\b/gi, 'returns a Sidekick')
    .replace(/\bRule\s+from\s+their\s+discard\b/gi, 'Sidekick from their discard')
    .replace(/\bRule\s+from\s+the\s+Sidekick\s+Stack\b/gi, 'Sidekicks from the Sidekick Stack')
    .replace(/\bgained\s+any\s+Rule\b/gi, 'gained any Shards')
    .replace(/\bwith\s+Rule\b/gi, 'with Shards')
    .replace(/\bmany\s+Rule\b/gi, 'many Shards')
    .replace(/\bRule\s+card\b/gi, 'Divided card');
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Omit<DataState, 'translateVillainsTerms' | 'setTranslateVillainsTerms' | 'toggleTranslateVillainsTerms' | 'apiUrl' | 'setApiUrl' | 'resetApiUrl' | 'refreshData' | 'reloadCards' | 'dataSource'>>({
    expansions: [],
    heroes: [],
    masterminds: [],
    villains: [],
    henchmen: [],
    schemes: [],
    isLoading: true,
    error: null,
  });

  const [apiUrl, setApiUrlState] = useState<string>(() => getStoredApiUrl());
  const [dataSource, setDataSource] = useState<DataSourceType>('static');

  const [translateVillainsTerms, setTranslateVillainsTermsState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_TRANSLATE_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const setTranslateVillainsTerms = (val: boolean) => {
    setTranslateVillainsTermsState(val);
    try {
      localStorage.setItem(STORAGE_TRANSLATE_KEY, JSON.stringify(val));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTranslateVillainsTerms = () => {
    setTranslateVillainsTerms(!translateVillainsTerms);
  };

  // Helper to normalize any name ending in ", The" to "The ..." and extract missing attributes
  const normalizeData = useCallback((raw: any) => {
    const cleanThe = (name: string) => {
      if (!name || typeof name !== 'string') return name;
      if (/,\\s*The$/i.test(name)) {
        return 'The ' + name.replace(/,\\s*The$/i, '').trim();
      }
      return name;
    };

    const processMastermind = (item: any): MastermindCard => {
      if (!item) return item;
      const clean = { ...item, name: cleanThe(item.name) };
      let leads = clean.alwaysLeads || clean.always_leads || clean.AlwaysLeads || '';
      if (!leads && Array.isArray(clean.cards)) {
        for (const c of clean.cards) {
          const match = (c.rulesText || c.text || '').match(/(?:Always Leads|Leads):\\s*([^\\n\\r.]+)/i);
          if (match) {
            leads = match[1].trim();
            break;
          }
        }
      }
      clean.alwaysLeads = cleanThe(leads);
      if (!clean.imageUrl && clean.cards?.[0]?.imageUrl) {
        clean.imageUrl = clean.cards[0].imageUrl;
      }
      if (clean.cards && Array.isArray(clean.cards)) {
        clean.cards = clean.cards.map((c: any) => ({ ...c, name: cleanThe(c.name) }));
      }
      return clean;
    };

    const processScheme = (item: any): SchemeCard => {
      if (!item) return item;
      const clean = { ...item, name: cleanThe(item.name) };
      let setupRule = clean.setupRule || clean.setup_rule || clean.SetupRule || clean.setup || '';
      let specialRules = clean.specialRules || clean.special_rules || clean.SpecialRules || '';
      let evilWins = clean.evilWins || clean.evil_wins || clean.EvilWins || '';
      let twistEffect = clean.twistEffect || clean.twist_effect || clean.TwistEffect || '';

      const rtList = [
        ...(Array.isArray(clean.cards) ? clean.cards.map((c: any) => c.rulesText || c.text || '') : []),
        clean.rulesText || clean.text || ''
      ].filter(Boolean);
      const rt = rtList.join('\n\n');

      if (rt) {
        const match = rt.match(/(?:Setup|When revealed):[\s\S]*?(?=(?:\n\s*Special Rules?|\n\s*Twists?(?:\s*\d+|\s*[\d-]+)?|\n\s*(?:Evil|Good|Deadpool|[A-Za-z]+)\s+[Ww]ins|$))/i);
        if (match) {
          const fullSetup = match[0].trim();
          if (!setupRule || fullSetup.length > setupRule.length) {
            setupRule = fullSetup;
          }
        }
      }

      if (!specialRules && rt) {
        const match = rt.match(/Special Rules?:[\s\S]*?(?=(?:\n\s*Twists?(?:\s*\d+|\s*[\d-]+)?|\n\s*(?:Evil|Good|Deadpool|[A-Za-z]+)\s+[Ww]ins|$))/i);
        if (match) specialRules = match[0].trim();
      }

      // If specialRules is still empty, check if it was lumped into twistEffect
      if (!specialRules && twistEffect && /Special Rules?:/i.test(twistEffect)) {
        const match = twistEffect.match(/Special Rules?:[\s\S]*?(?=(?:\n\s*Twists?(?:\s*\d+|\s*[\d-]+)?|\n\s*(?:Evil|Good|Deadpool|[A-Za-z]+)\s+[Ww]ins|$))/i);
        if (match) {
          specialRules = match[0].trim();
          twistEffect = twistEffect.replace(match[0], '').trim();
        }
      }

      if (!twistEffect && rt) {
        const match = rt.match(/Twists?(?:\s*\d+|\s*[\d-]+)?:[\s\S]*?(?=(?:\n\s*Special Rules?|\n\s*(?:Evil|Good|Deadpool|[A-Za-z]+)\s+[Ww]ins|$))/i);
        if (match) twistEffect = match[0].trim();
      }

      if (!evilWins && rt) {
        const match = rt.match(/(?:Evil|Good|Deadpool|[A-Za-z]+)\s+Wins:[\s\S]*?(?=$)/i);
        if (match) {
          evilWins = match[0].trim();
        }
      }

      // If evilWins is still empty, search twistEffect and full text for "Twist X: (Evil|Good|Deadpool) Wins!" patterns
      if (!evilWins) {
        const textToSearch = [twistEffect, specialRules, setupRule, rt].filter(Boolean).join('\n');
        const deadpoolMatch = textToSearch.match(/Twists?\s*(\d+(?:-\d+)?):?\s*(Deadpool\s+wins[^\n\r]*)/i);
        if (deadpoolMatch) {
          const twistNum = deadpoolMatch[1];
          const dpText = deadpoolMatch[2].trim();
          evilWins = `Deadpool Wins: Twist ${twistNum}: ${dpText}`;
        } else {
          const twistWinMatch = textToSearch.match(/Twists?\s*(\d+(?:-\d+)?|\d+(?:,\s*\d+)*(?:\s*and\s*\d+)?):?[^\n\r]*?((?:Evil|Good|Deadpool)\s+[Ww]ins[!.]?(?:\s*\([^)]*\))?)/i);
          if (twistWinMatch) {
            const twistNum = twistWinMatch[1];
            const winWord = twistWinMatch[2].trim();
            const extraCond = twistWinMatch[3] ? ` (${twistWinMatch[3]})` : '';
            evilWins = `${winWord.replace(/[!.]/g, '')}: When Twist ${twistNum} is drawn${extraCond}.`;
          } else {
            const loseMatch = textToSearch.match(/([^\n\r.]*players lose[^\n\r.]*\.)/i);
            if (loseMatch) {
              evilWins = `Evil Wins: ${loseMatch[0].trim()}`;
            }
          }
        }
      } else {
        if (!/^(?:evil|good|deadpool|[a-z]+)\s+wins:?/i.test(evilWins.trim())) {
          evilWins = `Evil Wins: ${evilWins.trim()}`;
        }
      }

      clean.setupRule = cleanCorruptedRulesText(setupRule);
      clean.specialRules = cleanCorruptedRulesText(specialRules);
      clean.evilWins = cleanCorruptedRulesText(evilWins);
      clean.difficulty = evaluateSchemeDifficulty(clean);
      
      // Filter out redundant "Twist X: (Evil|Good|Deadpool) Wins" lines from twistEffect as outcome is shown separately
      if (twistEffect) {
        const lines = twistEffect.split(/\r?\n/);
        const filtered = lines.filter((line) => {
          const trimmed = line.trim();
          if (!trimmed) return true;
          const isTwistWin = /^[-*•]?\s*Twists?\s*(?:\d+(?:-\d+)?|\d+(?:,\s*\d+)*(?:\s*and\s*\d+)?|\s*)?:?\s*(?:Evil|Good|Deadpool)\s+Wins[!.]?(?:\s*\([^)]*\))?\s*$/i.test(trimmed);
          const isDeadpoolWin = /^[-*•]?\s*Twists?\s*\d+:?\s*Deadpool\s+wins/i.test(trimmed);
          return !isTwistWin && !isDeadpoolWin;
        });
        clean.twistEffect = cleanCorruptedRulesText(filtered.join('\n').trim());
      } else {
        clean.twistEffect = '';
      }
      if (!clean.imageUrl && clean.cards?.[0]?.imageUrl) {
        clean.imageUrl = clean.cards[0].imageUrl;
      }
      if (clean.cards && Array.isArray(clean.cards)) {
        clean.cards = clean.cards.map((c: any) => ({
          ...c,
          name: cleanThe(c.name),
          rulesText: cleanCorruptedRulesText(c.rulesText || c.text || ''),
          difficulty: clean.difficulty,
        }));
      }
      return clean;
    };

    const processGeneric = (item: any) => {
      if (!item) return item;
      const clean = { ...item, name: cleanThe(item.name) };
      if (clean.alwaysLeads) clean.alwaysLeads = cleanThe(clean.alwaysLeads);
      if (!clean.imageUrl && clean.cards?.[0]?.imageUrl) {
        clean.imageUrl = clean.cards[0].imageUrl;
      }
      if (clean.cards && Array.isArray(clean.cards)) {
        clean.cards = clean.cards.map((c: any) => ({
          ...c,
          name: cleanThe(c.name),
          rulesText: cleanCorruptedRulesText(c.rulesText || c.text || ''),
        }));
      }
      return clean;
    };

    const sortedExpansions = (raw.expansions || []).slice().sort((a: any, b: any) => {
      const isCoreA = a.boxType === 'Core' || a.boxType === 'Core Set';
      const isCoreB = b.boxType === 'Core' || b.boxType === 'Core Set';
      if (isCoreA && !isCoreB) return -1;
      if (!isCoreA && isCoreB) return 1;
      return a.name.localeCompare(b.name);
    });

    const parsedHeroes = (raw.heroes || []).map(processGeneric);
    const parsedMasterminds = (raw.masterminds || []).map(processMastermind);
    const parsedVillains = (raw.villains || []).map(processGeneric);
    const parsedHenchmen = (raw.henchmen || []).map(processGeneric);
    const parsedSchemes = (raw.schemes || []).map(processScheme);

    return {
      expansions: sortedExpansions,
      heroes: parsedHeroes,
      masterminds: parsedMasterminds,
      villains: parsedVillains,
      henchmen: parsedHenchmen,
      schemes: parsedSchemes,
    };
  }, []);

  const loadData = useCallback(async (targetUrl?: string) => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { data: rawData, isFallback } = await fetchCardsFromApi(targetUrl);
      const normalized = normalizeData(rawData);
      setData({
        ...normalized,
        isLoading: false,
        error: null,
      });
      const resolvedSource: DataSourceType = isFallback
        ? 'static'
        : targetUrl
        ? 'custom-api'
        : 'api';
      setDataSource(resolvedSource);
      return true;
    } catch (err: any) {
      console.error('Error fetching Legendary data:', err);
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Failed to load card database',
      }));
      return false;
    }
  }, [normalizeData]);

  useEffect(() => {
    loadData(apiUrl);
  }, [loadData, apiUrl]);

  const setApiUrl = (url: string) => {
    const trimmed = normalizeApiUrl(url);
    setApiUrlState(trimmed);
    setStoredApiUrl(trimmed);
    loadData(trimmed);
  };

  const resetApiUrl = () => {
    setApiUrl('');
  };

  const reloadCards = async (customUrl?: string) => {
    return loadData(customUrl !== undefined ? customUrl : apiUrl);
  };

  return (
    <DataContext.Provider
      value={{
        ...data,
        apiUrl,
        dataSource,
        setApiUrl,
        resetApiUrl,
        refreshData: reloadCards,
        reloadCards,
        translateVillainsTerms,
        setTranslateVillainsTerms,
        toggleTranslateVillainsTerms,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
