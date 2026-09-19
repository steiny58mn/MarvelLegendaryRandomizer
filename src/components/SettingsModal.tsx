import React, { useState, useEffect } from 'react';
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
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { testApiEndpoint, ApiTestResult } from '../utils/apiConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RandomizerSettings;
  onUpdateSettings: (newSettings: Partial<RandomizerSettings>) => void;
  heroes: HeroCard[];
  masterminds: MastermindCard[];
  villains: VillainGroup[];
  henchmen: HenchmanGroup[];
  schemes: SchemeCard[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  heroes,
  masterminds,
  villains,
  henchmen,
  schemes,
}) => {
  const {
    apiUrl,
    setApiUrl,
    resetApiUrl,
    reloadCards,
    dataSource,
    expansions,
    isLoading: isDataLoading,
  } = useData();

  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ApiTestResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [exclusionSearch, setExclusionSearch] = useState('');
  const [selectedExclusionType, setSelectedExclusionType] = useState<
    'scheme' | 'mastermind' | 'hero' | 'villain'
  >('scheme');
  const [translateVillainsTerms, setTranslateVillainsTerms] = useState<boolean>(
    Boolean(settings.translateVillainsTerms)
  );

  useEffect(() => {
    setInputUrl(apiUrl);
  }, [apiUrl]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSyncMessage(null);
    try {
      const result = await testApiEndpoint(inputUrl);
      setTestResult(result);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Error executing test connection.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleApplyUrl = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      setApiUrl(inputUrl);
      const success = await reloadCards(inputUrl);
      if (success) {
        setSyncMessage('Successfully updated and refreshed dataset from API!');
      } else {
        setSyncMessage('Failed to load from URL; falling back to bundled dataset.');
      }
    } catch (e: any) {
      setSyncMessage(`Error: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetToDefault = async () => {
    setInputUrl('');
    setTestResult(null);
    resetApiUrl();
    setIsSyncing(true);
    try {
      await reloadCards('');
      setSyncMessage('Reset to default configuration.');
    } finally {
      setIsSyncing(false);
    }
  };

  const currentAlwaysLeadsRule: AlwaysLeadsRule =
    settings.alwaysLeadsRule && ['guarantee', 'prioritize', 'ignore'].includes(settings.alwaysLeadsRule)
      ? settings.alwaysLeadsRule
      : 'guarantee';

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
          {/* Remote Database & API Configuration Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-700/50 text-purple-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <span>Remote Database & API Backend</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        dataSource === 'custom-api' || dataSource === 'api'
                          ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                          : 'bg-amber-950/70 border-amber-700/60 text-amber-300'
                      }`}
                    >
                      {dataSource === 'custom-api'
                        ? 'Connected (Custom API)'
                        : dataSource === 'api'
                        ? 'Connected (Remote API)'
                        : 'Local Snapshot / Fallback'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect directly to your C# ASP.NET Legendary card backend or inspect connection health.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={isSyncing || isDataLoading}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-lg shadow-purple-900/30 active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isDataLoading ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
                </button>
              </div>
            </div>

            {/* Current Loaded Counts Badge Bar */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Expansions</div>
                <div className="text-slate-100 font-bold text-sm mt-0.5">{expansions.length}</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Heroes</div>
                <div className="text-slate-100 font-bold text-sm mt-0.5">{heroes.length}</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Masterminds</div>
                <div className="text-slate-100 font-bold text-sm mt-0.5">{masterminds.length}</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Villains</div>
                <div className="text-slate-100 font-bold text-sm mt-0.5">{villains.length}</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Henchmen</div>
                <div className="text-slate-100 font-bold text-sm mt-0.5">{henchmen.length}</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Schemes</div>
                <div className="text-slate-100 font-bold text-sm mt-0.5">{schemes.length}</div>
              </div>
            </div>

            {/* URL Input and Actions */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase">
                Backend API Base Address
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Server className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="e.g. https://api.frostpointlabs.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center justify-center gap-1.5 active:scale-95 border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  disabled={isSyncing}
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors shrink-0 border border-slate-800"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Test Result Diagnostic Card */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
                {testResult.endpointUsed && (
                  <div className="text-[11px] text-slate-400 font-mono pl-6">
                    Endpoint: {testResult.endpointUsed}
                  </div>
                )}
                {testResult.dataSummary && (
                  <div className="text-[11px] text-slate-300 pl-6 flex flex-wrap gap-x-3 gap-y-1 pt-1">
                    <span>Heroes: {testResult.dataSummary.heroesCount}</span>
                    <span>Masterminds: {testResult.dataSummary.mastermindsCount}</span>
                    <span>Villains: {testResult.dataSummary.villainsCount}</span>
                    <span>Henchmen: {testResult.dataSummary.henchmenCount}</span>
                    <span>Schemes: {testResult.dataSummary.schemesCount}</span>
                    <span>Sets: {testResult.dataSummary.expansionsCount}</span>
                  </div>
                )}
                {testResult.isCorsError && (
                  <div className="mt-2 p-2.5 bg-slate-950/80 border border-amber-800/60 rounded-lg text-amber-200 text-[11px] space-y-1">
                    <div className="font-bold text-amber-300">How to resolve CORS in C# ASP.NET:</div>
                    <p className="text-slate-300">
                      In your backend <code className="text-purple-300 font-mono">Program.cs</code>, ensure CORS is enabled:
                    </p>
                    <pre className="bg-slate-900 p-2 rounded text-[10px] font-mono text-slate-200 overflow-x-auto">
{`builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});
// Before app.MapControllers():
app.UseCors("AllowAll");`}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {syncMessage && (
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300">
                {syncMessage}
              </div>
            )}
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
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                  Maximum Scheme Difficulty
                </label>
                <select
                  value={settings.maxDifficulty || 'Any'}
                  onChange={(e) =>
                    onUpdateSettings({ maxDifficulty: e.target.value as any })
                  }
                  className="w-full px-3 py-2.5 min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-purple-500"
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

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={exclusionSearch}
                    onChange={(e) => setExclusionSearch(e.target.value)}
                    placeholder={`Search ${selectedExclusionType} to exclude...`}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {filteredCandidates.length > 0 && (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
                    {filteredCandidates.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between px-3 py-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-900"
                      >
                        <span className="text-xs text-slate-200">{c.name}</span>
                        <button
                          type="button"
                          onClick={() => handleAddExcluded(c.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold"
                        >
                          Exclude
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                  {settings.excludedCardIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/50 border border-rose-900/60 text-rose-300 text-xs"
                    >
                      <span>{findCardName(id)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExcluded(id)}
                        className="hover:text-rose-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
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
