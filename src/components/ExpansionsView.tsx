import React, { useMemo, useState, useEffect } from 'react';
import { Expansion, LegendaryUniverse, UniverseMode } from '../types';
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
  Check,
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

export const ExpansionsView: React.FC<ExpansionsViewProps> = ({
  enabledExpansions,
  onToggleExpansion,
  onSetExpansions,
  onSelectPresets,
  onResetDefault,
  universeMode = 'mix',
  selectedUniverses = ALL_UNIVERSES.map(u => u.id),
  onUpdateUniverseMode,
}) => {
  const data = useData() || {};
  const HEROES = data.heroes || [];
  const MASTERMINDS = data.masterminds || [];
  const VILLAINS = data.villains || [];
  const HENCHMEN = data.henchmen || [];
  const SCHEMES = data.schemes || [];
  const EXPANSIONS = data.expansions || [];

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

  // Handle universe mode toggles
  const handleSetMode = (mode: UniverseMode) => {
    if (!onUpdateUniverseMode) return;
    if (mode === 'mix') {
      onUpdateUniverseMode('mix', ALL_UNIVERSES.map(u => u.id));
    } else {
      onUpdateUniverseMode(mode, selectedUniverses.length > 0 ? selectedUniverses : [ALL_UNIVERSES[0].id]);
    }
  };

  const handleToggleUniverseSelection = (uId: LegendaryUniverse) => {
    if (!onUpdateUniverseMode) return;
    const currentSelected = universeMode === 'mix' ? ALL_UNIVERSES.map(u => u.id) : selectedUniverses;
    const isSelected = currentSelected.includes(uId);
    let updated: LegendaryUniverse[];
    if (isSelected) {
      // Don't allow deselecting all
      if (currentSelected.length <= 1) return;
      updated = currentSelected.filter(u => u !== uId);
    } else {
      updated = [...currentSelected, uId];
    }
    const mode = updated.length === ALL_UNIVERSES.length ? 'mix' : 'selected';
    onUpdateUniverseMode(mode, updated);
  };

  const handleSelectOnlyUniverse = (uId: LegendaryUniverse) => {
    if (!onUpdateUniverseMode) return;
    onUpdateUniverseMode('single', [uId]);
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

  // Universe stats
  const universeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    EXPANSIONS.forEach((e) => {
      const u = e.universe || 'Marvel';
      stats[u] = (stats[u] || 0) + 1;
    });
    return stats;
  }, [EXPANSIONS]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Universe Mode & Mix and Match Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Multiverse Product Line Settings</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Choose whether to randomize across all Legendary games (Mix & Match) or restrict to your favorite universes (Marvel, DC, Alien, Matrix, 007, etc.).
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 bg-slate-950 p-1 sm:p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSetMode('mix')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-center min-h-[36px] ${
                universeMode === 'mix'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Mix All</span>
            </button>
            <button
              onClick={() => handleSetMode('selected')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-center min-h-[36px] ${
                universeMode === 'selected' || universeMode === 'single'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Custom Universe Selection"
            >
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Custom</span>
              <span className="hidden sm:inline"> Selection</span>
            </button>
          </div>
        </div>

        {/* Universe Chips Grid */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <span>Enabled Product Lines for Randomizer:</span>
            <span className="text-[11px] text-amber-400 font-normal">
              {universeMode === 'mix' ? 'All universes enabled' : `${selectedUniverses.length} selected`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {ALL_UNIVERSES.map((u) => {
              const isSelected = universeMode === 'mix' || selectedUniverses.includes(u.id);
              const count = universeStats[u.id] || 0;
              return (
                <div
                  key={u.id}
                  onClick={() => handleToggleUniverseSelection(u.id)}
                  className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/60 shadow-sm shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-50 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-100 break-words leading-tight">{u.name}</span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 border-amber-400 text-slate-950'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{count} {count === 1 ? 'set' : 'sets'}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOnlyUniverse(u.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-amber-400 hover:underline transition-opacity text-[10px]"
                    >
                      Only
                    </button>
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
              <Layers className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Expansion Collection</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Select which individual sets you own. Filter the view by universe tab below.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onSetExpansions(displayedExpansions.map(e => e.id), true)}
              className="px-3 py-2 min-h-[38px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation"
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Select All</span>
            </button>

            <button
              onClick={() => onSetExpansions(displayedExpansions.map(e => e.id), false)}
              className="px-3 py-2 min-h-[38px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation"
            >
              <Square className="w-3.5 h-3.5 shrink-0" />
              <span>Clear All</span>
            </button>

            <button
              onClick={() => onSelectPresets('Big Box')}
              className="px-3 py-2 min-h-[38px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation"
            >
              <Box className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">Core + Big</span>
            </button>

            <button
              onClick={onResetDefault}
              className="px-3 py-2 min-h-[38px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation"
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
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              activeUniverseFilters.length === 0
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950'
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
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                }`}
              >
                {u.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Active: <span className="font-bold text-amber-400">{enabledExpansions.length}</span> of {EXPANSIONS.length} sets enabled
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Sparkles className="w-3 h-3 text-amber-500" />
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
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                isEnabled
                  ? 'bg-slate-900/90 border-amber-500/60 shadow-lg shadow-amber-500/5'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-60 hover:opacity-90 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        exp.boxType === 'Core'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                          : exp.boxType === 'Big Box'
                          ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                          : 'bg-teal-950/80 text-teal-300 border-teal-500/50'
                      }`}
                    >
                      {exp.boxType}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {universe}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {exp.releaseYear}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isEnabled
                        ? 'bg-amber-500 border-amber-400 text-slate-950'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isEnabled && <CheckSquare className="w-3.5 h-3.5 stroke-[3]" />}
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
