import React from 'react';
import {
  Dices,
  Layers,
  BookOpen,
  Trophy,
  Settings,
  Bookmark,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';

export type ActiveTab =
  | 'randomizer'
  | 'expansions'
  | 'vault'
  | 'score'
  | 'saved';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  onTabChange?: (tab: ActiveTab) => void;
  savedSetupsCount: number;
  enabledExpansionsCount: number;
  totalExpansionsCount: number;
  onOpenSettings: () => void;
  onOpenSymbols?: () => void;
  onToggleLockAll?: () => void;
  isAllLocked?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onTabChange,
  savedSetupsCount,
  enabledExpansionsCount,
  totalExpansionsCount,
  onOpenSettings,
  onOpenSymbols,
  onToggleLockAll,
  isAllLocked = false,
}) => {
  const handleTabClick = (tab: ActiveTab) => {
    if (setActiveTab) setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 pt-2 sm:pt-1">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-900/30 shrink-0 overflow-hidden p-1">
              <img
                src="/app-icon.svg"
                alt="Legendary Randomizer"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="pt-0.5">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-xl tracking-wider text-slate-100 uppercase font-['Cinzel'] leading-tight sm:leading-normal">
                  Legendary <span className="text-purple-400">Setup Randomizer</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Marvel Deck-Building Game Randomizer & Setup Companion
              </p>
            </div>
          </div>

          {/* Action Buttons & Expansion badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Lock / Unlock All Button (Deep Crimson Red Theme) */}
            {onToggleLockAll && (
              <button
                onClick={onToggleLockAll}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 touch-manipulation backdrop-blur-md bg-gradient-to-r from-rose-950/95 via-red-950/95 to-rose-950/95 hover:from-rose-900/90 hover:to-red-900/90 border-red-900/70 hover:border-red-700/80 ring-1 ring-white/10 ${
                  isAllLocked
                    ? 'text-slate-400 hover:text-slate-300'
                    : 'text-red-400 hover:text-red-300'
                }`}
                title={isAllLocked ? 'Unlock all cards in setup' : 'Lock all cards in setup'}
              >
                {isAllLocked ? (
                  <Unlock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 shrink-0 text-red-400" />
                )}
                <span>{isAllLocked ? 'Unlock All' : 'Lock All'}</span>
              </button>
            )}

            {/* Sets Button */}
            <button
              onClick={() => handleTabClick('expansions')}
              className="text-xs font-bold text-purple-200 hover:text-white px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 hover:from-purple-900 hover:via-indigo-900 hover:to-purple-800 border border-purple-500/50 hover:border-purple-400/80 transition-all shadow-lg shadow-purple-950/60 ring-1 ring-white/15 backdrop-blur-md flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 touch-manipulation"
              title="Manage Active Expansions"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="hidden sm:inline font-semibold">Sets:</span>
              <span className="font-extrabold text-purple-100">
                {enabledExpansionsCount}/{totalExpansionsCount}
              </span>
            </button>

            {onOpenSymbols && (
              <button
                onClick={onOpenSymbols}
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border border-slate-700/60 hover:border-purple-500/50 transition-all shadow-sm ring-1 ring-white/10 backdrop-blur-md flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 touch-manipulation"
                title="Legendary Symbol & Icon Reference"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="hidden md:inline">Symbols</span>
              </button>
            )}

            <button
              onClick={onOpenSettings}
              className="text-slate-400 hover:text-purple-300 p-2 rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border border-slate-700/60 hover:border-purple-500/50 transition-all shadow-sm ring-1 ring-white/10 backdrop-blur-md shrink-0 cursor-pointer active:scale-95 touch-manipulation mr-1 sm:mr-0"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="grid grid-cols-4 gap-1 sm:flex sm:space-x-2 py-2 border-t border-slate-800/80 text-xs sm:text-sm">
          <button
            id="nav-tab-randomizer"
            onClick={() => handleTabClick('randomizer')}
            title="Randomizer"
            className={`flex items-center justify-center sm:justify-start gap-2 px-1 sm:px-3.5 py-2 min-h-[38px] rounded-xl font-bold transition-all whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
              activeTab === 'randomizer'
                ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-purple-900/90 text-purple-100 border border-purple-500/50 shadow-md shadow-purple-950/50 ring-1 ring-white/15 backdrop-blur-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent hover:border-slate-800/80'
            }`}
          >
            <Dices className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="hidden sm:inline">Randomizer</span>
          </button>

          <button
            id="nav-tab-vault"
            onClick={() => handleTabClick('vault')}
            title="Card Vault"
            className={`flex items-center justify-center sm:justify-start gap-2 px-1 sm:px-3.5 py-2 min-h-[38px] rounded-xl font-bold transition-all whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-purple-900/90 text-purple-100 border border-purple-500/50 shadow-md shadow-purple-950/50 ring-1 ring-white/15 backdrop-blur-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent hover:border-slate-800/80'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="hidden sm:inline">Card Vault</span>
          </button>

          <button
            id="nav-tab-score"
            onClick={() => handleTabClick('score')}
            title="Scoring"
            className={`flex items-center justify-center sm:justify-start gap-2 px-1 sm:px-3.5 py-2 min-h-[38px] rounded-xl font-bold transition-all whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
              activeTab === 'score'
                ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-purple-900/90 text-purple-100 border border-purple-500/50 shadow-md shadow-purple-950/50 ring-1 ring-white/15 backdrop-blur-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent hover:border-slate-800/80'
            }`}
          >
            <Trophy className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="hidden sm:inline">Scoring</span>
          </button>

          <button
            id="nav-tab-saved"
            onClick={() => handleTabClick('saved')}
            title="Saved Setups"
            className={`flex items-center justify-center sm:justify-start gap-2 px-1 sm:px-3.5 py-2 min-h-[38px] rounded-xl font-bold transition-all whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-purple-900/90 text-purple-100 border border-purple-500/50 shadow-md shadow-purple-950/50 ring-1 ring-white/15 backdrop-blur-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent hover:border-slate-800/80'
            }`}
          >
            <Bookmark className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="hidden sm:inline">Saved Setups</span>
            {savedSetupsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-purple-950/90 text-purple-300 border border-purple-500/40 ring-1 ring-white/10">
                {savedSetupsCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
