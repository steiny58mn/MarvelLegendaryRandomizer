import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HeroCard, MastermindCard, VillainGroup, HenchmanGroup, SchemeCard, Expansion } from '../types';
import { prefetchImageUrl } from '../utils/imageOptimizer';
import {
  getStoredApiUrl,
  setStoredApiUrl,
  getEffectiveApiUrl,
  normalizeApiUrl,
  fetchCardsFromApi,
} from '../utils/apiConfig';

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
  reloadCards: async () => false,
  translateVillainsTerms: false,
  setTranslateVillainsTerms: () => {},
  toggleTranslateVillainsTerms: () => {},
};

const DataContext = createContext<DataState>(defaultState);

export const useData = () => useContext(DataContext);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Omit<DataState, 'translateVillainsTerms' | 'setTranslateVillainsTerms' | 'toggleTranslateVillainsTerms' | 'apiUrl' | 'setApiUrl' | 'reloadCards' | 'dataSource'>>({
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
      if (/,\s*The$/i.test(name)) {
        return 'The ' + name.replace(/,\s*The$/i, '').trim();
      }
      return name;
    };

    const processMastermind = (item: any): MastermindCard => {
      if (!item) return item;
      const clean = { ...item, name: cleanThe(item.name) };
      let leads = clean.alwaysLeads || clean.always_leads || clean.AlwaysLeads || '';
      if (!leads && Array.isArray(clean.cards)) {
        for (const c of clean.cards) {
          const match = (c.rulesText || c.text || '').match(/(?:Always Leads|Leads):\s*([^\n\r.]+)/i);
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

      if (!setupRule && rt) {
        const match = rt.match(/(?:Setup|When revealed):[\s\S]*?(?=(?:Special Rules?|Twist(?:\s*\d+|\s*[\d-]+)?|Evil Wins|$))/i);
        if (match) setupRule = match[0].trim();
      }
      if (!specialRules && rt) {
        const match = rt.match(/Special Rules?:[\s\S]*?(?=(?:Twist(?:\s*\d+|\s*[\d-]+)?|Evil Wins|$))/i);
        if (match) specialRules = match[0].trim();
      }
      if (!evilWins && rt) {
        const match = rt.match(/Evil Wins:[\s\S]*?(?=$)/i);
        if (match) evilWins = match[0].trim();
      }
      if (!twistEffect && rt) {
        const match = rt.match(/Twist[\s\S]*?(?=(?:Special Rules?|Evil Wins|$))/i);
        if (match) twistEffect = match[0].trim();
      }

      clean.setupRule = setupRule;
      clean.specialRules = specialRules;
      clean.evilWins = evilWins;
      clean.twistEffect = twistEffect;
      if (!clean.imageUrl && clean.cards?.[0]?.imageUrl) {
        clean.imageUrl = clean.cards[0].imageUrl;
      }
      if (clean.cards && Array.isArray(clean.cards)) {
        clean.cards = clean.cards.map((c: any) => ({ ...c, name: cleanThe(c.name) }));
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
      return (a.releaseYear || 2020) - (b.releaseYear || 2020) || (a.order || 0) - (b.order || 0);
    });

    return {
      expansions: sortedExpansions,
      heroes: (raw.heroes || []).map(processGeneric),
      masterminds: (raw.masterminds || []).map(processMastermind),
      villains: (raw.villains || []).map(processGeneric),
      henchmen: (raw.henchmen || []).map(processGeneric),
      schemes: (raw.schemes || []).map(processScheme),
      isLoading: false,
      error: null,
    };
  }, []);

  const loadCards = useCallback(async (customBaseUrl?: string): Promise<boolean> => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    const targetBase = customBaseUrl !== undefined ? normalizeApiUrl(customBaseUrl) : getEffectiveApiUrl();

    // 1. Try Configured API URL (trying candidate paths /legendary/cards, /api/cards, /cards)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const { data: fetched } = await fetchCardsFromApi(targetBase, controller.signal);
      clearTimeout(timeoutId);

      const hasItems = (fetched.heroes && fetched.heroes.length > 0) ||
                       (fetched.masterminds && fetched.masterminds.length > 0) ||
                       (fetched.schemes && fetched.schemes.length > 0) ||
                       (fetched.expansions && fetched.expansions.length > 0);

      if (hasItems) {
        setData(normalizeData(fetched));
        setDataSource(targetBase ? 'custom-api' : 'api');
        return true;
      }
      // If the API returned empty arrays (empty database), fallback to bundled data so app isn't blank
      console.warn('API returned empty card list; loading static fallback data.');
    } catch (apiErr: any) {
      console.warn(`Card API fetch failed (${targetBase}):`, apiErr?.message);
    }

    // 2. Fallback to local static cards-data.json
    try {
      const fallbackRes = await fetch('/cards-data.json');
      if (fallbackRes.ok) {
        const fetched = await fallbackRes.json();
        setData(normalizeData(fetched));
        setDataSource('static');
        return true;
      }
      throw new Error('Static fallback file not available.');
    } catch (fallbackErr: any) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: `Unable to load card data from API or static fallback: ${fallbackErr?.message || 'Unknown error'}`,
      }));
      return false;
    }
  }, [normalizeData]);

  const setApiUrl = (newUrl: string) => {
    const clean = normalizeApiUrl(newUrl);
    setApiUrlState(clean);
    setStoredApiUrl(clean);
  };

  const reloadCards = async (customUrl?: string) => {
    return await loadCards(customUrl);
  };

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Idle background prefetching for common/core hero & mastermind cards
  useEffect(() => {
    if (data.isLoading) return;

    const idleCallback = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1000));
    
    idleCallback(() => {
      // Warm up first 12 heroes and masterminds' card images in background
      const candidates: string[] = [];
      [...(data.heroes || []).slice(0, 8), ...(data.masterminds || []).slice(0, 4)].forEach((group: any) => {
        if (group.imageUrl) candidates.push(group.imageUrl);
        if (Array.isArray(group.cards)) {
          group.cards.forEach((c: any) => {
            if (c.imageUrl) candidates.push(c.imageUrl);
          });
        }
      });

      // Stagger prefetch requests so we don't saturate network
      candidates.slice(0, 20).forEach((url, i) => {
        setTimeout(() => {
          prefetchImageUrl(url);
        }, i * 150);
      });
    });
  }, [data.isLoading, data.heroes, data.masterminds]);

  const value: DataState = {
    ...data,
    apiUrl,
    dataSource,
    setApiUrl,
    reloadCards,
    translateVillainsTerms,
    setTranslateVillainsTerms,
    toggleTranslateVillainsTerms,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
