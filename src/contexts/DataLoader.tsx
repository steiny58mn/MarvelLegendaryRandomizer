import React, { useState } from 'react';
import { useData } from './DataContext';
import { RefreshCw, Upload, AlertTriangle, CheckCircle2, Globe, Edit2 } from 'lucide-react';
import { getEffectiveApiUrl } from '../utils/apiConfig';

export const DataLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, error, refreshData, uploadDatabaseJson, apiUrl, setApiUrl, resetApiUrl } = useData();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(apiUrl || '');

  const effectiveApiUrl = apiUrl || getEffectiveApiUrl();

  const handleRetry = async () => {
    setIsRetrying(true);
    setUploadResult(null);
    try {
      await refreshData();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSaveUrl = async () => {
    setApiUrl(customUrlInput.trim());
    setIsEditingUrl(false);
    setIsRetrying(true);
    try {
      await refreshData(customUrlInput.trim());
    } finally {
      setIsRetrying(false);
    }
  };

  const handleResetUrl = async () => {
    resetApiUrl();
    setCustomUrlInput('');
    setIsEditingUrl(false);
    setIsRetrying(true);
    try {
      await refreshData('');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);
    try {
      const res = await uploadDatabaseJson(file);
      setUploadResult(res);
      if (res.success) {
        await refreshData();
      }
    } catch (e: any) {
      setUploadResult({
        success: false,
        message: e?.message || 'Upload failed.',
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-900/30 overflow-hidden p-2">
          <img
            src="/app-icon.svg"
            alt="Legendary Randomizer"
            className="w-full h-full object-contain animate-pulse"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="text-sm font-semibold tracking-wide text-purple-300 animate-pulse">
          Connecting to API database...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-xl w-full bg-slate-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl shadow-red-950/30 flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-2xl text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-100">Unable to Connect to Database API</h2>
            <p className="text-xs text-red-300/90 leading-relaxed text-left bg-red-950/30 border border-red-900/40 p-3 rounded-xl font-mono break-words">
              {error}
            </p>
          </div>

          <div className="w-full p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 font-mono text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                <Globe className="w-3 h-3 text-purple-400" />
                Target API Address:
              </span>
              <button
                type="button"
                onClick={() => {
                  setCustomUrlInput(effectiveApiUrl);
                  setIsEditingUrl(!isEditingUrl);
                }}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-sans font-semibold cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingUrl ? 'Cancel' : 'Change Address'}</span>
              </button>
            </div>

            <div className="text-purple-300 break-all">{effectiveApiUrl}</div>

            {isEditingUrl && (
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://api.example.com or /api/cards"
                  className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSaveUrl}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold font-sans cursor-pointer"
                  >
                    Save & Test
                  </button>
                  <button
                    type="button"
                    onClick={handleResetUrl}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-sans border border-slate-700 cursor-pointer"
                    title="Reset to default API"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {uploadResult && (
            <div
              className={`w-full p-3 rounded-xl border text-xs text-left flex items-start gap-2 ${
                uploadResult.success
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
              }`}
            >
              {uploadResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{uploadResult.message}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-2">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-900/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Retrying...' : 'Retry Connection'}</span>
            </button>

            <label className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700">
              <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-pulse' : ''}`} />
              <span>{isUploading ? 'Uploading...' : 'Upload cards-data.json'}</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
