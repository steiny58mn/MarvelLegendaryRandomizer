import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import {
  RandomizerSettings,
  AlwaysLeadsRule,
  HeroCard,
  MastermindCard,
  VillainGroup,
  HenchmanGroup,
  SchemeCard,
} from '../types';
import {
  X,
  Languages,
  ShieldAlert,
  Ban,
  Search,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RandomizerSettings;
  onUpdateSettings: (newSettings: Partial<RandomizerSettings>) => void;
  heroes?: HeroCard[];
  masterminds?: MastermindCard[];
  villains?: VillainGroup[];
  henchmen?: HenchmanGroup[];
  schemes?: SchemeCard[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  heroes = [],
  masterminds = [],
  villains = [],
  henchmen = [],
  schemes = [],
}) => {
  const [exclusionSearch, setExclusionSearch] = useState('');
  const [selectedExclusionType, setSelectedExclusionType] = useState<
    'scheme' | 'mastermind' | 'hero' | 'villain'
  >('scheme');
  const [translateVillainsTerms, setTranslateVillainsTerms] = useState<boolean>(
    Boolean(settings.translateVillainsTerms)
  );
  const [isExclusionDropdownOpen, setIsExclusionDropdownOpen] = useState(false);
  const exclusionDropdownRef = useRef<HTMLDivElement>(null);

  const { expansions } = useData();
  const safeExpansions = useMemo(() => expansions || [], [expansions]);
  const expansionMap = useMemo(
    () => new Map(safeExpansions.map((e) => [e.id, e.name])),
    [safeExpansions]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exclusionDropdownRef.current &&
        !exclusionDropdownRef.current.contains(event.target as Node)
      ) {
        setIsExclusionDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const currentAlwaysLeadsRule: AlwaysLeadsRule =
    settings.alwaysLeadsRule && ['guarantee', 'prioritize', 'ignore'].includes(settings.alwaysLeadsRule)
      ? settings.alwaysLeadsRule
      : 'guarantee';

  const getExpansionName = (expId?: string): string => {
    if (!expId) return '';
    return expansionMap.get(expId) || expId;
  };

  const findCard = (id: string) => {
    const list = [...heroes, ...masterminds, ...villains, ...henchmen, ...schemes];
    return list.find((c) => c.id === id);
  };

  const handleAddExcluded = (id: string) => {
    if (settings.excludedCardIds.includes(id)) return;
    onUpdateSettings({ excludedCardIds: [...settings.excludedCardIds, id] });
  };

  const handleRemoveExcluded = (id: string) => {
    onUpdateSettings({
      excludedCardIds: settings.excludedCardIds.filter((cid) => cid !== id),
    });
  };

  const findCardName = (id: string) => {
    const list = [...heroes, ...masterminds, ...villains, ...henchmen, ...schemes];
    const found = list.find((c) => c.id === id);
    return found ? found.name : id;
  };

  const filteredCandidates = (() => {
    if (exclusionSearch.length < 2) return [];
    let list: any[] = [];
    if (selectedExclusionType === 'scheme') list = schemes;
    if (selectedExclusionType === 'mastermind') list = masterminds;
    if (selectedExclusionType === 'hero') list = heroes;
    if (selectedExclusionType === 'villain') list = villains;

    return list
      .filter((c) => c.name.toLowerCase().includes(exclusionSearch.toLowerCase()))
      .filter((c) => !settings.excludedCardIds.includes(c.id));
  })();

  const handleToggleTranslate = (enabled: boolean) => {
    setTranslateVillainsTerms(enabled);
    onUpdateSettings({ translateVillainsTerms: enabled });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wide font-['Cinzel']">
            Settings & Generator Configuration
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto space-y-6">


          {/* Terminology Translation Setting */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-700/50 text-indigo-400">
                  <Languages className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Villains & Fear Itself Terminology Translation
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Translate inverted Villains / Fear Itself terms to Standard Base Game equivalents.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={translateVillainsTerms}
                  onChange={(e) => handleToggleTranslate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-300">
                  {translateVillainsTerms ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs text-slate-400">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-200 font-semibold">Lair</span> <span className="text-purple-400">➔</span> City
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-200 font-semibold">Ally</span> <span className="text-purple-400">➔</span> Hero
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-200 font-semibold">Commander</span> <span className="text-purple-400">➔</span> Mastermind
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-200 font-semibold">Adversary</span> <span className="text-purple-400">➔</span> Villain
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Note: You can also toggle translations individually per card in card detail views.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                <span>Mastermind "Always Leads" Condition</span>
              </h4>

              <div className="space-y-3">
                {[
                  {
                    rule: 'guarantee' as AlwaysLeadsRule,
                    title: 'Always Include (Guaranteed)',
                    desc: 'If the Mastermind specifies an "Always Leads" group, qualifying villain or henchman groups are guaranteed to be in the setup.',
                  },
                  {
                    rule: 'prioritize' as AlwaysLeadsRule,
                    title: 'Prioritize (80% Chance)',
                    desc: 'Strongly favors including the Mastermind’s thematic group with occasional surprises.',
                  },
                  {
                    rule: 'ignore' as AlwaysLeadsRule,
                    title: 'Ignore',
                    desc: 'Fully random villain selection, completely ignoring thematic "Always Leads" rules.',
                  },
                ].map((item) => (
                  <label
                    key={item.rule}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer min-h-[48px] active:scale-[0.99] touch-manipulation transition-all ${
                      currentAlwaysLeadsRule === item.rule
                        ? 'bg-purple-500/15 border-purple-500 text-slate-100'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalAlwaysLeadsRule"
                      checked={currentAlwaysLeadsRule === item.rule}
                      onChange={() => onUpdateSettings({ alwaysLeadsRule: item.rule })}
                      className="mt-1 accent-purple-500 shrink-0"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-100">
                        {item.title}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800">
                <div
                  id="settings-solo-always-leads-card"
                  className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                      Solo Play Rule Option
                    </div>
                    <div className="text-sm font-semibold text-slate-100">
                      Do not force "Always Leads" for Solo play
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Solo games only use 1 villain group. Enabling this allows completely random villain and henchman group selection in Solo mode instead of always requiring the Mastermind's thematic group.
                    </p>
                  </div>
                  <label
                    htmlFor="toggle-solo-always-leads"
                    className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-1"
                  >
                    <input
                      type="checkbox"
                      id="toggle-solo-always-leads"
                      checked={Boolean(settings.ignoreAlwaysLeadsInSolo)}
                      onChange={(e) =>
                        onUpdateSettings({ ignoreAlwaysLeadsInSolo: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    Scheme Difficulties
                  </label>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ allowedDifficulties: ['Easy', 'Moderate', 'Hard', 'Extreme'] })}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Easy', 'Moderate', 'Hard', 'Extreme'] as const).map((diff) => {
                    const allowed = settings.allowedDifficulties || ['Easy', 'Moderate', 'Hard', 'Extreme'];
                    const isSelected = allowed.includes(diff);
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => {
                          let next: ('Easy' | 'Moderate' | 'Hard' | 'Extreme')[];
                          if (isSelected) {
                            next = allowed.filter(d => d !== diff);
                          } else {
                            next = [...allowed, diff];
                          }
                          onUpdateSettings({ allowedDifficulties: next.length === 0 ? ['Easy', 'Moderate', 'Hard', 'Extreme'] : next });
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-purple-950/80 border-purple-500/80 text-purple-200 shadow-sm ring-1 ring-purple-500/20'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-purple-400' : 'bg-slate-700'}`} />
                        {diff}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Ban className="w-4 h-4 text-rose-400" />
                  <span>Card Exclusions (Blacklist)</span>
                </h4>
                <span className="text-xs text-slate-400">
                  {settings.excludedCardIds.length} cards excluded
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {(['scheme', 'mastermind', 'hero', 'villain'] as const).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedExclusionType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
                          selectedExclusionType === type
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {type}
                      </button>
                    )
                  )}
                </div>

                <div ref={exclusionDropdownRef} className="space-y-1.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={exclusionSearch}
                      onChange={(e) => {
                        setExclusionSearch(e.target.value);
                        setIsExclusionDropdownOpen(true);
                      }}
                      onFocus={() => {
                        if (exclusionSearch.length >= 2) {
                          setIsExclusionDropdownOpen(true);
                        }
                      }}
                      placeholder={`Search ${selectedExclusionType} to exclude...`}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {isExclusionDropdownOpen && filteredCandidates.length > 0 && (
                    <div className="border border-slate-800 rounded-xl overflow-y-auto max-h-[190px] bg-slate-950/80 divide-y divide-slate-800/50 shadow-lg">
                      {filteredCandidates.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleAddExcluded(c.id)}
                          className="w-full text-left flex items-center justify-between px-3 py-2 hover:bg-rose-950/30 transition-colors cursor-pointer group"
                        >
                          <span className="text-xs text-slate-200 group-hover:text-rose-200 transition-colors font-medium">
                            {c.name}
                          </span>
                          {c.expansion && (
                            <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors shrink-0 ml-2">
                              {getExpansionName(c.expansion)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                  {settings.excludedCardIds.map((id) => {
                    const card = findCard(id);
                    const cardName = card ? card.name : id;
                    const expName = card?.expansion ? getExpansionName(card.expansion) : '';
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/50 border border-rose-900/60 text-rose-300 text-xs shadow-sm"
                      >
                        <span className="font-medium">{cardName}</span>
                        {expName && (
                          <span className="text-[10px] text-rose-400/80 font-normal">
                            ({expName})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveExcluded(id)}
                          className="hover:text-rose-100 p-0.5 rounded hover:bg-rose-900/50 transition-colors cursor-pointer ml-0.5"
                          title={`Remove ${cardName} from excluded list`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider transition-colors active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
