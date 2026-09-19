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
      const rt = rtList.join('\\n\\n');

      if (!setupRule && rt) {
        const match = rt.match(/(?:Setup|When revealed):[\\s\\S]*?(?=(?:Special Rules?|Twist(?:\\s*\\d+|\\s*[\\d-]+)?|Evil Wins|$))/i);
        if (match) setupRule = match[0].trim();
      }
      if (!specialRules && rt) {
        const match = rt.match(/Special Rules?:[\\s\\S]*?(?=(?:Twist(?:\\s*\\d+|\\s*[\\d-]+)?|Evil Wins|$))/i);
        if (match) specialRules = match[0].trim();
      }
      if (!twistEffect && rt) {
        const match = rt.match(/Twist[\\s\\S]*?(?=(?:Special Rules?|Evil Wins|$))/i);
        if (match) twistEffect = match[0].trim();
      }

      if (!evilWins && rt) {
        const match = rt.match(/Evil Wins:[\\s\\S]*?(?=$)/i);
        if (match) {
          evilWins = match[0].trim();
        }
      }

      // If evilWins is still empty, search twistEffect and full text for "Twist X: Evil Wins!" patterns
      if (!evilWins) {
        const textToSearch = [twistEffect, specialRules, setupRule, rt].filter(Boolean).join('\\n');
        const twistEvilMatch = textToSearch.match(/Twists?\\s*(\\d+(?:-\\d+)?|\\d+(?:,\\s*\\d+)*(?:\\s*and\\s*\\d+)?):?[^\\n\\r]*?Evil [Ww]ins!?(?:\\s*\\(([^)]+)\\))?/i);
        if (twistEvilMatch) {
          const twistNum = twistEvilMatch[1];
          const extraCond = twistEvilMatch[2] ? ` (${twistEvilMatch[2]})` : '';
          evilWins = `Evil Wins: When Twist ${twistNum} is drawn${extraCond}.`;
        } else {
          const loseMatch = textToSearch.match(/([^\\n\\r.]*players lose[^\\n\\r.]*\\.)/i);
          if (loseMatch) {
            evilWins = `Evil Wins: ${loseMatch[0].trim()}`;
          }
        }
      } else {
        if (!/^evil wins:?/i.test(evilWins.trim())) {
          evilWins = `Evil Wins: ${evilWins.trim()}`;
        }
      }

      clean.setupRule = setupRule;
      clean.specialRules = specialRules;
      clean.evilWins = evilWins;
      clean.difficulty = evaluateSchemeDifficulty(clean);
      
      // Filter out redundant "Twist X: Evil Wins" lines from twistEffect as Evil Wins is shown separately
      if (twistEffect) {
        const lines = twistEffect.split(/\r?\n/);
        const filtered = lines.filter((line) => {
          const trimmed = line.trim();
          if (!trimmed) return true;
          const isTwistEvilWins = /^[-*•]?\s*Twists?\s*(?:\d+(?:-\d+)?|\d+(?:,\s*\d+)*(?:\s*and\s*\d+)?|\s*)?:?\s*Evil\s+Wins[!.]?(?:\s*\([^)]*\))?\s*$/i.test(trimmed);
          return !isTwistEvilWins;
        });
        clean.twistEffect = filtered.join('\n').trim();
      } else {
        clean.twistEffect = '';
      }
      if (!clean.imageUrl && clean.cards?.[0]?.imageUrl) {
        clean.imageUrl = clean.cards[0].imageUrl;
      }
      if (clean.cards && Array.isArray(clean.cards)) {
        clean.cards = clean.cards.map((c: any) => ({ ...c, name: cleanThe(c.name), difficulty: clean.difficulty }));
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
        clean.cards = clean.cards.map((c: any) => ({ ...c, name: cleanThe(c.name) }));
      }
      return clean;
    };

    const sortedExpansions = (raw.expansions || []).slice().sort((a: any, b: any) => {
      const isCoreA = a.boxType === 'Core';
      const isCoreB = b.boxType === 'Core';
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
