import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sparkles, AlertCircle, Dices } from 'lucide-react';
import { useData } from './contexts/DataContext';
import { Header, ActiveTab } from './components/Header';
import { RandomizerView } from './components/RandomizerView';
import { ExpansionsView } from './components/ExpansionsView';
import { CardVaultView } from './components/CardVaultView';
import { SavedSetupsView } from './components/SavedSetupsView';
import { ScoreTrackerView } from './components/ScoreTrackerView';
import { SettingsModal } from './components/SettingsModal';
import { CardPickerModal } from './components/CardPickerModal';
import { KeywordModal } from './components/KeywordModal';
import { CardGroupModal } from './components/CardGroupModal';
import { SymbolLibraryModal } from './components/symbols/SymbolLibraryModal';
import { RulesModal } from './components/RulesModal';
import {
  ActiveSetup,
  CardType,
  RandomizerSettings,
  GameScoreResult,
} from './types';
import {
  generateSetup,
  isVillainLedByMastermind,
  isHenchmanLedByMastermind,
  updateSetupForMastermind,
  updateSetupForScheme,
} from './utils/setupGenerator';

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
    'randomizer' | 'vault' | 'expansions' | 'saved' | 'score'
  >('randomizer');

  // 2. Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // 3. User Settings State
  const [settings, setSettings] = useState<RandomizerSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          alwaysLeadsRule:
            parsed.alwaysLeadsRule && ['guarantee', 'prioritize', 'ignore'].includes(parsed.alwaysLeadsRule)
              ? parsed.alwaysLeadsRule
              : 'guarantee',
          ignoreAlwaysLeadsInSolo: Boolean(parsed.ignoreAlwaysLeadsInSolo),
        };
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return {
      playerCount: 2,
      soloVariant: 'standard',
      includeSpecialBystanders: true,
      alwaysLeadsRule: 'guarantee',
      ignoreAlwaysLeadsInSolo: false,
      teamSynergyMode: 'none',
      universeMode: 'mix',
      selectedUniverses: ['Marvel', 'DC'],
      enabledExpansions: [],
      excludedCardIds: [],
    };
  });

  // Ensure all expansions enabled by default if none configured and sync universes
  useEffect(() => {
    if (EXPANSIONS.length > 0) {
      setSettings((prev) => {
        let enabled = prev.enabledExpansions;
        if (!enabled || enabled.length === 0) {
          enabled = EXPANSIONS.map((e) => e.id);
        }
        return updateExpansionsAndUniverses(prev, enabled);
      });
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
  const [activeGroup, setActiveGroup] = useState<{
    title: string;
    subtitle?: string;
    cards?: any[];
    cardType?: string;
  } | null>(null);

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

      const matchCard = (dbItem: any, targetItem: any) => {
        if (!dbItem || !targetItem) return false;
        if (dbItem.id && targetItem.id && dbItem.id === targetItem.id) return true;
        const dbName = typeof dbItem.name === 'string' ? dbItem.name.trim().toLowerCase() : '';
        const targetName = typeof targetItem.name === 'string' ? targetItem.name.trim().toLowerCase() : '';
        if (!dbName || !targetName) return false;
        if (dbName === targetName) return true;
        if (dbName === ('the ' + targetName.replace(/,\s*the$/i, '')).trim()) return true;
        return false;
      };

      const updatedHeroes = (prevSetup.heroes || []).map((h) => {
        if (!h) return h;
        const fresh = HEROES.find((dbH) => matchCard(dbH, h));
        if (fresh && (fresh.name !== h.name || JSON.stringify(fresh.cards) !== JSON.stringify(h.cards) || fresh.expansion !== h.expansion)) {
          hasChanges = true;
          return { ...fresh };
        }
        return h;
      });

      let updatedMastermind = prevSetup.mastermind;
      if (prevSetup.mastermind) {
        const freshMM = MASTERMINDS.find((m) => matchCard(m, prevSetup.mastermind));
        if (freshMM && (freshMM.name !== prevSetup.mastermind.name || freshMM.alwaysLeads !== prevSetup.mastermind.alwaysLeads || JSON.stringify(freshMM.cards) !== JSON.stringify(prevSetup.mastermind.cards) || freshMM.expansion !== prevSetup.mastermind.expansion)) {
          hasChanges = true;
          updatedMastermind = { ...freshMM };
        }
      }

      let updatedScheme = prevSetup.scheme;
      if (prevSetup.scheme) {
        const freshScheme = SCHEMES.find((s) => matchCard(s, prevSetup.scheme));
        if (freshScheme && (freshScheme.name !== prevSetup.scheme.name || freshScheme.setupRule !== prevSetup.scheme.setupRule || freshScheme.specialRules !== prevSetup.scheme.specialRules || freshScheme.evilWins !== prevSetup.scheme.evilWins || freshScheme.twistEffect !== prevSetup.scheme.twistEffect || JSON.stringify(freshScheme.cards) !== JSON.stringify(prevSetup.scheme.cards) || freshScheme.expansion !== prevSetup.scheme.expansion)) {
          hasChanges = true;
          updatedScheme = { ...freshScheme };
        }
      }

      const updatedVillains = (prevSetup.villains || []).map((v) => {
        if (!v) return v;
        const fresh = VILLAINS.find((dbV) => matchCard(dbV, v));
        if (fresh && (fresh.name !== v.name || JSON.stringify(fresh.cards) !== JSON.stringify(v.cards) || fresh.expansion !== v.expansion)) {
          hasChanges = true;
          return { ...fresh };
        }
        return v;
      });

      const updatedHenchmen = (prevSetup.henchmen || []).map((hn) => {
        if (!hn) return hn;
        const fresh = HENCHMEN.find((dbH) => matchCard(dbH, hn));
        if (fresh && (fresh.name !== hn.name || JSON.stringify(fresh.cards) !== JSON.stringify(hn.cards) || fresh.expansion !== hn.expansion)) {
          hasChanges = true;
          return { ...fresh };
        }
        return hn;
      });

      let bystandersCount = prevSetup.bystandersCount;
      if (bystandersCount === 0 || bystandersCount == null) {
        bystandersCount = prevSetup.playerCount === 1 ? 1 : prevSetup.playerCount <= 3 ? 2 : prevSetup.playerCount === 4 ? 8 : 12;
        hasChanges = true;
      }

      let updatedBreakdown = prevSetup.deckBreakdown;
      if (updatedBreakdown && (updatedBreakdown.bystanders === 0 || updatedBreakdown.bystanders == null)) {
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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGlobalOptimizeConfirm, setShowGlobalOptimizeConfirm] = useState(false);

  const handleGlobalOptimizeClick = () => {
    const hasLocks = setup && (
      setup.lockedSlots?.mastermind || 
      setup.lockedSlots?.scheme || 
      Object.keys(setup.lockedSlots?.heroes || {}).length > 0 || 
      Object.keys(setup.lockedSlots?.villains || {}).length > 0 || 
      Object.keys(setup.lockedSlots?.henchmen || {}).length > 0
    );
    if (hasLocks) {
      setShowGlobalOptimizeConfirm(true);
    } else {
      handleRandomizeAll();
      setActiveTab('randomizer');
    }
  };

  const handleConfirmGlobalOptimize = () => {
    setShowGlobalOptimizeConfirm(false);
    handleRandomizeAll();
    setActiveTab('randomizer');
  };

  // Actions
  const handleRandomizeAll = useCallback(() => {
    setErrorMessage(null);
    try {
      const newSetup = generateSetup(settings, { EXPANSIONS, SCHEMES, MASTERMINDS, HEROES, VILLAINS, HENCHMEN }, setup || undefined);
      setSetup(newSetup);
    } catch (e: any) {
      setErrorMessage(e.message || 'Error generating setup. Please check your expansion and universe settings.');
      setSetup(null);
    }
  }, [settings, setup, EXPANSIONS, SCHEMES, MASTERMINDS, HEROES, VILLAINS, HENCHMEN]);

  const handlePlayerCountChange = (count: number) => {
    setErrorMessage(null);
    const updatedSettings = { ...settings, playerCount: count };
    setSettings(updatedSettings);
    if (setup) {
      try {
        const updatedSetup = generateSetup(updatedSettings, { EXPANSIONS, SCHEMES, MASTERMINDS, HEROES, VILLAINS, HENCHMEN }, setup);
        setSetup(updatedSetup);
      } catch (e: any) {
        setErrorMessage(e.message || 'Error generating setup. Please check your expansion and universe settings.');
      }
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
          const allVillainsLocked =
            prev.villains.length > 0 &&
            prev.villains.every((_, i) => Boolean(currentLocked.villains?.[i]));
          const newLockState = !allVillainsLocked;
          const newVillainsLock: { [idx: number]: boolean } = {};
          prev.villains.forEach((_, i) => {
            newVillainsLock[i] = newLockState;
          });
          currentLocked.villains = newVillainsLock;
        }
      } else if (type === 'henchman') {
        if (index !== undefined) {
          currentLocked.henchmen = {
            ...currentLocked.henchmen,
            [index]: !currentLocked.henchmen?.[index],
          };
        } else {
          const allHenchLocked =
            prev.henchmen.length > 0 &&
            prev.henchmen.every((_, i) => Boolean(currentLocked.henchmen?.[i]));
          const newLockState = !allHenchLocked;
          const newHenchLock: { [idx: number]: boolean } = {};
          prev.henchmen.forEach((_, i) => {
            newHenchLock[i] = newLockState;
          });
          currentLocked.henchmen = newHenchLock;
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
      const isAllLocked =
        Boolean(prev.lockedSlots?.mastermind) &&
        Boolean(prev.lockedSlots?.scheme) &&
        (prev.heroes || []).length > 0 &&
        prev.heroes.every((_, i) => Boolean(prev.lockedSlots?.heroes?.[i])) &&
        (prev.villains || []).length > 0 &&
        prev.villains.every((_, i) => Boolean(prev.lockedSlots?.villains?.[i])) &&
        (prev.henchmen || []).length > 0 &&
        prev.henchmen.every((_, i) => Boolean(prev.lockedSlots?.henchmen?.[i]));

      const newLockState = !isAllLocked;

      return {
        ...prev,
        lockedSlots: {
          mastermind: newLockState,
          scheme: newLockState,
          heroes: Object.fromEntries(
            (prev.heroes || []).map((_, i) => [i, newLockState])
          ),
          villains: Object.fromEntries(
            (prev.villains || []).map((_, i) => [i, newLockState])
          ),
          henchmen: Object.fromEntries(
            (prev.henchmen || []).map((_, i) => [i, newLockState])
          ),
        },
      };
    });
  };

  const handleRerollSingle = (type: CardType, index?: number) => {
    if (!setup) return;

    if (type === 'mastermind') {
      if (setup.lockedSlots?.mastermind) return;
      const available = MASTERMINDS.filter(
        (m) =>
          settings.enabledExpansions.includes(m.expansion) &&
          !settings.excludedCardIds.includes(m.id) &&
          m.id !== setup.mastermind.id
      );
      const newMM =
        available.length > 0
          ? available[Math.floor(Math.random() * available.length)]
          : setup.mastermind;

      const updated = updateSetupForMastermind(
        setup,
        newMM,
        settings,
        { SCHEMES, MASTERMINDS, HEROES, VILLAINS, HENCHMEN, EXPANSIONS }
      );
      setSetup(updated);
    } else if (type === 'scheme') {
      if (setup.lockedSlots?.scheme) return;
      const matchesDifficulty = (s: SchemeCard) => {
        const allowed = settings.allowedDifficulties;
        if (!allowed || allowed.length === 0) return true;
        const sDiff = (s.difficulty || 'Moderate') as any;
        return allowed.includes(sDiff);
      };

      const available = SCHEMES.filter(
        (s) =>
          settings.enabledExpansions.includes(s.expansion) &&
          !settings.excludedCardIds.includes(s.id) &&
          (!setup.scheme || s.id !== setup.scheme.id) &&
          matchesDifficulty(s)
      );
      if (available.length === 0) {
        const allowed = settings.allowedDifficulties;
        const errorMsg = allowed && allowed.length > 0 && allowed.length < 4
          ? `No matching schemes found for the selected difficulties (${allowed.join(', ')}).`
          : 'No matching schemes found.';
        setSetup({
          ...setup,
          scheme: null,
          schemeError: errorMsg,
        });
        return;
      }
      const newScheme = available[Math.floor(Math.random() * available.length)];

      const updated = updateSetupForScheme(
        setup,
        newScheme,
        settings,
        { SCHEMES, MASTERMINDS, HEROES, VILLAINS, HENCHMEN, EXPANSIONS }
      );
      setSetup({
        ...updated,
        schemeError: undefined,
      });
    } else if (type === 'hero' && index !== undefined) {
      if (setup.lockedSlots?.heroes?.[index]) return;
      const currentHeroIds = new Set(setup.heroes.map((h) => h.id));
      const available = HEROES.filter(
        (h) =>
          settings.enabledExpansions.includes(h.expansion) &&
          !settings.excludedCardIds.includes(h.id) &&
          !currentHeroIds.has(h.id)
      );
      if (available.length === 0) return;

      const newHero = available[Math.floor(Math.random() * available.length)];
      const updatedHeroes = [...setup.heroes];
      updatedHeroes[index] = newHero;

      setSetup({
        ...setup,
        heroes: updatedHeroes,
      });
    } else if (type === 'villain' && index !== undefined) {
      if (setup.lockedSlots?.villains?.[index]) return;
      const currentVillainIds = new Set(setup.villains.map((v) => v.id));
      const available = VILLAINS.filter(
        (v) =>
          settings.enabledExpansions.includes(v.expansion) &&
          !settings.excludedCardIds.includes(v.id) &&
          !currentVillainIds.has(v.id)
      );
      if (available.length === 0) return;

      const newVillain =
        available[Math.floor(Math.random() * available.length)];
      const updatedVillains = [...setup.villains];
      updatedVillains[index] = newVillain;

      setSetup({
        ...setup,
        villains: updatedVillains,
      });
    } else if (type === 'henchman' && index !== undefined) {
      if (setup.lockedSlots?.henchmen?.[index]) return;
      const currentHenchIds = new Set(setup.henchmen.map((h) => h.id));
      const available = HENCHMEN.filter(
        (h) =>
          settings.enabledExpansions.includes(h.expansion) &&
          !settings.excludedCardIds.includes(h.id) &&
          !currentHenchIds.has(h.id)
      );
      if (available.length === 0) return;

      const newHench = available[Math.floor(Math.random() * available.length)];
      const updatedHenchmen = [...setup.henchmen];
      updatedHenchmen[index] = newHench;

      setSetup({
        ...setup,
        henchmen: updatedHenchmen,
      });
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

  const handleCloseCardPicker = () => {
    setPickerState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSelectCard = (
    type: CardType,
    card: any,
    slotIndex?: number
  ) => {
    if (!setup) return;

    if (type === 'mastermind') {
      const updated = updateSetupForMastermind(
        setup,
        card,
        settings,
        { SCHEMES, MASTERMINDS, HEROES, VILLAINS, HENCHMEN, EXPANSIONS }
      );
      setSetup(updated);
    } else if (type === 'scheme') {
      const updated = updateSetupForScheme(
        setup,
        card,
        settings,
        { SCHEMES, MASTERMINDS, HEROES, VILLAINS, HENCHMEN, EXPANSIONS }
      );
      setSetup(updated);
    } else if (type === 'hero' && slotIndex !== undefined) {
      const updatedHeroes = [...setup.heroes];
      updatedHeroes[slotIndex] = card;
      setSetup({
        ...setup,
        heroes: updatedHeroes,
      });
    } else if (type === 'villain' && slotIndex !== undefined) {
      const updatedVillains = [...setup.villains];
      updatedVillains[slotIndex] = card;
      setSetup({
        ...setup,
        villains: updatedVillains,
      });
    } else if (type === 'henchman' && slotIndex !== undefined) {
      const updatedHenchmen = [...setup.henchmen];
      updatedHenchmen[slotIndex] = card;
      setSetup({
        ...setup,
        henchmen: updatedHenchmen,
      });
    }
  };

  const handleSaveSetup = (setupToSave: ActiveSetup) => {
    const isAlreadySaved = savedSetups.some((s) => s.id === setupToSave.id);
    if (isAlreadySaved) {
      setSavedSetups((prev) => prev.filter((s) => s.id !== setupToSave.id));
    } else {
      setSavedSetups((prev) => [setupToSave, ...prev]);
    }
  };

  const handleLoadSavedSetup = (savedSetup: ActiveSetup) => {
    setSetup(savedSetup);
    setActiveTab('randomizer');
  };

  const handleDeleteSavedSetup = (id: string) => {
    setSavedSetups((prev) => prev.filter((s) => s.id !== id));
  };

  const handleStartScoring = (_setupToScore: ActiveSetup) => {
    setActiveTab('score');
  };

  const handleSaveGameScore = (scoreResult: GameScoreResult) => {
    setGameHistory((prev) => [scoreResult, ...prev]);
  };

  const updateExpansionsAndUniverses = (prev: RandomizerSettings, newEnabled: string[]): RandomizerSettings => {
    const expUniverseMap = new Map<string, string>();
    EXPANSIONS.forEach((e) => {
      expUniverseMap.set(e.id, e.universe || 'Marvel');
    });

    const universeHasEnabled = new Set<string>();
    newEnabled.forEach((id) => {
      const u = expUniverseMap.get(id);
      if (u) universeHasEnabled.add(u);
    });

    const allPopulatedUniverses = Array.from(
      new Set(EXPANSIONS.map((e) => e.universe || 'Marvel'))
    );

    const newSelectedUniverses = allPopulatedUniverses.filter((u) => universeHasEnabled.has(u)) as LegendaryUniverse[];
    const isAllPopulated = allPopulatedUniverses.every((u) => universeHasEnabled.has(u));
    const newMode: UniverseMode = isAllPopulated ? 'mix' : 'selected';

    return {
      ...prev,
      enabledExpansions: newEnabled,
      selectedUniverses: newSelectedUniverses,
      universeMode: newMode,
    };
  };

  const handleSetExpansions = (ids: string[], enabled: boolean) => {
    setSettings((prev) => {
      const idSet = new Set(ids);
      const remaining = prev.enabledExpansions.filter((id) => !idSet.has(id));
      const updated = enabled ? [...remaining, ...ids] : remaining;
      return updateExpansionsAndUniverses(prev, updated);
    });
  };

  const handleSelectPresets = (boxType: 'Core' | 'Big Box' | 'Small Box') => {
    const matching = EXPANSIONS.filter((e) => {
      if (boxType === 'Big Box') {
        return e.boxType === 'Core' || e.boxType === 'Big Box';
      }
      return e.boxType === boxType;
    }).map((e) => e.id);

    setSettings((prev) => updateExpansionsAndUniverses(prev, matching));
  };

  const handleResetExpansions = () => {
    setSettings((prev) => updateExpansionsAndUniverses(prev, EXPANSIONS.map((e) => e.id)));
  };

  const handleUpdateUniverseMode = (mode: UniverseMode, universes: LegendaryUniverse[]) => {
    const matchingExpIds = mode === 'mix'
      ? EXPANSIONS.map((e) => e.id)
      : EXPANSIONS.filter((e) => universes.includes(e.universe || 'Marvel')).map((e) => e.id);

    setSettings((prev) => ({
      ...prev,
      universeMode: mode,
      selectedUniverses: universes,
      enabledExpansions: matchingExpIds,
    }));
  };

  const handleUpdateSettings = (newSettings: Partial<RandomizerSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const isCurrentSetupSaved = useMemo(() => {
    if (!setup) return false;
    return savedSetups.some((s) => s.id === setup.id);
  }, [setup, savedSetups]);

  const isAllLocked = useMemo(() => {
    if (!setup) return false;
    return (
      Boolean(setup.lockedSlots?.mastermind) &&
      Boolean(setup.lockedSlots?.scheme) &&
      (setup.heroes || []).length > 0 &&
      setup.heroes.every((_, i) => Boolean(setup.lockedSlots?.heroes?.[i])) &&
      (setup.villains || []).length > 0 &&
      setup.villains.every((_, i) => Boolean(setup.lockedSlots?.villains?.[i])) &&
      (setup.henchmen || []).length > 0 &&
      setup.henchmen.every((_, i) => Boolean(setup.lockedSlots?.henchmen?.[i]))
    );
  }, [setup]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white font-sans antialiased">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        savedSetupsCount={savedSetups.length}
        enabledExpansionsCount={settings.enabledExpansions.length}
        totalExpansionsCount={EXPANSIONS.length}
        onToggleLockAll={setup ? handleToggleLockAll : undefined}
        isAllLocked={isAllLocked}
      />

      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-900/80 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-center ring-1 ring-rose-500/20">
            <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-950/50">
              <span className="font-extrabold text-xs uppercase">Error</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-100 uppercase font-['Cinzel']">Notice</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="mt-2 w-full py-3 rounded-xl font-bold bg-gradient-to-r from-rose-950 hover:from-rose-900 to-red-950 hover:to-red-900 text-rose-200 border border-rose-500/50 transition-all shadow-lg shadow-rose-950/50 cursor-pointer active:scale-95 touch-manipulation text-xs sm:text-sm uppercase tracking-wider"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {activeTab === 'randomizer' && (
          <RandomizerView
            setup={setup}
            playerCount={settings.playerCount}
            onPlayerCountChange={handlePlayerCountChange}
            onRandomizeAll={handleRandomizeAll}
            onToggleLock={handleToggleLock}
            onRerollSingle={handleRerollSingle}
            onOpenCardPicker={handleOpenCardPicker}
            onSaveSetup={handleSaveSetup}
            onStartScoring={handleStartScoring}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
            isSaved={isCurrentSetupSaved}
          />
        )}

        {activeTab === 'vault' && (
          <CardVaultView
            enabledExpansions={settings.enabledExpansions}
            onSelectExpansion={(id) => {
              setSettings((prev) => {
                const updated = prev.enabledExpansions.includes(id)
                  ? prev.enabledExpansions
                  : [...prev.enabledExpansions, id];
                return updateExpansionsAndUniverses(prev, updated);
              });
            }}
          />
        )}

        {activeTab === 'expansions' && (
          <ExpansionsView
            enabledExpansions={settings.enabledExpansions}
            onToggleExpansion={(id) => {
              setSettings((prev) => {
                const exists = prev.enabledExpansions.includes(id);
                const updated = exists
                  ? prev.enabledExpansions.filter((e) => e !== id)
                  : [...prev.enabledExpansions, id];
                return updateExpansionsAndUniverses(prev, updated);
              });
            }}
            onSetExpansions={handleSetExpansions}
            onSelectPresets={handleSelectPresets}
            onResetDefault={handleResetExpansions}
            universeMode={settings.universeMode}
            selectedUniverses={settings.selectedUniverses}
            onUpdateUniverseMode={handleUpdateUniverseMode}
          />
        )}

        {activeTab === 'saved' && (
          <SavedSetupsView
            savedSetups={savedSetups}
            onLoadSetup={handleLoadSavedSetup}
            onDeleteSetup={handleDeleteSavedSetup}
            onStartScoring={handleStartScoring}
          />
        )}

        {activeTab === 'score' && (
          <ScoreTrackerView
            activeSetup={setup}
            gameHistory={gameHistory}
            onSaveScore={handleSaveGameScore}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        heroes={HEROES}
        masterminds={MASTERMINDS}
        villains={VILLAINS}
        henchmen={HENCHMEN}
        schemes={SCHEMES}
      />

      {/* Rules & Keywords Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* Card Picker Modal */}
      <CardPickerModal
        isOpen={pickerState.isOpen}
        onClose={handleCloseCardPicker}
        cardType={pickerState.cardType}
        currentId={pickerState.currentId}
        slotIndex={pickerState.slotIndex}
        enabledExpansions={settings.enabledExpansions}
        onSelect={handleSelectCard}
      />

      {/* Card Group Inspector Modal */}
      <CardGroupModal
        isOpen={Boolean(activeGroup)}
        onClose={() => setActiveGroup(null)}
        title={activeGroup?.title || ''}
        subtitle={activeGroup?.subtitle}
        cards={activeGroup?.cards}
        cardType={activeGroup?.cardType}
      />

      {/* Symbol Library Modal */}
      <SymbolLibraryModal
        isOpen={isSymbolLibraryOpen}
        onClose={() => setIsSymbolLibraryOpen(false)}
      />

      {/* Keyword Detail Modal (top-most layer) */}
      <KeywordModal
        keywordName={activeKeyword}
        onClose={() => setActiveKeyword(null)}
      />

      {/* Floating Optimize Button Overlay (Bottom Right - Shown on Every Page) */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40">
        <button
          onClick={handleGlobalOptimizeClick}
          className="flex items-center gap-2.5 px-5 py-3.5 sm:px-6 sm:py-4 rounded-full bg-gradient-to-r from-purple-950/95 via-indigo-950/95 to-purple-900/95 hover:from-purple-900/95 hover:via-indigo-900/95 hover:to-purple-800/95 text-purple-200 hover:text-white font-black text-sm uppercase tracking-wider shadow-2xl shadow-purple-950/90 border border-purple-500/60 hover:border-purple-400/90 ring-2 ring-white/20 hover:ring-white/30 backdrop-blur-md active:scale-95 hover:scale-105 transition-all cursor-pointer group relative overflow-hidden"
          title="Optimize / Randomize Setup"
        >
          <span className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:rotate-45 text-purple-300 group-hover:text-white drop-shadow" />
          <span className="font-extrabold tracking-wide drop-shadow-sm">Optimize</span>
        </button>
      </div>

      {/* Confirmation Modal for Global Optimize */}
      {showGlobalOptimizeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 mt-0.5 shadow-inner">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-100 font-['Cinzel'] leading-tight">
                  Optimize Setup?
                </h3>
                <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
                  Are you sure you want to optimize? Any unlocked cards will be replaced with new selections, and you will be taken to the randomizer view.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowGlobalOptimizeConfirm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmGlobalOptimize}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 hover:from-purple-900 hover:via-indigo-900 hover:to-purple-800 text-purple-300 hover:text-purple-200 border border-purple-500/50 hover:border-purple-400/80 ring-1 ring-white/15 shadow-lg shadow-purple-950/60 backdrop-blur-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span>Optimize</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
