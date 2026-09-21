import React from 'react';
import { useData } from './DataContext';

export const DataLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, error } = useData();

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
        <div className="text-sm font-semibold tracking-wide text-purple-300 animate-pulse">Loading database...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-400">
        Error: {error}
      </div>
    );
  }

  return <>{children}</>;
};
