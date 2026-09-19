import React, { useState } from 'react';
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
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  testApiEndpoint,
  ApiTestResult,
  getApiDiagnosticInfo,
  ApiDiagnosticInfo,
} from '../utils/apiConfig';
import { useData } from '../contexts/DataContext';

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
  const { apiUrl, setApiUrl, resetApiUrl, dataSource, refreshData } = useData();
  const [exclusionSearch, setExclusionSearch] = useState('');
  const [selectedExclusionType, setSelectedExclusionType] = useState<
    'scheme' | 'mastermind' | 'hero' | 'villain'
  >('scheme');
  const [translateVillainsTerms, setTranslateVillainsTerms] = useState<boolean>(
    Boolean(settings.translateVillainsTerms)
  );

  // API Config State
  const [inputApiUrl, setInputApiUrl] = useState<string>(apiUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [testResult, setTestResult] = useState<ApiTestResult | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<ApiDiagnosticInfo>(() => getApiDiagnosticInfo());

  // Sync inputApiUrl and diagnostics when modal opens or external apiUrl changes
  React.useEffect(() => {
    setInputApiUrl(apiUrl || '');
    setDiagnostics(getApiDiagnosticInfo());
  }, [apiUrl, isOpen]);

  if (!isOpen) return null;

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

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSaveFeedback(null);
    try {
      const res = await testApiEndpoint(inputApiUrl);
      setTestResult(res);
      setDiagnostics(getApiDiagnosticInfo());
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Error testing connection to API endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndReload = async () => {
    setIsReloading(true);
    setSaveFeedback(null);
    try {
      setApiUrl(inputApiUrl);
      await refreshData();
      setDiagnostics(getApiDiagnosticInfo());
      setSaveFeedback('API address saved and card database reloaded successfully.');
    } catch (e: any) {
      setSaveFeedback(`Failed to reload dataset: ${e?.message || 'Unknown error'}`);
    } finally {
      setIsReloading(false);
    }
  };

  const handleResetApiUrl = async () => {
    resetApiUrl();
    setInputApiUrl('');
    setTestResult(null);
    setSaveFeedback('Reset to default backend API. Reloading...');
    try {
      await refreshData();
      setDiagnostics(getApiDiagnosticInfo());
      setSaveFeedback('Default API configuration restored.');
    } catch (e: any) {
      setSaveFeedback('Default API restored.');
    }
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

              {/* Toggle Diagnostic Details Button */}
              <button
                type="button"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-amber-400 text-xs font-medium transition-colors self-start sm:self-auto"
                title="View build and deployed API diagnostics"
              >
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Diagnostics</span>
                {showDiagnostics ? (
                  <ChevronUp className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
                )}
              </button>
            </div>

            {/* Diagnostic Details Panel */}
            {showDiagnostics && (
              <div className="p-3.5 bg-slate-950/90 border border-amber-500/30 rounded-xl space-y-2.5 text-xs text-slate-300 animate-fade-in">
                <div className="flex items-center gap-2 font-bold text-amber-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Deployed API & Runtime Diagnostics</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-0.5 font-semibold">Deployed / Build URL (VITE_API_URL):</span>
                    <span className="font-mono text-emerald-400 break-all select-all">
                      {diagnostics.deployedEnvUrl}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-0.5 font-semibold">Browser Override (localStorage):</span>
                    <span className="font-mono text-cyan-400 break-all select-all">
                      {diagnostics.storedOverrideUrl}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-0.5 font-semibold">Effective Active Base URL:</span>
                    <span className="font-mono text-amber-300 break-all select-all">
                      {diagnostics.effectiveBaseUrl}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-0.5 font-semibold">Current Web Origin:</span>
                    <span className="font-mono text-slate-300 break-all select-all">
                      {diagnostics.currentOrigin}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Note: If using Docker / Portainer, ensure your backend server exposes CORS for this web application origin or uses a reverse proxy.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  API Server Base URL
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={inputApiUrl}
                      onChange={(e) => {
                        setInputApiUrl(e.target.value);
                        setTestResult(null);
                        setSaveFeedback(null);
                      }}
                      placeholder="https://api.frostpointlabs.com"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3.5 py-2.5 min-h-[42px] rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 touch-manipulation shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAndReload}
                    disabled={isReloading}
                    className="px-4 py-2.5 min-h-[42px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 touch-manipulation shrink-0"
                  >
                    <Server className="w-3.5 h-3.5" />
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
                      currentAlwaysLeadsRule === item.rule
                        ? 'bg-amber-500/10 border-amber-500 text-slate-100'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalAlwaysLeadsRule"
                      checked={currentAlwaysLeadsRule === item.rule}
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
