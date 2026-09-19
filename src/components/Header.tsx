import React from 'react';
import {
  Dices,
  Layers,
  BookOpen,
  Trophy,
  Settings,
  Bookmark,
  Sparkles,
} from 'lucide-react';

export type ActiveTab =
  | 'randomizer'
  | 'expansions'
  | 'vault'
  | 'score'
  | 'saved';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  savedSetupsCount: number;
  enabledExpansionsCount: number;
  totalExpansionsCount: number;
  onQuickRandomize?: () => void;
  onOpenSettings: () => void;
  onOpenSymbols?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedSetupsCount,
  enabledExpansionsCount,
  totalExpansionsCount,
  onOpenSettings,
  onOpenSymbols,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 pt-2 sm:pt-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/40 shrink-0">
              <span className="font-extrabold text-slate-950 text-xl font-['Teko'] tracking-wider leading-none">
                LSR
              </span>
            </div>
            <div className="pt-0.5">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-xl tracking-wider text-slate-100 uppercase font-['Cinzel'] leading-tight sm:leading-normal">
                  Legendary <span className="text-amber-400">Setup Randomizer</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Marvel Deck-Building Game Randomizer & Setup Companion
              </p>
            </div>
          </div>

          {/* Action Button & Expansion badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab('expansions')}
              className="text-xs font-bold text-slate-950 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 border border-amber-400 transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
              title="Manage Active Expansions"
            >
              <Layers className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span className="hidden sm:inline font-semibold">Sets:</span>
              <span className="font-extrabold">
                {enabledExpansionsCount}/{totalExpansionsCount}
              </span>
            </button>

            {onOpenSymbols && (
              <button
                onClick={onOpenSymbols}
                className="text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/60 hover:border-amber-500/50 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Legendary Symbol & Icon Reference"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden md:inline">Symbols</span>
              </button>
            )}

            <button
              onClick={onOpenSettings}
              className="text-slate-400 hover:text-amber-400 p-2 rounded-lg bg-slate-900 border border-slate-700/60 hover:border-amber-500/50 transition-colors shrink-0 cursor-pointer active:scale-95"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2 border-t border-slate-800/80 text-xs sm:text-sm">
          <button
            id="nav-tab-randomizer"
            onClick={() => setActiveTab('randomizer')}
            className={`flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl font-semibold transition-all whitespace-nowrap active:scale-95 touch-manipulation ${
              activeTab === 'randomizer'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>Randomizer</span>
          </button>

          <button
            id="nav-tab-expansions"
            onClick={() => setActiveTab('expansions')}
            className={`flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl font-semibold transition-all whitespace-nowrap active:scale-95 touch-manipulation ${
              activeTab === 'expansions'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Expansions</span>
          </button>

          <button
            id="nav-tab-vault"
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl font-semibold transition-all whitespace-nowrap active:scale-95 touch-manipulation ${
              activeTab === 'vault'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Card Vault</span>
          </button>

          <button
            id="nav-tab-score"
            onClick={() => setActiveTab('score')}
            className={`flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl font-semibold transition-all whitespace-nowrap active:scale-95 touch-manipulation ${
              activeTab === 'score'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Scoring</span>
          </button>

          <button
            id="nav-tab-saved"
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl font-semibold transition-all whitespace-nowrap active:scale-95 touch-manipulation ${
              activeTab === 'saved'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Setups</span>
            {savedSetupsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {savedSetupsCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
