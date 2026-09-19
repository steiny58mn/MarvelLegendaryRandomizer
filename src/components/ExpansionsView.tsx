import React, { useMemo, useState, useEffect } from 'react';
import { LegendaryUniverse, UniverseMode } from '../types';
import { useData } from '../contexts/DataContext';
import {
  Layers,
  CheckSquare,
  Square,
  RotateCcw,
  Box,
  Sparkles,
  Globe,
  Filter,
  XCircle,
} from 'lucide-react';

interface ExpansionsViewProps {
  enabledExpansions: string[];
  onToggleExpansion: (id: string) => void;
  onSetExpansions: (ids: string[], enabled: boolean) => void;
  onSelectPresets: (boxType: 'Core' | 'Big Box' | 'Small Box') => void;
  onResetDefault: () => void;
  universeMode?: UniverseMode;
  selectedUniverses?: LegendaryUniverse[];
  onUpdateUniverseMode?: (mode: UniverseMode, universes: LegendaryUniverse[]) => void;
}

const ALL_UNIVERSES: { id: LegendaryUniverse; name: string; tag: string; color: string }[] = [
  { id: 'Marvel', name: 'Marvel', tag: 'Marvel', color: 'from-red-600 to-red-800' },
  { id: 'DC', name: 'DC Universe', tag: 'DC', color: 'from-blue-600 to-blue-800' },
  { id: 'Alien', name: 'Encounters: Alien', tag: 'Alien', color: 'from-emerald-700 to-teal-900' },
  { id: 'The Matrix', name: 'The Matrix', tag: 'Matrix', color: 'from-green-600 to-emerald-800' },
  { id: 'James Bond', name: 'James Bond 007', tag: '007', color: 'from-indigo-600 to-slate-800' },
  { id: 'Game of Thrones', name: 'Game of Thrones', tag: 'GoT', color: 'from-amber-700 to-stone-800' },
  { id: 'Predator', name: 'Encounters: Predator', tag: 'Predator', color: 'from-yellow-600 to-amber-900' },
  { id: 'X-Files', name: 'The X-Files', tag: 'X-Files', color: 'from-violet-600 to-purple-900' },
  { id: 'Buffy the Vampire Slayer', name: 'Buffy the Slayer', tag: 'Buffy', color: 'from-fuchsia-700 to-rose-950' },
  { id: 'Firefly', name: 'Encounters: Firefly', tag: 'Firefly', color: 'from-orange-600 to-amber-800' },
  { id: 'Big Trouble in Little China', name: 'Big Trouble in Little China', tag: 'BTLC', color: 'from-rose-600 to-red-900' },
];

export const UNIVERSE_DESCRIPTIONS: Record<string, string> = {
  Marvel: 'The primary Marvel Comics superheroes and supervillains universe.',
  DC: 'DC Universe icons, Justice League heroes, villains, and storylines.',
  Alien: 'Legendary Encounters sci-fi survival horror franchise sets.',
  'The Matrix': 'Cyberpunk simulation rebels, Zion resistance, and Agent squads.',
  'James Bond': '007 espionage missions, gadgets, MI6 allies, and classic villains.',
  'Game of Thrones': 'Westeros noble houses, Iron Throne claimants, and Westerosi threats.',
  Predator: 'Alien safari encounters, Yautja technology, and deadly hunts.',
  'X-Files': 'Paranormal FBI investigations, alien conspiracies, and cryptids.',
  'Buffy the Vampire Slayer': 'Sunnydale Scooby gang, Slayers, vampires, and demonic apocalypses.',
  Firefly: 'Serenity smugglers, browncoats, alliance enforcers, and Reavers.',
  'Big Trouble in Little China': 'Jack Burton, Chinatown sorcery, and Lo Pan mystic minions.',
  Cthulhu: 'Lovecraftian elder gods, madness, and cosmic investigations.',
};

export function getUniverseDescription(universeId?: string, universeName?: string): string {
  if (universeId && UNIVERSE_DESCRIPTIONS[universeId]) {
    return UNIVERSE_DESCRIPTIONS[universeId];
  }
  return `Official Legendary product line for ${universeName || universeId || 'this universe'}.`;
}

export const ExpansionsView: React.FC<ExpansionsViewProps> = ({
  enabledExpansions,
  onToggleExpansion,
  onSetExpansions,
  onSelectPresets,
  onResetDefault,
  universeMode = 'mix',
  selectedUniverses = ['Marvel', 'DC'],
  onUpdateUniverseMode,
}) => {
  const data = useData() || {};
  const HEROES = data.heroes || [];
  const MASTERMINDS = data.masterminds || [];
  const VILLAINS = data.villains || [];
  const HENCHMEN = data.henchmen || [];
  const SCHEMES = data.schemes || [];
  const EXPANSIONS = data.expansions || [];

  // Universe stats (counts of expansions existing per universe)
  const universeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    EXPANSIONS.forEach((e) => {
      const u = e.universe || 'Marvel';
      stats[u] = (stats[u] || 0) + 1;
    });
    return stats;
  }, [EXPANSIONS]);

  // Tab filter inside Expansions view: array of specific universes (empty means all)
  const [activeUniverseFilters, setActiveUniverseFilters] = useState<string[]>([]);

  useEffect(() => {
    setActiveUniverseFilters(universeMode === 'mix' ? [] : selectedUniverses);
  }, [universeMode, selectedUniverses]);

  const countsByExp = useMemo(() => {
    const map: Record<
      string,
      {
        schemes: number;
        masterminds: number;
        heroes: number;
        villains: number;
        henchmen: number;
      }
    > = {};

    EXPANSIONS.forEach((exp) => {
      map[exp.id] = {
        schemes: SCHEMES.filter((s) => s.expansion === exp.id).length,
        masterminds: MASTERMINDS.filter((m) => m.expansion === exp.id).length,
        heroes: HEROES.filter((h) => h.expansion === exp.id).length,
        villains: VILLAINS.filter((v) => v.expansion === exp.id).length,
        henchmen: HENCHMEN.filter((h) => h.expansion === exp.id).length,
      };
    });

    return map;
  }, [EXPANSIONS, SCHEMES, MASTERMINDS, HEROES, VILLAINS, HENCHMEN]);

  // Aggregate card counts per universe for the Universe Cards Grid
  const countsByUniverse = useMemo(() => {
    const expUniverseMap: Record<string, string> = {};
    EXPANSIONS.forEach((exp) => {
      expUniverseMap[exp.id] = exp.universe || 'Marvel';
    });

    const map: Record<
      string,
      {
        sets: number;
        schemes: number;
        masterminds: number;
        heroes: number;
        villains: number;
        henchmen: number;
      }
    > = {};

    ALL_UNIVERSES.forEach((u) => {
      map[u.id] = {
        sets: 0,
        schemes: 0,
        masterminds: 0,
        heroes: 0,
        villains: 0,
        henchmen: 0,
      };
    });

    EXPANSIONS.forEach((exp) => {
      const u = exp.universe || 'Marvel';
      if (!map[u]) {
        map[u] = { sets: 0, schemes: 0, masterminds: 0, heroes: 0, villains: 0, henchmen: 0 };
      }
      map[u].sets += 1;
    });

    HEROES.forEach((h) => {
      const u = expUniverseMap[h.expansion] || 'Marvel';
      if (!map[u]) map[u] = { sets: 0, schemes: 0, masterminds: 0, heroes: 0, villains: 0, henchmen: 0 };
      map[u].heroes += 1;
    });

    MASTERMINDS.forEach((m) => {
      const u = expUniverseMap[m.expansion] || 'Marvel';
      if (!map[u]) map[u] = { sets: 0, schemes: 0, masterminds: 0, heroes: 0, villains: 0, henchmen: 0 };
      map[u].masterminds += 1;
    });

    SCHEMES.forEach((s) => {
      const u = expUniverseMap[s.expansion] || 'Marvel';
      if (!map[u]) map[u] = { sets: 0, schemes: 0, masterminds: 0, heroes: 0, villains: 0, henchmen: 0 };
      map[u].schemes += 1;
    });

    VILLAINS.forEach((v) => {
      const u = expUniverseMap[v.expansion] || 'Marvel';
      if (!map[u]) map[u] = { sets: 0, schemes: 0, masterminds: 0, heroes: 0, villains: 0, henchmen: 0 };
      map[u].villains += 1;
    });

    HENCHMEN.forEach((h) => {
      const u = expUniverseMap[h.expansion] || 'Marvel';
      if (!map[u]) map[u] = { sets: 0, schemes: 0, masterminds: 0, heroes: 0, villains: 0, henchmen: 0 };
      map[u].henchmen += 1;
    });

    return map;
  }, [EXPANSIONS, HEROES, MASTERMINDS, SCHEMES, VILLAINS, HENCHMEN]);

  // Available universes that actually have sets in data
  const populatedUniverses = useMemo(() => {
    return ALL_UNIVERSES.filter((u) => (universeStats[u.id] || 0) > 0);
  }, [universeStats]);

  // Handle universe mode toggles
  const handleSetMode = (mode: UniverseMode) => {
    if (!onUpdateUniverseMode) return;
    if (mode === 'mix') {
      onUpdateUniverseMode('mix', populatedUniverses.map(u => u.id));
    } else {
      const validSelected = selectedUniverses.filter(u => (universeStats[u] || 0) > 0);
      onUpdateUniverseMode(mode, validSelected.length > 0 ? validSelected : [populatedUniverses[0]?.id || 'Marvel']);
    }
  };

  const handleToggleUniverseSelection = (uId: LegendaryUniverse) => {
    if (!onUpdateUniverseMode) return;
    const count = universeStats[uId] || 0;
    if (count === 0) return; // Do not toggle universes with no sets

    const currentSelected = universeMode === 'mix' ? populatedUniverses.map(u => u.id) : selectedUniverses;
    const isSelected = currentSelected.includes(uId);
    let updated: LegendaryUniverse[];
    if (isSelected) {
      updated = currentSelected.filter(u => u !== uId);
    } else {
      updated = [...currentSelected, uId];
    }
    const mode = updated.length === populatedUniverses.length ? 'mix' : 'selected';
    onUpdateUniverseMode(mode, updated);
  };

  const handleSelectAllUniverses = () => {
    if (!onUpdateUniverseMode) return;
    onUpdateUniverseMode('mix', populatedUniverses.map(u => u.id));
  };

  const handleUncheckAllUniverses = () => {
    if (!onUpdateUniverseMode) return;
    onUpdateUniverseMode('selected', []);
  };

  const handleToggleBottomFilter = (uId: string) => {
    setActiveUniverseFilters((prev) => {
      if (prev.includes(uId)) {
        const next = prev.filter((x) => x !== uId);
        return next.length === 0 ? [] : next;
      } else {
        return [...prev, uId];
      }
    });
  };

  // Filter expansions list by selected view tab
  const displayedExpansions = useMemo(() => {
    if (activeUniverseFilters.length === 0) return EXPANSIONS;
    return EXPANSIONS.filter((e) => activeUniverseFilters.includes(e.universe || 'Marvel'));
  }, [EXPANSIONS, activeUniverseFilters]);

  // Valid count calculation to prevent phantom counts
  const validExpansionsSet = useMemo(() => new Set(EXPANSIONS.map(e => e.id)), [EXPANSIONS]);
  const activeEnabledCount = useMemo(() => {
    return enabledExpansions.filter(id => validExpansionsSet.has(id)).length;
  }, [enabledExpansions, validExpansionsSet]);

  const activeUniverseCount = useMemo(() => {
    if (universeMode === 'mix') return populatedUniverses.length;
    return selectedUniverses.filter(u => (universeStats[u] || 0) > 0).length;
  }, [universeMode, selectedUniverses, populatedUniverses, universeStats]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Universe Mode & Mix and Match Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-400 shrink-0" />
              <span>Multiverse Product Line Settings</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Choose whether to randomize across all Legendary games (Mix & Match) or restrict to your favorite universes (Marvel, DC, Alien, etc.).
            </p>
          </div>

          {/* Mode Switcher & Product Line Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSelectAllUniverses}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-center min-h-[36px] active:scale-95 touch-manipulation cursor-pointer border backdrop-blur-md ${
                universeMode === 'mix'
                  ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 text-purple-100 border-purple-500/60 shadow-lg shadow-purple-950/60 font-black ring-1 ring-white/15'
                  : 'bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 text-slate-300 hover:text-white border-slate-700/70 ring-1 ring-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Mix All</span>
            </button>

            <button
              onClick={handleUncheckAllUniverses}
              className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-center min-h-[36px] bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 text-slate-300 hover:text-white border border-slate-700/70 ring-1 ring-white/10 shadow-sm backdrop-blur-md active:scale-95 touch-manipulation cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Uncheck All</span>
            </button>

            <button
              onClick={() => handleSetMode('selected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-center min-h-[36px] active:scale-95 touch-manipulation cursor-pointer border backdrop-blur-md ${
                universeMode === 'selected' || universeMode === 'single'
                  ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 text-purple-100 border-purple-500/60 shadow-lg shadow-purple-950/60 font-black ring-1 ring-white/15'
                  : 'bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 text-slate-300 hover:text-white border-slate-700/70 ring-1 ring-white/10'
              }`}
              title="Custom Universe Selection"
            >
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Custom</span>
            </button>
          </div>
        </div>

        {/* Universe Cards Grid */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Enabled Product Lines for Randomizer:</span>
            <span className="text-[11px] text-purple-400 font-normal">
              {universeMode === 'mix' ? 'All universes enabled' : `${activeUniverseCount} of ${populatedUniverses.length} selected`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_UNIVERSES.map((u) => {
              const count = universeStats[u.id] || 0;
              const isSelected = count > 0 && (universeMode === 'mix' || selectedUniverses.includes(u.id));
              const isDisabled = count === 0;
              const uCounts = countsByUniverse[u.id] || {
                sets: count,
                heroes: 0,
                masterminds: 0,
                schemes: 0,
                villains: 0,
                henchmen: 0,
              };

              return (
                <div
                  key={u.id}
                  onClick={() => !isDisabled && handleToggleUniverseSelection(u.id)}
                  className={`p-4 rounded-2xl border transition-all select-none flex flex-col justify-between active:scale-[0.99] touch-manipulation ${
                    isDisabled
                      ? 'bg-slate-950/40 border-slate-900 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-slate-900/90 border-purple-500/70 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30 cursor-pointer'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-60 hover:opacity-90 hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-purple-950/90 via-indigo-950/80 to-purple-900/90 text-purple-200 border border-purple-500/50 ring-1 ring-white/10 backdrop-blur-xs shadow-sm">
                          {u.tag}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 text-slate-300 border border-slate-700/70 ring-1 ring-white/10 backdrop-blur-xs shadow-sm">
                          {count} {count === 1 ? 'Expansion' : 'Expansions'}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-slate-100 mb-1">
                      {u.name}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      {getUniverseDescription(u.id, u.name)}
                    </p>
                  </div>

                  {/* Card counts summary */}
                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{uCounts.heroes} Heroes</span>
                    <span>•</span>
                    <span>{uCounts.masterminds} MM</span>
                    <span>•</span>
                    <span>{uCounts.schemes} Schemes</span>
                    <span>•</span>
                    <span>{uCounts.villains + uCounts.henchmen} Villains</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expansion Collection Controls Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400 shrink-0" />
              <span>Expansion Collection</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Tap any expansion to toggle it on or off. Filter the view by universe tab below.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onSetExpansions(displayedExpansions.map(e => e.id), true)}
              className="px-3 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 hover:from-purple-900 hover:to-indigo-900 text-purple-100 hover:text-white text-xs font-bold border border-purple-500/50 hover:border-purple-400/80 transition-all flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation ring-1 ring-white/15 shadow-md backdrop-blur-md cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-purple-300 shrink-0" />
              <span>Check All</span>
            </button>

            <button
              onClick={() => onSetExpansions(displayedExpansions.map(e => e.id), false)}
              className="px-3 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/70 hover:border-purple-500/50 transition-all flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation ring-1 ring-white/10 shadow-sm backdrop-blur-md cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>Uncheck All</span>
            </button>

            <button
              onClick={() => onSelectPresets('Big Box')}
              className="px-3 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-teal-950/90 via-emerald-950/90 to-teal-900/90 hover:from-teal-900 hover:to-emerald-900 text-teal-200 hover:text-white text-xs font-bold border border-teal-600/50 hover:border-teal-400/80 transition-all flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation ring-1 ring-white/15 shadow-md backdrop-blur-md cursor-pointer"
            >
              <Box className="w-3.5 h-3.5 text-teal-300 shrink-0" />
              <span className="truncate">Core + Big</span>
            </button>

            <button
              onClick={onResetDefault}
              className="px-3 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/70 hover:border-purple-500/50 transition-all flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation ring-1 ring-white/10 shadow-sm backdrop-blur-md cursor-pointer"
              title="Reset to all expansions"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Universe Filter Tabs inside View */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 max-w-full">
          <button
            onClick={() => setActiveUniverseFilters([])}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeUniverseFilters.length === 0
                ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 text-purple-100 border border-purple-500/60 shadow-md shadow-purple-950/60 font-black ring-1 ring-white/15 backdrop-blur-md'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/80 border border-slate-800 hover:border-slate-700'
            }`}
          >
            All Universes ({EXPANSIONS.length})
          </button>
          {ALL_UNIVERSES.map((u) => {
            const count = universeStats[u.id] || 0;
            if (count === 0) return null;
            const isActive = activeUniverseFilters.includes(u.id);
            return (
              <button
                key={u.id}
                onClick={() => handleToggleBottomFilter(u.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 text-purple-100 border border-purple-500/60 shadow-md shadow-purple-950/60 font-black ring-1 ring-white/15 backdrop-blur-md'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950/80 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {u.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Active: <span className="font-bold text-purple-400">{activeEnabledCount}</span> of {EXPANSIONS.length} sets enabled
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="hidden sm:inline">Settings saved automatically</span>
          </div>
        </div>
      </div>

      {/* Expansion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedExpansions.map((exp) => {
          const isEnabled = enabledExpansions.includes(exp.id);
          const counts = countsByExp[exp.id] || {
            schemes: 0,
            masterminds: 0,
            heroes: 0,
            villains: 0,
            henchmen: 0,
          };
          const universe = exp.universe || 'Marvel';

          return (
            <div
              key={exp.id}
              onClick={() => onToggleExpansion(exp.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between active:scale-[0.99] touch-manipulation ${
                isEnabled
                  ? 'bg-slate-900/90 border-purple-500/70 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-60 hover:opacity-90 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ring-1 ring-white/10 backdrop-blur-xs shadow-sm ${
                        exp.boxType === 'Core'
                          ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/80 to-purple-900/90 text-purple-200 border-purple-500/50'
                          : exp.boxType === 'Big Box'
                          ? 'bg-gradient-to-r from-indigo-950/90 via-blue-950/80 to-indigo-900/90 text-indigo-200 border-indigo-500/50'
                          : 'bg-gradient-to-r from-teal-950/90 via-emerald-950/80 to-teal-900/90 text-teal-200 border-teal-500/50'
                      }`}
                    >
                      {exp.boxType}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 text-slate-300 border border-slate-700/70 ring-1 ring-white/10 backdrop-blur-xs shadow-sm">
                      {universe}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {exp.releaseYear}
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-slate-100 mb-1">
                  {exp.name}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {exp.description}
                </p>
              </div>

              {/* Card counts summary */}
              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>{counts.heroes} Heroes</span>
                <span>•</span>
                <span>{counts.masterminds} MM</span>
                <span>•</span>
                <span>{counts.schemes} Schemes</span>
                <span>•</span>
                <span>{counts.villains + counts.henchmen} Villains</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
