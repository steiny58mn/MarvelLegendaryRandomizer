import React, { useState } from 'react';
import { X, ShieldAlert, Ban, PlusCircle, Sliders } from 'lucide-react';
import { GeneratorSettings, AlwaysLeadsRule } from '../types';
import { useData } from '../contexts/DataContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GeneratorSettings;
  onUpdateSettings: (newSettings: Partial<GeneratorSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const data = useData() || {};
  const heroes = data.heroes || [];
  const masterminds = data.masterminds || [];
  const villains = data.villains || [];
  const henchmen = data.henchmen || [];
  const schemes = data.schemes || [];
  const expansions = data.expansions || [];
  const [exclusionSearch, setExclusionSearch] = useState('');
  const [selectedExclusionType, setSelectedExclusionType] = useState<
    'scheme' | 'mastermind' | 'hero' | 'villain'
  >('scheme');

  if (!isOpen) return null;

  const handleAddExcluded = (id: string) => {
    if (settings.excludedCardIds.includes(id)) return;
    onUpdateSettings({ excludedCardIds: [...settings.excludedCardIds, id] });
    setExclusionSearch('');
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
      .filter((c) => !settings.excludedCardIds.includes(c.id))
      .slice(0, 5);
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            Randomizer Presets & Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors active:scale-95 touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Mastermind "Always Leads" Condition</span>
              </h4>

              <div className="space-y-3">
                {[
                  {
                    rule: 'guarantee' as AlwaysLeadsRule,
                    title: 'Always Include (Guaranteed)',
                    desc: 'If the Mastermind specifies an "Always Leads" villain group, it is guaranteed to be in the setup.',
                  },
                  {
                    rule: 'prioritize' as AlwaysLeadsRule,
                    title: 'Prioritize (80% Chance)',
                    desc: 'Strongly favors including the Mastermind’s thematic villain group with occasional surprises.',
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
                      settings.alwaysLeadsRule === item.rule
                        ? 'bg-amber-500/10 border-amber-500 text-slate-100'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalAlwaysLeadsRule"
                      checked={settings.alwaysLeadsRule === item.rule}
                      onChange={() => onUpdateSettings({ alwaysLeadsRule: item.rule })}
                      className="mt-1 accent-amber-500 shrink-0"
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
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                  Maximum Scheme Difficulty
                </label>
                <select
                  value={settings.maxDifficulty || 'Any'}
                  onChange={(e) =>
                    onUpdateSettings({ maxDifficulty: e.target.value as any })
                  }
                  className="w-full px-3 py-2.5 min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Any">Any Difficulty (Easy, Moderate, Hard, Extreme)</option>
                  <option value="Easy">Easy Schemes Only</option>
                  <option value="Moderate">Moderate Schemes Only</option>
                  <option value="Hard">Hard Schemes Only</option>
                </select>
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

              <p className="text-xs text-slate-400">
                Excluded cards will never be picked by the randomizer (e.g. brutal schemes or unfavored masterminds).
              </p>

              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <select
                    value={selectedExclusionType}
                    onChange={(e) => setSelectedExclusionType(e.target.value as any)}
                    className="px-3 py-2 min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="scheme">Scheme</option>
                    <option value="mastermind">Mastermind</option>
                    <option value="hero">Hero</option>
                    <option value="villain">Villain</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Search card name to exclude..."
                    value={exclusionSearch}
                    onChange={(e) => setExclusionSearch(e.target.value)}
                    className="flex-1 px-3 py-2 min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {filteredCandidates.length > 0 && (
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block px-1">
                      Click to exclude:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {filteredCandidates.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleAddExcluded(c.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-800 text-xs transition-colors active:scale-95 touch-manipulation"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-slate-300 uppercase block">
                  Currently Excluded:
                </span>

                {settings.excludedCardIds.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No cards are currently excluded.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                    {settings.excludedCardIds.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-800/60 text-xs font-medium"
                      >
                        <span>{findCardName(id)}</span>
                        <button
                          onClick={() => handleRemoveExcluded(id)}
                          className="p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg hover:text-white transition-colors active:scale-90 touch-manipulation"
                          title="Remove exclusion"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
