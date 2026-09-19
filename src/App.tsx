import { useData } from './contexts/DataContext';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActiveSetup,
  GeneratorSettings,
  CardType,
  GameScoreResult,
} from './types';
import {
  generateSetup,
  getDefaultGeneratorSettings,
  resolveAlwaysLeads,
} from './utils/setupGenerator';
import { Header, ActiveTab } from './components/Header';
import { RandomizerView } from './components/RandomizerView';
import { ExpansionsView } from './components/ExpansionsView';
import { CardVaultView } from './components/CardVaultView';
import { ScoreTrackerView } from './components/ScoreTrackerView';
import { SavedSetupsView } from './components/SavedSetupsView';
import { CardPickerModal } from './components/CardPickerModal';
import { CardGroupModal } from './components/CardGroupModal';
import { KeywordModal } from './components/KeywordModal';
import { SettingsModal } from './components/SettingsModal';
import { RulesModal } from './components/RulesModal';
import { SymbolLibraryModal } from './components/symbols/SymbolLibraryModal';

const STORAGE_SETTINGS_KEY = 'legendary_setup_settings_v1';
const STORAGE_CURRENT_SETUP_KEY = 'legendary_setup_current_v1';
const STORAGE_SAVED_SETUPS_KEY = 'legendary_setup_saved_v1';
const STORAGE_HISTORY_KEY = 'legendary_setup_history_v1';

export default function App() {
  const data = useData() || {};
  const HEROES = data.heroes || [];
  const MASTERMINDS = data.masterminds || [];
  const VILLAINS = data.villains || [];
  const HENCHMEN = data.henchmen || [];
  const SCHEMES = data.schemes || [];
  const EXPANSIONS = data.expansions || [];

  // 1. Settings State
  const [settings, setSettings] = useState<GeneratorSettings>(() => {
    const defaults = getDefaultGeneratorSettings(EXPANSIONS);
    try {
      const stored = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaults,
          ...parsed,
          selectedUniverses: parsed.selectedUniverses || defaults.selectedUniverses,
          universeMode: parsed.universeMode || defaults.universeMode,
          excludedCardIds: parsed.excludedCardIds || defaults.excludedCardIds,
          includedCardIds: parsed.includedCardIds || defaults.includedCardIds,
        };
      }
    } catch (e) {
      console.error('Failed to load settings from storage', e);
    }
    return defaults;
  });

  // 2. Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('randomizer');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // 3. Current Active Setup
  const cleanTrailingThe = (name: string) => {
    if (!name || typeof name !== 'string') return name;
    if (/,\s*The$/i.test(name)) {
      return 'The ' + name.replace(/,\s*The$/i, '').trim();
    }
    return name;
  };

  const sanitizeSetup = (s: ActiveSetup): ActiveSetup => {
    if (!s) return s;
    return {
      ...s,
      mastermind: s.mastermind ? { ...s.mastermind, name: cleanTrailingThe(s.mastermind.name), alwaysLeads: cleanTrailingThe(s.mastermind.alwaysLeads) } : s.mastermind,
      scheme: s.scheme ? { ...s.scheme, name: cleanTrailingThe(s.scheme.name) } : s.scheme,
      heroes: (s.heroes || []).map(h => ({ ...h, name: cleanTrailingThe(h.name) })),
      villains: (s.villains || []).map(v => ({ ...v, name: cleanTrailingThe(v.name) })),
      henchmen: (s.henchmen || []).map(hn => ({ ...hn, name: cleanTrailingThe(hn.name) })),
    };
  };

  const [setup, setSetup] = useState<ActiveSetup | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CURRENT_SETUP_KEY);
      if (stored) {
        return sanitizeSetup(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load setup from storage', e);
    }
    return null;
  });

  // 4. Saved Setups
  const [savedSetups, setSavedSetups] = useState<ActiveSetup[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_SETUPS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map(sanitizeSetup);
        }
      }
    } catch (e) {
      console.error('Failed to load saved setups', e);
    }
    return [];
  });

  // 5. Game Score History
  const [gameHistory, setGameHistory] = useState<GameScoreResult[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load game history', e);
    }
    return [];
  });

  // 6. Card Picker Modal State
  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    cardType: CardType;
    currentId: string;
    slotIndex?: number;
  }>({
    isOpen: false,
    cardType: 'mastermind',
    currentId: '',
  });

  // 7. Keyword Modal State
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

  useEffect(() => {
    const handleKeywordOpen = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setActiveKeyword(customEvent.detail);
    };
    window.addEventListener('open-keyword-modal', handleKeywordOpen);
    return () => window.removeEventListener('open-keyword-modal', handleKeywordOpen);
  }, []);

  // 8. Card Group Modal State
  const [activeGroup, setActiveGroup] = useState<{ title: string; subtitle?: string; cards?: any[] } | null>(null);

  useEffect(() => {
    const handleGroupOpen = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      setActiveGroup(customEvent.detail);
    };
    window.addEventListener('open-card-group-modal', handleGroupOpen);
    return () => window.removeEventListener('open-card-group-modal', handleGroupOpen);
  }, []);

  // 9. Symbol Library Modal State
  const [isSymbolLibraryOpen, setIsSymbolLibraryOpen] = useState(false);

  useEffect(() => {
    const handleSymbolOpen = () => {
      setIsSymbolLibraryOpen(true);
    };
    window.addEventListener('open-symbol-library', handleSymbolOpen);
    return () => window.removeEventListener('open-symbol-library', handleSymbolOpen);
  }, []);

  // Synchronize cards in active setup with latest data from DB (fixes stale localStorage snapshots)
  useEffect(() => {
    if (!setup || HEROES.length === 0) return;
    setSetup((prevSetup) => {
      if (!prevSetup) return null;
      let hasChanges = false;
      const updatedHeroes = prevSetup.heroes.map((h) => {
        const fresh = HEROES.find((dbH) => dbH.id === h.id || dbH.name.toLowerCase() === h.name.toLowerCase() || dbH.name.toLowerCase() === ('the ' + h.name.toLowerCase().replace(/,\s*the$/i, '')).trim());
        if (fresh && (fresh.name !== h.name || JSON.stringify(fresh.cards) !== JSON.stringify(h.cards) || fresh.expansion !== h.expansion)) {
          hasChanges = true;
          return { ...fresh };
        }
        return h;
      });

      let updatedMastermind = prevSetup.mastermind;
      const freshMM = MASTERMINDS.find((m) => m.id === prevSetup.mastermind.id || m.name.toLowerCase() === prevSetup.mastermind.name.toLowerCase() || m.name.toLowerCase() === ('the ' + prevSetup.mastermind.name.toLowerCase().replace(/,\s*the$/i, '')).trim());
      if (freshMM && (freshMM.name !== prevSetup.mastermind.name || freshMM.alwaysLeads !== prevSetup.mastermind.alwaysLeads || JSON.stringify(freshMM.cards) !== JSON.stringify(prevSetup.mastermind.cards) || freshMM.expansion !== prevSetup.mastermind.expansion)) {
        hasChanges = true;
        updatedMastermind = { ...freshMM };
      }

      let updatedScheme = prevSetup.scheme;
      const freshScheme = SCHEMES.find((s) => s.id === prevSetup.scheme.id || s.name.toLowerCase() === prevSetup.scheme.name.toLowerCase() || s.name.toLowerCase() === ('the ' + prevSetup.scheme.name.toLowerCase().replace(/,\s*the$/i, '')).trim());
      if (freshScheme && (freshScheme.name !== prevSetup.scheme.name || freshScheme.setupRule !== prevSetup.scheme.setupRule || freshScheme.specialRules !== prevSetup.scheme.specialRules || freshScheme.evilWins !== prevSetup.scheme.evilWins || freshScheme.twistEffect !== prevSetup.scheme.twistEffect || JSON.stringify(freshScheme.cards) !== JSON.stringify(prevSetup.scheme.cards) || freshScheme.expansion !== prevSetup.scheme.expansion)) {
        hasChanges = true;
        updatedScheme = { ...freshScheme };
      }

      const updatedVillains = prevSetup.villains.map((v) => {
        const fresh = VILLAINS.find((dbV) => dbV.id === v.id || dbV.name.toLowerCase() === v.name.toLowerCase() || dbV.name.toLowerCase() === ('the ' + v.name.toLowerCase().replace(/,\s*the$/i, '')).trim());
        if (fresh && (fresh.name !== v.name || JSON.stringify(fresh.cards) !== JSON.stringify(v.cards) || fresh.expansion !== v.expansion)) {
          hasChanges = true;
          return { ...fresh };
        }
        return v;
      });

      const updatedHenchmen = prevSetup.henchmen.map((hn) => {
        const fresh = HENCHMEN.find((dbH) => dbH.id === hn.id || dbH.name.toLowerCase() === hn.name.toLowerCase() || dbH.name.toLowerCase() === ('the ' + hn.name.toLowerCase().replace(/,\s*the$/i, '')).trim());
        if (fresh && (fresh.name !== hn.name || JSON.stringify(fresh.cards) !== JSON.stringify(hn.cards) || fresh.expansion !== hn.expansion)) {
          hasChanges = true;
          return { ...fresh };
        }
        return hn;
      });

      if (!hasChanges) return prevSetup;

      return {
        ...prevSetup,
        heroes: updatedHeroes,
        mastermind: updatedMastermind,
        scheme: updatedScheme,
        villains: updatedVillains,
        henchmen: updatedHenchmen,
      };
    });
  }, [HEROES, MASTERMINDS, VILLAINS, HENCHMEN, SCHEMES]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      if (setup) {
        localStorage.setItem(STORAGE_CURRENT_SETUP_KEY, JSON.stringify(setup));
      } else {
        localStorage.removeItem(STORAGE_CURRENT_SETUP_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [setup]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED_SETUPS_KEY, JSON.stringify(savedSetups));
    } catch (e) {
      console.error(e);
    }
  }, [savedSetups]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(gameHistory));
    } catch (e) {
      console.error(e);
    }
  }, [gameHistory]);

  // Actions
  const handleRandomizeAll = useCallback(() => {
    const newSetup = generateSetup(settings, { EXPANSIONS, SCHEMES, MASTERMINDS, HEROES, VILLAINS, HENCHMEN }, setup || undefined);
    setSetup(newSetup);
  }, [settings, setup, EXPANSIONS, SCHEMES, MASTERMINDS, HEROES, VILLAINS, HENCHMEN]);

  const handlePlayerCountChange = (count: number) => {
    const updatedSettings = { ...settings, playerCount: count };
    setSettings(updatedSettings);
    if (setup) {
      const updatedSetup = generateSetup(updatedSettings, { EXPANSIONS, SCHEMES, MASTERMINDS, HEROES, VILLAINS, HENCHMEN }, setup);
      setSetup(updatedSetup);
    }
  };

  const handleToggleLock = (
    type: 'scheme' | 'mastermind' | 'hero' | 'villain' | 'henchman',
    index?: number
  ) => {
    if (!setup) return;
    setSetup((prev) => {
      if (!prev) return null;
      const currentLocked = { ...prev.lockedSlots };

      if (type === 'mastermind') {
        currentLocked.mastermind = !currentLocked.mastermind;
      } else if (type === 'scheme') {
        currentLocked.scheme = !currentLocked.scheme;
      } else if (type === 'hero') {
        if (index !== undefined) {
          currentLocked.heroes = {
            ...currentLocked.heroes,
            [index]: !currentLocked.heroes?.[index],
          };
        } else {
          const allLocked = prev.heroes.length > 0 && prev.heroes.every((_, i) => currentLocked.heroes?.[i]);
          currentLocked.heroes = Object.fromEntries(
            prev.heroes.map((_, i) => [i, !allLocked])
          );
        }
      } else if (type === 'villain') {
        if (index !== undefined) {
          currentLocked.villains = {
            ...currentLocked.villains,
            [index]: !currentLocked.villains?.[index],
          };
        } else {
          const allLocked = prev.villains.length > 0 && prev.villains.every((_, i) => currentLocked.villains?.[i]);
          currentLocked.villains = Object.fromEntries(
            prev.villains.map((_, i) => [i, !allLocked])
          );
        }
      } else if (type === 'henchman') {
        if (index !== undefined) {
          currentLocked.henchmen = {
            ...currentLocked.henchmen,
            [index]: !currentLocked.henchmen?.[index],
          };
        } else {
          const allLocked = prev.henchmen.length > 0 && prev.henchmen.every((_, i) => currentLocked.henchmen?.[i]);
          currentLocked.henchmen = Object.fromEntries(
            prev.henchmen.map((_, i) => [i, !allLocked])
          );
        }
      }

      return {
        ...prev,
        lockedSlots: currentLocked,
      };
    });
  };

  const handleToggleLockAll = () => {
    if (!setup) return;
    setSetup((prev) => {
      if (!prev) return null;
      const isAnyUnlocked =
        !prev.lockedSlots.mastermind ||
        !prev.lockedSlots.scheme ||
        prev.heroes.some((_, i) => !prev.lockedSlots.heroes?.[i]) ||
        prev.villains.some((_, i) => !prev.lockedSlots.villains?.[i]) ||
        prev.henchmen.some((_, i) => !prev.lockedSlots.henchmen?.[i]);

      if (isAnyUnlocked) {
        return {
          ...prev,
          lockedSlots: {
            mastermind: true,
            scheme: true,
            heroes: Object.fromEntries(prev.heroes.map((_, i) => [i, true])),
            villains: Object.fromEntries(prev.villains.map((_, i) => [i, true])),
            henchmen: Object.fromEntries(prev.henchmen.map((_, i) => [i, true])),
          },
        };
      } else {
        return {
          ...prev,
          lockedSlots: {},
        };
      }
    });
  };

  const applySingleChange = (type: CardType, card: any, index?: number) => {
    if (!setup) return;
    const tempSetup = { ...setup };
    
    tempSetup.lockedSlots = {
      mastermind: true,
      scheme: true,
      heroes: Object.fromEntries(setup.heroes.map((_, i) => [i, true])),
      villains: Object.fromEntries(setup.villains.map((_, i) => [i, true])),
      henchmen: Object.fromEntries(setup.henchmen.map((_, i) => [i, true])),
    };

    if (type === 'mastermind') {
      tempSetup.mastermind = card;

      const shouldEnforceLeads = settings.playerCount > 1 && settings.alwaysLeadsRule !== 'random';
      if (shouldEnforceLeads && card.alwaysLeads) {
        const enabledExpSet = new Set(
          settings.enabledExpansions.length > 0 ? settings.enabledExpansions : ['base']
        );
        const villainPool = VILLAINS.filter((v) => enabledExpSet.has(v.expansion));
        const henchmanPool = HENCHMEN.filter((h) => enabledExpSet.has(h.expansion));

        const leads = resolveAlwaysLeads(
          card.alwaysLeads,
          villainPool.length > 0 ? villainPool : VILLAINS,
          VILLAINS,
          henchmanPool.length > 0 ? henchmanPool : HENCHMEN,
          HENCHMEN
        );

        const rawText = (card.alwaysLeads || '').toLowerCase();
        const normalizedQuotes = card.alwaysLeads.replace(/[“”"’’']/g, '"');
        const quotedMatches = [...normalizedQuotes.matchAll(/"([^"]+)"/g)].map((m) => m[1].toLowerCase());

        if (leads.ledVillain) {
          const currentVillains = [...tempSetup.villains];
          let isVillainSatisfied = false;

          if (quotedMatches.length > 0 && rawText.startsWith('any')) {
            isVillainSatisfied = currentVillains.some((v) =>
              quotedMatches.some((q) => v.name.toLowerCase().includes(q))
            );
          } else if (/^any villain group/i.test(rawText)) {
            isVillainSatisfied = currentVillains.length > 0;
          } else {
            isVillainSatisfied = currentVillains.some(
              (v) => v.id === leads.ledVillain!.id || v.name.toLowerCase() === leads.ledVillain!.name.toLowerCase()
            );
          }

          if (!isVillainSatisfied && currentVillains.length > 0) {
            let targetIdx = currentVillains.findIndex((_, i) => !setup.lockedSlots?.villains?.[i]);
            if (targetIdx === -1) targetIdx = currentVillains.length - 1;
            currentVillains[targetIdx] = leads.ledVillain;
            tempSetup.villains = currentVillains;
          }
        }

        if (leads.ledHenchman) {
          const currentHenchmen = [...tempSetup.henchmen];
          let isHenchmanSatisfied = false;

          if (/and\s+(?:any|a)\s+sentinel\s+henchm/i.test(rawText)) {
            isHenchmanSatisfied = currentHenchmen.some((h) => h.name.toLowerCase().includes('sentinel'));
          } else if (/and\s+(?:any|a)\s+shi['’]?ar\s+henchm/i.test(rawText)) {
            isHenchmanSatisfied = currentHenchmen.some((h) => h.name.toLowerCase().includes("shi'ar") || h.name.toLowerCase().includes('shiar'));
          } else {
            isHenchmanSatisfied = currentHenchmen.some(
              (h) => h.id === leads.ledHenchman!.id || h.name.toLowerCase() === leads.ledHenchman!.name.toLowerCase()
            );
          }

          if (!isHenchmanSatisfied && currentHenchmen.length > 0) {
            let targetIdx = currentHenchmen.findIndex((_, i) => !setup.lockedSlots?.henchmen?.[i]);
            if (targetIdx === -1) targetIdx = currentHenchmen.length - 1;
            currentHenchmen[targetIdx] = leads.ledHenchman;
            tempSetup.henchmen = currentHenchmen;
          }
        }
      }
    } else if (type === 'scheme') tempSetup.scheme = card;
    else if (type === 'hero' && index !== undefined) {
      tempSetup.heroes = [...setup.heroes];
      tempSetup.heroes[index] = card;
    }
    else if (type === 'villain' && index !== undefined) {
      tempSetup.villains = [...setup.villains];
      tempSetup.villains[index] = card;
    }
    else if (type === 'henchman' && index !== undefined) {
      tempSetup.henchmen = [...setup.henchmen];
      tempSetup.henchmen[index] = card;
    }

    const refreshed = generateSetup(settings, { EXPANSIONS, SCHEMES, MASTERMINDS, HEROES, VILLAINS, HENCHMEN }, tempSetup);
    refreshed.lockedSlots = { ...setup.lockedSlots };
    setSetup(refreshed);
  };

  const handleRerollSingle = (type: CardType, index?: number) => {
    if (!setup) return;
    const enabledExpSet = new Set(settings.enabledExpansions);
    const excludedSet = new Set(settings.excludedCardIds);

    let pool: any[] = [];
    let fallback: any[] = [];

    if (type === 'mastermind') {
      pool = MASTERMINDS.filter(m => enabledExpSet.has(m.expansion) && !excludedSet.has(m.id) && m.id !== setup.mastermind.id);
      fallback = MASTERMINDS.filter(m => m.id !== setup.mastermind.id);
    } else if (type === 'scheme') {
      pool = SCHEMES.filter(s => enabledExpSet.has(s.expansion) && !excludedSet.has(s.id) && s.id !== setup.scheme.id);
      fallback = SCHEMES.filter(s => s.id !== setup.scheme.id);
    } else if (type === 'hero') {
      const existing = new Set(setup.heroes.map(h => h.id));
      pool = HEROES.filter(h => enabledExpSet.has(h.expansion) && !excludedSet.has(h.id) && !existing.has(h.id));
      fallback = HEROES.filter(h => !existing.has(h.id));
    } else if (type === 'villain') {
      const existing = new Set(setup.villains.map(v => v.id));
      pool = VILLAINS.filter(v => enabledExpSet.has(v.expansion) && !excludedSet.has(v.id) && !existing.has(v.id));
      fallback = VILLAINS.filter(v => !existing.has(v.id));
    } else if (type === 'henchman') {
      const existing = new Set(setup.henchmen.map(h => h.id));
      pool = HENCHMEN.filter(h => enabledExpSet.has(h.expansion) && !excludedSet.has(h.id) && !existing.has(h.id));
      fallback = HENCHMEN.filter(h => !existing.has(h.id));
    }

    const chosen = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : fallback[0];
    if (chosen) {
      applySingleChange(type, chosen, index);
    }
  };

  const handleOpenCardPicker = (
    type: CardType,
    currentId: string,
    slotIndex?: number
  ) => {
    setPickerState({
      isOpen: true,
      cardType: type,
      currentId,
      slotIndex,
    });
  };

  const handleSelectCardFromPicker = (
    type: CardType,
    card: any,
    slotIndex?: number
  ) => {
    applySingleChange(type, card, slotIndex);
  };

  const handleSaveSetup = (current: ActiveSetup) => {
    if (savedSetups.some((s) => s.id === current.id)) {
      setSavedSetups((prev) => prev.filter((s) => s.id !== current.id));
    } else {
      setSavedSetups((prev) => [current, ...prev]);
    }
  };

  const handleLoadSavedSetup = (saved: ActiveSetup) => {
    setSetup(saved);
    setSettings((prev) => ({ ...prev, playerCount: saved.playerCount }));
    setActiveTab('randomizer');
  };

  const handleDeleteSavedSetup = (id: string) => {
    setSavedSetups((prev) => prev.filter((s) => s.id !== id));
  };

  const handleStartScoring = (_setup?: ActiveSetup) => {
    setActiveTab('score');
  };

  const handleSaveGameResult = (result: GameScoreResult) => {
    setGameHistory((prev) => [result, ...prev]);
  };

  const handleDeleteGameResult = (id: string) => {
    setGameHistory((prev) => prev.filter((g) => g.id !== id));
  };

  // Expansions View Controls
  const handleToggleExpansion = (id: string) => {
    setSettings((prev) => {
      const exists = prev.enabledExpansions.includes(id);
      const updated = exists
        ? prev.enabledExpansions.filter((x) => x !== id)
        : [...prev.enabledExpansions, id];
      return {
        ...prev,
        enabledExpansions: updated.length > 0 ? updated : ['base'],
      };
    });
  };

  const handleSetExpansions = (ids: string[], enabled: boolean) => {
    setSettings((prev) => {
      let updated = [...prev.enabledExpansions];
      if (enabled) {
        ids.forEach(id => {
          if (!updated.includes(id)) updated.push(id);
        });
      } else {
        updated = updated.filter(id => !ids.includes(id));
      }
      return {
        ...prev,
        enabledExpansions: updated.length > 0 ? updated : ['base'],
      };
    });
  };

  const handleSelectPresetsExpansions = (boxType: 'Core' | 'Big Box' | 'Small Box') => {
    const filtered = EXPANSIONS.filter(
      (e) => e.boxType === 'Core' || e.boxType === boxType
    ).map((e) => e.id);
    setSettings((prev) => ({
      ...prev,
      enabledExpansions: filtered,
    }));
  };

  const handleResetDefaultExpansions = () => {
    setSettings((prev) => ({
      ...prev,
      enabledExpansions: EXPANSIONS.map((e) => e.id),
    }));
  };

  const isCurrentSetupSaved = setup ? savedSetups.some((s) => s.id === setup.id) : false;

  // Accurately compute enabled expansions count from registered expansions
  const validExpansionsSet = useMemo(() => new Set(EXPANSIONS.map(e => e.id)), [EXPANSIONS]);
  const validEnabledExpansionsCount = useMemo(() => {
    return settings.enabledExpansions.filter(id => validExpansionsSet.has(id)).length;
  }, [settings.enabledExpansions, validExpansionsSet]);

  if (data.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Error Loading Data</h2>
        <p className="text-slate-300">{data.error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      {/* Header */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) =>
          setSettings((prev) => ({ ...prev, ...newVals }))
        }
      />
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        setup={setup}
      />
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedSetupsCount={savedSetups.length}
        enabledExpansionsCount={validEnabledExpansionsCount}
        totalExpansionsCount={EXPANSIONS.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSymbols={() => setIsSymbolLibraryOpen(true)}
        onQuickRandomize={() => {
          handleRandomizeAll();
          if (activeTab !== 'randomizer') setActiveTab('randomizer');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
        {activeTab === 'randomizer' && (
          <RandomizerView
            setup={setup}
            playerCount={settings.playerCount}
            onPlayerCountChange={handlePlayerCountChange}
            onRandomizeAll={handleRandomizeAll}
            onToggleLock={handleToggleLock}
            onToggleLockAll={handleToggleLockAll}
            onRerollSingle={handleRerollSingle}
            onOpenCardPicker={handleOpenCardPicker}
            onSaveSetup={handleSaveSetup}
            onStartScoring={handleStartScoring}
            onClearSetup={() => {
              setSetup(null);
              try {
                localStorage.removeItem(STORAGE_CURRENT_SETUP_KEY);
              } catch (e) {
                console.error(e);
              }
            }}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
            isSaved={isCurrentSetupSaved}
          />
        )}

        {activeTab === 'expansions' && (
          <ExpansionsView
            enabledExpansions={settings.enabledExpansions}
            onToggleExpansion={handleToggleExpansion}
            onSetExpansions={handleSetExpansions}
            onSelectPresets={handleSelectPresetsExpansions}
            onResetDefault={handleResetDefaultExpansions}
            universeMode={settings.universeMode}
            selectedUniverses={settings.selectedUniverses}
            onUpdateUniverseMode={(mode, universes) => {
              setSettings((prev) => {
                const validUniverses = mode === 'mix' ? [...new Set(EXPANSIONS.map(e => e.universe || 'Marvel'))] : universes;
                let newEnabled = [...prev.enabledExpansions];
                
                if (mode === 'mix') {
                  newEnabled = EXPANSIONS.map(e => e.id);
                } else {
                  const prevValid = (prev.universeMode === 'mix' ? [...new Set(EXPANSIONS.map(e => e.universe || 'Marvel'))] : prev.selectedUniverses) || [];
                  const added = validUniverses.filter(u => !prevValid.includes(u as any));
                  const removed = prevValid.filter(u => !validUniverses.includes(u as any));
                  
                  added.forEach(u => {
                    const toAdd = EXPANSIONS.filter(e => (e.universe || 'Marvel') === u).map(e => e.id);
                    newEnabled = [...new Set([...newEnabled, ...toAdd])];
                  });
                  
                  removed.forEach(u => {
                    const toRemove = EXPANSIONS.filter(e => (e.universe || 'Marvel') === u).map(e => e.id);
                    newEnabled = newEnabled.filter(id => !toRemove.includes(id));
                  });
                }
                
                // Sanitize to only valid IDs
                newEnabled = newEnabled.filter(id => validExpansionsSet.has(id));
                if (newEnabled.length === 0 && validExpansionsSet.has('base')) {
                  newEnabled.push('base');
                }

                return {
                  ...prev,
                  universeMode: mode,
                  selectedUniverses: universes,
                  enabledExpansions: newEnabled,
                };
              });
            }}
          />
        )}

        {activeTab === 'vault' && <CardVaultView />}

        {activeTab === 'score' && (
          <ScoreTrackerView
            currentSetup={setup || undefined}
            gameHistory={gameHistory}
            onSaveGameResult={handleSaveGameResult}
            onDeleteGameResult={handleDeleteGameResult}
          />
        )}

        {activeTab === 'saved' && (
          <SavedSetupsView
            savedSetups={savedSetups}
            onLoadSetup={handleLoadSavedSetup}
            onDeleteSavedSetup={handleDeleteSavedSetup}
          />
        )}
      </main>

      {/* Manual Card Picker Modal */}
      <CardPickerModal
        isOpen={pickerState.isOpen}
        onClose={() => setPickerState((prev) => ({ ...prev, isOpen: false }))}
        cardType={pickerState.cardType}
        slotIndex={pickerState.slotIndex}
        currentCardId={pickerState.currentId}
        enabledExpansions={settings.enabledExpansions}
        onSelectCard={handleSelectCardFromPicker}
      />

      <CardGroupModal
        title={activeGroup?.title || ''}
        subtitle={activeGroup?.subtitle}
        cards={activeGroup?.cards}
        isOpen={!!activeGroup}
        onClose={() => setActiveGroup(null)}
      />

      <KeywordModal
        keyword={activeKeyword}
        isOpen={!!activeKeyword}
        onClose={() => setActiveKeyword(null)}
      />

      <SymbolLibraryModal
        isOpen={isSymbolLibraryOpen}
        onClose={() => setIsSymbolLibraryOpen(false)}
      />
    </div>
  );
}
