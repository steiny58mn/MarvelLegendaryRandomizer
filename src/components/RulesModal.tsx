import React, { useState } from 'react';
import { GameRulesSection } from './GameRulesSection';
import { ActiveSetup } from '../types';
import { X, Layers, Scroll, Key, Info } from 'lucide-react';
import { GAME_KEYWORDS } from '../data/keywords';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  setup: ActiveSetup | null;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, setup }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'deck' | 'keywords'>('rules');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pb-safe">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <Scroll className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-slate-100 text-lg sm:text-xl uppercase tracking-wider font-['Cinzel']">
              Rules & Reference
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex bg-slate-950/50 border-b border-slate-800 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 min-w-[120px] py-3 px-4 text-sm font-bold tracking-wide uppercase transition-colors ${
              activeTab === 'rules'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Game Rules
          </button>
          <button
            onClick={() => setActiveTab('deck')}
            className={`flex-1 min-w-[150px] py-3 px-4 text-sm font-bold tracking-wide uppercase transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'deck'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Deck Setup Guide
          </button>
          <button
            onClick={() => setActiveTab('keywords')}
            className={`flex-1 min-w-[120px] py-3 px-4 text-sm font-bold tracking-wide uppercase transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'keywords'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            Keywords
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar relative">
          {activeTab === 'rules' && <GameRulesSection />}
            
          {activeTab === 'deck' && (
            <div className="space-y-6">
              {!setup ? (
                <div className="p-8 text-center text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800">
                  <p>Generate a setup first to see the exact deck composition.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hero Deck */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-400 text-sm">Hero Deck</span>
                      <span className="text-xs font-bold text-slate-200 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-900/50">
                        {setup.deckBreakdown.heroDeckCount} Cards
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 pt-1">
                      Combine all 14 cards from each of the <strong className="text-slate-200">{setup.heroes.length} selected heroes</strong> (1 Rare, 3 Uncommons, 10 Commons) and shuffle thoroughly.
                    </p>
                  </div>

                  {/* Villain Deck */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-400 text-sm">Villain Deck</span>
                      <span className="text-xs font-bold text-slate-200 bg-red-950/40 px-2 py-1 rounded border border-red-900/50">
                        {setup.deckBreakdown.villainDeckTotal} Cards
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center text-center">
                        <span className="text-slate-400 block text-[10px] uppercase">Villains</span>
                        <span className="font-bold text-slate-200">{setup.deckBreakdown.villainCards} ({setup.villains.length} groups)</span>
                      </div>
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center text-center">
                        <span className="text-slate-400 block text-[10px] uppercase">Henchmen</span>
                        <span className="font-bold text-slate-200">
                          {setup.playerCount === 1
                            ? '2 cards (in deck)'
                            : `${setup.deckBreakdown.henchmenCards} (${setup.henchmen.length} groups)`}
                        </span>
                      </div>
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center text-center">
                        <span className="text-slate-400 block text-[10px] uppercase">Bystanders</span>
                        <span className="font-bold text-slate-200">{setup.bystandersCount} cards</span>
                      </div>
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center text-center">
                        <span className="text-slate-400 block text-[10px] uppercase">Master Strikes</span>
                        <span className="font-bold text-slate-200">{setup.masterStrikesCount} cards</span>
                      </div>
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center text-center col-span-2 sm:col-span-1">
                        <span className="text-slate-400 block text-[10px] uppercase">Scheme Twists</span>
                        <span className="font-bold text-slate-200">{setup.twistsCount} cards</span>
                      </div>
                    </div>

                    {setup.playerCount === 1 && (
                      <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2 mt-2">
                        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-300">1P Solo Setup: </span>
                          Use <strong>4 Henchmen total</strong>: shuffle <strong>2 Henchmen into the Villain Deck</strong> and place <strong>2 Henchmen on the first two city spaces</strong> (Sewers & Bank). Return the remaining <strong>6 Henchmen</strong> to the game box.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'keywords' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl shadow-inner mb-6">
                <h4 className="font-bold text-amber-400 mb-2">Game Keywords Reference</h4>
                <p className="text-sm text-slate-300">
                  A comprehensive list of all keywords found in Marvel Legendary expansions, listed alphabetically.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GAME_KEYWORDS.sort((a, b) => a.name.localeCompare(b.name)).map((kw, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-amber-500/30 transition-colors">
                    <h5 className="font-extrabold text-slate-100 text-sm mb-1.5 uppercase tracking-wider text-amber-400">
                      {kw.name}
                    </h5>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{kw.rule}</p>
                    {kw.aliases && kw.aliases.length > 0 && (
                      <p className="text-xs text-slate-500 mt-2 italic">
                        Aliases: {kw.aliases.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
