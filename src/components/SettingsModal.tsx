import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Ban,
  PlusCircle,
  Sliders,
  Languages,
  Database,
  Server,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { GeneratorSettings, AlwaysLeadsRule } from '../types';
import { useData } from '../contexts/DataContext';
import { testApiEndpoint, ApiTestResult } from '../utils/apiConfig';

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
  const {
    translateVillainsTerms,
    setTranslateVillainsTerms,
    apiUrl,
    setApiUrl,
    reloadCards,
    dataSource,
  } = data;

  const [exclusionSearch, setExclusionSearch] = useState('');
  const [selectedExclusionType, setSelectedExclusionType] = useState<
    'scheme' | 'mastermind' | 'hero' | 'villain'
  >('scheme');

  // API Config State
  const [inputApiUrl, setInputApiUrl] = useState<string>(apiUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [testResult, setTestResult] = useState<ApiTestResult | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Sync inputApiUrl when modal opens or external apiUrl changes
  React.useEffect(() => {
    setInputApiUrl(apiUrl || '');
  }, [apiUrl, isOpen]);

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

  const handleToggleTranslate = (enabled: boolean) => {
    setTranslateVillainsTerms(enabled);
    onUpdateSettings({ translateVillainsTerms: enabled });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSaveFeedback(null);
    try {
      const res = await testApiEndpoint(inputApiUrl);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Failed to test connection.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndReload = async () => {
    setIsReloading(true);
    setSaveFeedback(null);
    setTestResult(null);
    try {
      setApiUrl(inputApiUrl);
      const ok = await reloadCards(inputApiUrl);
      if (ok) {
        setSaveFeedback('Cards successfully reloaded from the API!');
      } else {
        setSaveFeedback('API connection failed; fell back to static cards data.');
      }
    } catch (e: any) {
      setSaveFeedback(`Error during reload: ${e?.message}`);
    } finally {
      setIsReloading(false);
    }
  };

  const handleResetApiUrl = async () => {
    setInputApiUrl('');
    setApiUrl('');
    setTestResult(null);
    setIsReloading(true);
    try {
      await reloadCards('');
      setSaveFeedback('Reset to default API address.');
    } finally {
      setIsReloading(false);
    }
  };

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
          {/* Backend API Configuration Setting */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <span>Backend API Address</span>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                        dataSource === 'custom-api'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                          : dataSource === 'api'
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-700/60'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {dataSource === 'custom-api'
                        ? 'Connected to Custom API'
                        : dataSource === 'api'
                        ? 'Connected to Default API'
                        : 'Using Static Dataset'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure the address of your backend C# ASP.NET Core API server to pull card data dynamically.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Database className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    placeholder="e.g. https://api.frostpointlabs.com, https://localhost:7001, or http://localhost:5000"
                    value={inputApiUrl}
                    onChange={(e) => {
                      setInputApiUrl(e.target.value);
                      setTestResult(null);
                      setSaveFeedback(null);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || isReloading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[42px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 touch-manipulation cursor-pointer"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Server className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAndReload}
                    disabled={isTesting || isReloading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[42px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/10 transition-all active:scale-95 disabled:opacity-50 touch-manipulation cursor-pointer"
                  >
                    {isReloading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>{isReloading ? 'Reloading...' : 'Save & Reload'}</span>
                  </button>

                  {inputApiUrl && (
                    <button
                      type="button"
                      onClick={handleResetApiUrl}
                      disabled={isTesting || isReloading}
                      className="p-2 min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors active:scale-95 disabled:opacity-50 touch-manipulation"
                      title="Reset API Address to Default"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Test Result Feedback */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    testResult.success
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                      : 'bg-rose-950/50 border-rose-800 text-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.dataSummary && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] opacity-90">
                        <span>Heroes: {testResult.dataSummary.heroesCount}</span>
                        <span>Masterminds: {testResult.dataSummary.mastermindsCount}</span>
                        <span>Villains: {testResult.dataSummary.villainsCount}</span>
                        <span>Schemes: {testResult.dataSummary.schemesCount}</span>
                        <span>Expansions: {testResult.dataSummary.expansionsCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {saveFeedback && !testResult && (
                <div className="p-3 rounded-xl border bg-slate-950/80 border-slate-800 text-slate-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>{saveFeedback}</span>
                </div>
              )}
            </div>
          </div>

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
                <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                <span className="ml-2 text-xs font-semibold text-slate-300">
                  {translateVillainsTerms ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs text-slate-400">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-200 font-semibold">Lair</span> <span className="text-amber-400">➔</span> City
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-200 font-semibold">Ally</span> <span className="text-amber-400">➔</span> Hero
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-200 font-semibold">Commander</span> <span className="text-amber-400">➔</span> Mastermind
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-200 font-semibold">Adversary</span> <span className="text-amber-400">➔</span> Villain
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Note: You can also toggle translations individually per card in card detail views.
            </p>
          </div>

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
