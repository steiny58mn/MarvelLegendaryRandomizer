import React, { useState } from 'react';
import { ActiveSetup } from '../types';
import { GameRulesSection, RuleFilter } from './GameRulesSection';
import { KeywordsReferenceView } from './KeywordsReferenceView';
import {
  X,
  BookOpen,
  Sparkles,
  Info,
  Shield,
  Layers,
  Tag,
} from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  setup: ActiveSetup | null;
  initialTab?: 'guide' | 'keywords' | 'scenario';
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  setup,
  initialTab = 'scenario',
}) => {
  const [activeTab, setActiveTab] = useState<'scenario' | 'guide' | 'keywords'>(
    setup ? initialTab : 'guide'
  );
  const [guideFilter] = useState<RuleFilter>('all');

  if (!isOpen) return null;

  const safeBystandersCount = setup
    ? ((setup.bystandersCount != null && setup.bystandersCount > 0) ? setup.bystandersCount : (setup.deckBreakdown?.bystanders != null && setup.deckBreakdown.bystanders > 0) ? setup.deckBreakdown.bystanders : (setup.playerCount === 1 ? 1 : setup.playerCount <= 3 ? 2 : setup.playerCount === 4 ? 8 : 12))
    : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900/95 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/10 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-purple-500/30 bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-100 font-['Cinzel']">
                Legendary Rulebook & Scenario Breakdown
              </h3>
              <p className="text-xs text-purple-200/80">
                Official game mechanics, player count rules, and active deck details.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-900/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-purple-500/20 bg-slate-950/60">
          {setup && (
            <button
              onClick={() => setActiveTab('scenario')}
              className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'scenario'
                  ? 'border-purple-400 text-purple-300 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Active Scenario</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'guide'
                ? 'border-purple-400 text-purple-300 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Rules Reference Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('keywords')}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'keywords'
                ? 'border-purple-400 text-purple-300 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Keywords Index</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'scenario' && setup && (
            <div className="space-y-6">
              {/* Active Scenario Setup Summary */}
              {setup.deckBreakdown && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-400" />
                      <span>Active Scenario Deck Breakdown ({setup.playerCount} Players)</span>
                    </h4>
                    <span className="px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold">
                      Exact Counts
                    </span>
                  </div>

                  {/* Scheme Modifiers & Special Notes Callout */}
                  {setup.specialSetupNotes && setup.specialSetupNotes.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1">
                        <span className="font-bold text-purple-200 text-xs uppercase tracking-wide block">
                          Active Scenario Rules & Scheme Setup
                        </span>
                        <ul className="list-disc list-inside text-xs text-purple-200/90 space-y-1">
                          {setup.specialSetupNotes.map((note, idx) => (
                            <li key={idx} className="leading-relaxed">{note}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

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
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center text-center">
                          <span className="text-slate-400 block text-[10px] uppercase">Villains</span>
                          <span className="font-bold text-slate-200">{setup.deckBreakdown.villainCards} ({setup.villains.length} groups)</span>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center text-center">
                          <span className="text-slate-400 block text-[10px] uppercase">Henchmen</span>
                          <span className="font-bold text-slate-200">
                            {setup.playerCount === 1
                              ? '2 in deck (2 in City)'
                              : `${setup.deckBreakdown.henchmenCards} (${setup.henchmen.length} groups)`}
                          </span>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center text-center">
                          <span className="text-slate-400 block text-[10px] uppercase">Bystanders</span>
                          <span className="font-bold text-slate-200">{safeBystandersCount} {safeBystandersCount === 1 ? 'card' : 'cards'}</span>
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
                        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200/90 flex items-start gap-2.5 mt-2">
                          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold text-amber-300">1P Solo Setup Rules:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] sm:text-xs">
                              <li><strong>Bystanders:</strong> Put <strong>1 Bystander</strong> in the Villain Deck (unless modified by Scheme).</li>
                              <li><strong>Henchmen:</strong> Use <strong>4 Henchmen total</strong> from 1 group: shuffle <strong>2 into the Villain Deck</strong> and place <strong>2 on the first two city spaces</strong> (Sewers & Bank). Return <strong>6 Henchmen</strong> to the box.</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'guide' && (
            <GameRulesSection initialFilter={guideFilter} />
          )}

          {activeTab === 'keywords' && (
            <KeywordsReferenceView />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-purple-500/20 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-purple-400" />
            <span>Legendary: A Marvel Deck Building Game Reference</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 hover:from-purple-900 hover:via-indigo-900 hover:to-purple-800 text-purple-100 hover:text-white border border-purple-500/50 hover:border-purple-400/80 shadow-md ring-1 ring-white/15 backdrop-blur-md active:scale-95 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

