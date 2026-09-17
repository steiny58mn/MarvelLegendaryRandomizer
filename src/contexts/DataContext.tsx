import React, { createContext, useContext, useState, useEffect } from 'react';
import { HeroCard, MastermindCard, VillainGroup, HenchmanGroup, SchemeCard, Expansion } from '../types';
import { prefetchImageUrl } from '../utils/imageOptimizer';

interface DataState {
  expansions: Expansion[];
  heroes: HeroCard[];
  masterminds: MastermindCard[];
  villains: VillainGroup[];
  henchmen: HenchmanGroup[];
  schemes: SchemeCard[];
  isLoading: boolean;
  error: string | null;
}

const defaultState: DataState = {
  expansions: [],
  heroes: [],
  masterminds: [],
  villains: [],
  henchmen: [],
  schemes: [],
  isLoading: true,
  error: null,
};

const DataContext = createContext<DataState>(defaultState);

export const useData = () => useContext(DataContext);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DataState>(defaultState);

  // Helper to normalize any name ending in ", The" to "The ..."
  const normalizeData = (raw: any): DataState => {
    const cleanThe = (name: string) => {
      if (!name || typeof name !== 'string') return name;
      if (/,\s*The$/i.test(name)) {
        return 'The ' + name.replace(/,\s*The$/i, '').trim();
      }
      return name;
    };

    const processItem = (item: any) => {
      if (!item) return item;
      const clean = { ...item, name: cleanThe(item.name) };
      if (clean.alwaysLeads) clean.alwaysLeads = cleanThe(clean.alwaysLeads);
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
      heroes: (raw.heroes || []).map(processItem),
      masterminds: (raw.masterminds || []).map(processItem),
      villains: (raw.villains || []).map(processItem),
      henchmen: (raw.henchmen || []).map(processItem),
      schemes: (raw.schemes || []).map(processItem),
      isLoading: false,
      error: null,
    };
  };

  useEffect(() => {
    // Try Express backend first, gracefully fallback to static cards-data.json (e.g. on Cloudflare Pages, Netlify, Vercel static)
    const loadCards = async () => {
      try {
        const res = await fetch('/api/cards');
        if (res.ok) {
          const fetched = await res.json();
          setData(normalizeData(fetched));
          return;
        }
        throw new Error(`API returned ${res.status}`);
      } catch (apiErr) {
        try {
          const fallbackRes = await fetch('/cards-data.json');
          if (fallbackRes.ok) {
            const fetched = await fallbackRes.json();
            setData(normalizeData(fetched));
            return;
          }
          throw new Error('Fallback failed');
        } catch {
          setData(prev => ({ ...prev, isLoading: false, error: 'Unable to load card data. Please refresh or check connection.' }));
        }
      }
    };

    loadCards();
  }, []);

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

  return (
    <DataContext.Provider value={data}>
      {children}
    </DataContext.Provider>
  );
};
