import React, { useState, useMemo } from 'react';
import { X, Search, Sparkles, Shield, Swords, Users, Info } from 'lucide-react';
import { SYMBOL_DEFINITIONS, GameSymbol } from './symbolDefinitions';
import { SymbolIcon } from './SymbolIcon';

interface SymbolLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SymbolLibraryModal: React.FC<SymbolLibraryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'core' | 'class' | 'team'>('all');

  const symbols = useMemo(() => {
    const list = Object.values(SYMBOL_DEFINITIONS);
    return list.filter((s) => {
      if (activeTab !== 'all' && s.category !== activeTab) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesDesc = s.description.toLowerCase().includes(q);
        const matchesAlias = s.aliases.some(a => a.toLowerCase().includes(q));
        return matchesName || matchesDesc || matchesAlias;
      }
      return true;
    });
  }, [search, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 font-['Cinzel'] tracking-wide">
                Legendary Symbol Library
              </h2>
              <p className="text-xs text-slate-400">
                Visual index of card symbols, hero classes, and affiliations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbols (e.g. Attack, Recruit, Instinct, Avengers)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
            {(
              [
                { id: 'all', label: 'All Symbols', icon: Sparkles },
                { id: 'core', label: 'Core Attributes', icon: Swords },
                { id: 'class', label: 'Hero Classes', icon: Shield },
                { id: 'team', label: 'Teams & Affiliations', icon: Users },
              ] as const
            ).map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Symbols Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {symbols.map((sym) => (
              <div
                key={sym.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex items-start gap-3.5 transition-all shadow-sm"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center p-2 shrink-0 border ${sym.badgeBg} ${sym.badgeBorder}`}
                >
                  <img
                    src={sym.iconSrc}
                    alt={sym.name}
                    className="w-full h-full object-contain filter drop-shadow select-none"
                    draggable={false}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-extrabold text-sm text-slate-100">{sym.name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {sym.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    {sym.description}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-mono">Code token:</span>
                    <code className="text-[11px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-mono">
                      [{sym.name}]
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {symbols.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Info className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">No symbols match "{search}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>{symbols.length} symbols in library</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
