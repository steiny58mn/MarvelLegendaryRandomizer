import { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from './contexts/DataContext';
import {
  ActiveSetup,
  CardType,
  RandomizerSettings,
  GameScoreResult,
  LegendaryUniverse,
  UniverseMode,
} from './types';
import { generateSetup, resolveAlwaysLeads } from './utils/setupGenerator';
import { RandomizerView } from './components/RandomizerView';
import { CardVaultView } from './components/CardVaultView';
import { ExpansionsView } from './components/ExpansionsView';
import { SavedSetupsView } from './components/SavedSetupsView';
import { ScoreTrackerView } from './components/ScoreTrackerView';
import { SettingsModal } from './components/SettingsModal';
import { CardPickerModal } from './components/CardPickerModal';
import { KeywordModal } from './components/KeywordModal';
import { CardGroupModal } from './components/CardGroupModal';
import { SymbolLibraryModal } from './components/symbols/SymbolLibraryModal';
import { RulesModal } from './components/RulesModal';
import {
  Dices,
  Database,
  Layers,
  Bookmark,
  Trophy,
  SlidersHorizontal,
  HelpCircle,
} from 'lucide-react';

const STORAGE_SETTINGS_KEY = 'legendary_randomizer_settings_v3';
const STORAGE_CURRENT_SETUP_KEY = 'legendary_randomizer_active_setup_v3';
const STORAGE_SAVED_SETUPS_KEY = 'legendary_randomizer_saved_setups_v3';
const STORAGE_HISTORY_KEY = 'legendary_randomizer_game_history_v3';

export function App() {
  const data = useData();
  const EXPANSIONS = data.expansions;
  const SCHEMES = data.schemes;
  const MASTERMINDS = data.masterminds;
  const HEROES = data.heroes;
  const VILLAINS = data.villains;
  const HENCHMEN = data.henchmen;

  // 1. Navigation State
  const [activeTab, setActiveTab] = useState<
    'randomizer' | 'database' | 'expansions' | 'saved' | 'score'
  >('randomizer');

  // 2. Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // 3. User Settings State
  const [settings, setSettings] = useState<RandomizerSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return {
      playerCount: 2,
      soloVariant: 'standard',
      includeSpecialBystanders: true,
      alwaysLeadsRule: 'balanced',
      teamSynergyMode: 'none',
      universeMode: 'mix',
      selectedUniverses: ['Marvel', 'DC'],
      enabledExpansions: [],
      excludedCardIds: [],
    };
  });

  // Ensure all expansions enabled by default if none configured
  useEffect(() => {
    if (EXPANSIONS.length > 0 && settings.enabledExpansions.length === 0) {
      setSettings((prev) => ({
        ...prev,
        enabledExpansions: EXPANSIONS.map((e) => e.id),
      }));
    }
  }, [EXPANSIONS]);

  // 4. Active Setup State
  const [setup, setSetup] = useState<ActiveSetup | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CURRENT_SETUP_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load active setup', e);
    }
    return null;
  });

  // 5. Saved Setups & Score History State
  const [savedSetups, setSavedSetups] = useState<ActiveSetup[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_SETUPS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load saved setups', e);
    }
    return [];
  });

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

      let bystandersCount = prevSetup.bystandersCount;
      if (bystandersCount === 0 || bystandersCount === undefined) {
        bystandersCount = prevSetup.playerCount === 1 ? 1 : prevSetup.playerCount <= 3 ? 2 : prevSetup.playerCount === 4 ? 8 : 12;
        hasChanges = true;
      }

      let updatedBreakdown = prevSetup.deckBreakdown;
      if (updatedBreakdown && (updatedBreakdown.bystanders === 0 || updatedBreakdown.bystanders === undefined)) {
        updatedBreakdown = {
          ...updatedBreakdown,
          bystanders: bystandersCount,
        };
        hasChanges = true;
      }

      if (!hasChanges) return prevSetup;

      return {
        ...prevSetup,
        heroes: updatedHeroes,
        mastermind: updatedMastermind,
        scheme: updatedScheme,
        villains: updatedVillains,
        henchmen: updatedHenchmen,
        bystandersCount,
        deckBreakdown: updatedBreakdown,
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
      const isAllCurrentlyLocked =
        Boolean(prev.lockedSlots?.mastermind) &&
        Boolean(prev.lockedSlots?.scheme) &&
        prev.heroes.length > 0 &&
        prev.heroes.every((_, i) => Boolean(prev.lockedSlots?.heroes?.[i])) &&
        prev.villains.length > 0 &&
        prev.villains.every((_, i) => Boolean(prev.lockedSlots?.villains?.[i])) &&
        prev.henchmen.length > 0 &&
        prev.henchmen.every((_, i) => Boolean(prev.lockedSlots?.henchmen?.[i]));

      const targetLockState = !isAllCurrentlyLocked;

      return {
        ...prev,
        lockedSlots: {
          mastermind: targetLockState,
          scheme: targetLockState,
          heroes: Object.fromEntries(prev.heroes.map((_, i) => [i, targetLockState])),
          villains: Object.fromEntries(prev.villains.map((_, i) => [i, targetLockState])),
          henchmen: Object.fromEntries(prev.henchmen.map((_, i) => [i, targetLockState])),
        },
      };
    });
  };

  const applySingleChange = (
    type: CardType,
    card: any,
    index?: number
  ) => {
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
          } else if (/and\s+(?:any|a)\s+shi['']?ar\s+henchm/i.test(rawText)) {
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
    const enabledExpSet = new Set(settings.enabledExpansions.length > 0 ? settings.enabledExpansions : EXPANSIONS.map(e => e.id));
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
        enabledExpansions: updated,
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
        enabledExpansions: updated,
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
      {/* Modals */}
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
      <SymbolLibraryModal
        isOpen={isSymbolLibraryOpen}
        onClose={() => setIsSymbolLibraryOpen(false)}
      />
      <KeywordModal
        keywordName={activeKeyword}
        onClose={() => setActiveKeyword(null)}
      />
      <CardGroupModal
        isOpen={!!activeGroup}
        onClose={() => setActiveGroup(null)}
        title={activeGroup?.title || ''}
        subtitle={activeGroup?.subtitle}
        cards={activeGroup?.cards}
      />
      <CardPickerModal
        isOpen={pickerState.isOpen}
        cardType={pickerState.cardType}
        currentCardId={pickerState.currentId}
        slotIndex={pickerState.slotIndex}
        enabledExpansions={settings.enabledExpansions}
        onClose={() => setPickerState((prev) => ({ ...prev, isOpen: false }))}
        onSelectCard={handleSelectCardFromPicker}
      />

      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setActiveTab('randomizer')}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform shadow-inner">
                <Dices className="w-5 h-5" />
              </div>
              <div className="mt-1">
                <h1 className="text-lg font-black tracking-wider text-slate-100 uppercase font-['Cinzel'] leading-none group-hover:text-amber-400 transition-colors">
                  Legendary
                </h1>
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-widest leading-tight block">
                  Multiverse Randomizer
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
              <button
                onClick={() => setActiveTab('randomizer')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'randomizer'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Dices className="w-4 h-4" />
                <span>Randomizer</span>
              </button>

              <button
                onClick={() => setActiveTab('database')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'database'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Cards DB</span>
              </button>

              <button
                onClick={() => setActiveTab('expansions')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
                  activeTab === 'expansions'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Expansions</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                  {validEnabledExpansionsCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('saved')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'saved'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Saved</span>
                {savedSetups.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-mono">
                    {savedSetups.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('score')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'score'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Tracker</span>
              </button>
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRulesModalOpen(true)}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 transition-colors shadow-sm flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Rules & Active Scenario"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Rules</span>
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 transition-colors shadow-sm flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Settings"
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
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
            onClearSetup={() => setSetup(null)}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
            isSaved={isCurrentSetupSaved}
          />
        )}

        {activeTab === 'database' && <CardVaultView />}

        {activeTab === 'expansions' && (
          <ExpansionsView
            enabledExpansions={settings.enabledExpansions}
            onToggleExpansion={handleToggleExpansion}
            onSetExpansions={handleSetExpansions}
            onSelectPresets={handleSelectPresetsExpansions}
            onResetDefault={handleResetDefaultExpansions}
            universeMode={settings.universeMode}
            selectedUniverses={settings.selectedUniverses}
            onUpdateUniverseMode={(mode: UniverseMode, universes: LegendaryUniverse[]) =>
              setSettings((prev) => ({
                ...prev,
                universeMode: mode,
                selectedUniverses: universes,
              }))
            }
          />
        )}

        {activeTab === 'saved' && (
          <SavedSetupsView
            savedSetups={savedSetups}
            onLoadSetup={handleLoadSavedSetup}
            onDeleteSetup={handleDeleteSavedSetup}
          />
        )}

        {activeTab === 'score' && (
          <ScoreTrackerView
            setup={setup}
            onSaveGameResult={handleSaveGameResult}
            gameHistory={gameHistory}
            onDeleteGameResult={handleDeleteGameResult}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-xl safe-area-inset-bottom">
        <div className="grid grid-cols-5 p-1">
          <button
            onClick={() => setActiveTab('randomizer')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold tracking-tight transition-colors cursor-pointer ${
              activeTab === 'randomizer'
                ? 'text-amber-400 bg-amber-500/10 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dices className="w-4 h-4 mb-1" />
            <span>Random</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold tracking-tight transition-colors cursor-pointer ${
              activeTab === 'database'
                ? 'text-amber-400 bg-amber-500/10 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 mb-1" />
            <span>Cards</span>
          </button>

          <button
            onClick={() => setActiveTab('expansions')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold tracking-tight transition-colors relative cursor-pointer ${
              activeTab === 'expansions'
                ? 'text-amber-400 bg-amber-500/10 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 mb-1" />
            <span>Sets</span>
            <span className="absolute top-1.5 right-2 px-1 py-0.2 rounded-full text-[8px] bg-slate-800 text-slate-300 font-mono">
              {validEnabledExpansionsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold tracking-tight transition-colors cursor-pointer ${
              activeTab === 'saved'
                ? 'text-amber-400 bg-amber-500/10 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4 mb-1" />
            <span>Saved</span>
          </button>

          <button
            onClick={() => setActiveTab('score')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold tracking-tight transition-colors cursor-pointer ${
              activeTab === 'score'
                ? 'text-amber-400 bg-amber-500/10 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 mb-1" />
            <span>Score</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
