import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

      setSetup({
        ...setup,
        mastermind: newMM,
      });
    } else if (type === 'scheme') {
      if (setup.lockedSlots?.scheme) return;
      const available = SCHEMES.filter(
        (s) =>
          settings.enabledExpansions.includes(s.expansion) &&
          !settings.excludedCardIds.includes(s.id) &&
          s.id !== setup.scheme.id
      );
      const newScheme =
        available.length > 0
          ? available[Math.floor(Math.random() * available.length)]
          : setup.scheme;

      setSetup({
        ...setup,
        scheme: newScheme,
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
      setSetup({
        ...setup,
        mastermind: card,
      });
    } else if (type === 'scheme') {
      setSetup({
        ...setup,
        scheme: card,
      });
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

  const isCurrentSetupSaved = useMemo(() => {
    if (!setup) return false;
    return savedSetups.some((s) => s.id === setup.id);
  }, [setup, savedSetups]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans antialiased">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        savedSetupsCount={savedSetups.length}
        enabledExpansionsCount={settings.enabledExpansions.length}
        totalExpansionsCount={EXPANSIONS.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
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
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
            isSaved={isCurrentSetupSaved}
          />
        )}

        {activeTab === 'vault' && (
          <CardVaultView
            enabledExpansions={settings.enabledExpansions}
            onSelectExpansion={(id) => {
              setSettings((prev) => ({
                ...prev,
                enabledExpansions: prev.enabledExpansions.includes(id)
                  ? prev.enabledExpansions
                  : [...prev.enabledExpansions, id],
              }));
            }}
          />
        )}

        {activeTab === 'expansions' && (
          <ExpansionsView
            enabledExpansions={settings.enabledExpansions}
            onToggleExpansion={(id) => {
              setSettings((prev) => {
                const exists = prev.enabledExpansions.includes(id);
                return {
                  ...prev,
                  enabledExpansions: exists
                    ? prev.enabledExpansions.filter((e) => e !== id)
                    : [...prev.enabledExpansions, id],
                };
              });
            }}
            onToggleAllExpansions={(enabled) => {
              setSettings((prev) => ({
                ...prev,
                enabledExpansions: enabled ? EXPANSIONS.map((e) => e.id) : [],
              }));
            }}
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
        onUpdateSettings={setSettings}
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

      {/* Keyword Detail Modal */}
      <KeywordModal
        keywordName={activeKeyword}
        onClose={() => setActiveKeyword(null)}
      />

      {/* Card Group Inspector Modal */}
      <CardGroupModal
        isOpen={Boolean(activeGroup)}
        onClose={() => setActiveGroup(null)}
        title={activeGroup?.title || ''}
        subtitle={activeGroup?.subtitle}
        cards={activeGroup?.cards}
      />

      {/* Symbol Library Modal */}
      <SymbolLibraryModal
        isOpen={isSymbolLibraryOpen}
        onClose={() => setIsSymbolLibraryOpen(false)}
      />
    </div>
  );
}

export default App;
