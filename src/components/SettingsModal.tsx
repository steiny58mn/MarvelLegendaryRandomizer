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
  Database,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Globe,
  FileText,
} from 'lucide-react';
import {
  testApiEndpoint,
  getEffectiveApiUrl,
  UpdateDbResult,
  ApiTestResult,
} from '../utils/apiConfig';

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

  const {
    expansions,
    apiUrl,
    setApiUrl,
    resetApiUrl,
    refreshData,
    uploadDatabaseJson,
  } = useData();

  const [customApiUrlInput, setCustomApiUrlInput] = useState(apiUrl || '');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [testResult, setTestResult] = useState<ApiTestResult | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UpdateDbResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomApiUrlInput(apiUrl || '');
  }, [apiUrl]);

  const handleSaveApiUrl = () => {
    setApiUrl(customApiUrlInput.trim());
    setTestResult(null);
  };

  const handleResetApiUrl = () => {
    resetApiUrl();
    setCustomApiUrlInput('');
    setTestResult(null);
  };

  const handleTestApi = async () => {
    setIsTestingApi(true);
    setTestResult(null);
    try {
      const target = customApiUrlInput.trim() || undefined;
      const res = await testApiEndpoint(target);
      setTestResult(res);
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleReloadCards = async () => {
    setIsReloading(true);
    setTestResult(null);
    try {
      await refreshData();
    } finally {
      setIsReloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUploadDatabase = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadResult(null);
    try {
      const res = await uploadDatabaseJson(selectedFile);
      setUploadResult(res);
      if (res.success) {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (e: any) {
      setUploadResult({
        success: false,
        message: e?.message || 'Failed to upload cards-data.json.',
      });
    } finally {
      setIsUploading(false);
    }
  };
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


          {/* Database & API Configuration Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-700/50 text-purple-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Database & API Configuration
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect directly to the backend database API and upload cards-data.json to update the DB.
                  </p>
                </div>
              </div>
            </div>

            {/* API Endpoint Address */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                API Base Address
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={customApiUrlInput}
                    onChange={(e) => setCustomApiUrlInput(e.target.value)}
                    placeholder={getEffectiveApiUrl()}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSaveApiUrl}
                    className="py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Save URL
                  </button>
                  {apiUrl && (
                    <button
                      type="button"
                      onClick={handleResetApiUrl}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer border border-slate-700"
                      title="Reset to default API address"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleTestApi}
                    disabled={isTestingApi}
                    className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingApi ? 'animate-spin' : ''}`} />
                    <span>{isTestingApi ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReloadCards}
                    disabled={isReloading}
                    className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700 disabled:opacity-50"
                    title="Reload cards from API database"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
                    <span>{isReloading ? 'Reloading...' : 'Reload Cards'}</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`mt-2 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">{testResult.message}</div>
                    {testResult.dataSummary && (
                      <div className="mt-1 text-[11px] text-emerald-300/80 font-mono">
                        Expansions: {testResult.dataSummary.expansionsCount || 0} | Heroes:{' '}
                        {testResult.dataSummary.heroesCount || 0} | Masterminds:{' '}
                        {testResult.dataSummary.mastermindsCount || 0} | Villains:{' '}
                        {testResult.dataSummary.villainsCount || 0} | Schemes:{' '}
                        {testResult.dataSummary.schemesCount || 0}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Database Upload Section (legendary/updatedb) */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-purple-400" />
                    <span>Upload cards-data.json to API Database</span>
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    POST a <code className="text-purple-300 font-mono">cards-data.json</code> file to the API endpoint{' '}
                    <code className="text-purple-300 font-mono">legendary/updatedb</code> to update the database.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="settings-db-json-upload"
                />
                <label
                  htmlFor="settings-db-json-upload"
                  className="flex-1 py-2 px-3 bg-slate-950 border border-slate-700 hover:border-purple-500/70 rounded-xl text-xs text-slate-300 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="truncate">
                    {selectedFile ? (
                      <span className="text-slate-100 font-medium">
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    ) : (
                      'Choose cards-data.json file...'
                    )}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleUploadDatabase}
                  disabled={!selectedFile || isUploading}
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-sm"
                >
                  <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
                  <span>{isUploading ? 'Updating DB...' : 'Upload to DB'}</span>
                </button>
              </div>

              {uploadResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    uploadResult.success
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  }`}
                >
                  {uploadResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-semibold">{uploadResult.message}</div>
                    {uploadResult.counts && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-emerald-300/90 font-mono pt-1">
                        <div>Expansions: {uploadResult.counts.expansions ?? 0}</div>
                        <div>Heroes: {uploadResult.counts.heroes ?? 0}</div>
                        <div>Masterminds: {uploadResult.counts.masterminds ?? 0}</div>
                        <div>Villains: {uploadResult.counts.villains ?? 0}</div>
                        <div>Henchmen: {uploadResult.counts.henchmen ?? 0}</div>
                        <div>Schemes: {uploadResult.counts.schemes ?? 0}</div>
                      </div>
                    )}
                  </div>
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
