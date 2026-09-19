import React, { useState, useMemo } from 'react';
import { X, BookOpen, Layers, ShieldAlert, FileText, Info, Search, Languages, Scroll, AlertTriangle } from 'lucide-react';
import { GAME_KEYWORDS } from '../data/keywords';
import { VILLAINS_GLOSSARY } from '../utils/terminologyTranslator';
import { ActiveSetup } from '../types';
import { RichRulesText } from './symbols/RichRulesText';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  setup?: ActiveSetup | null;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, setup }) => {
  const [activeTab, setActiveTab] = useState<'setup' | 'keywords' | 'villains'>('setup');
  const [keywordSearch, setKeywordSearch] = useState('');
  const [villainsSearch, setVillainsSearch] = useState('');

  const sortedKeywords = useMemo(() => {
    return [...GAME_KEYWORDS].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredKeywords = useMemo(() => {
    const q = keywordSearch.trim().toLowerCase();
    if (!q) return sortedKeywords;
    return sortedKeywords.filter((kw) => {
      const matchName = kw.name.toLowerCase().includes(q);
      const matchRule = kw.rule.toLowerCase().includes(q);
      const matchAliases = kw.aliases?.some((a) => a.toLowerCase().includes(q));
      return matchName || matchRule || matchAliases;
    });
  }, [sortedKeywords, keywordSearch]);

  const filteredVillainsGlossary = useMemo(() => {
    const q = villainsSearch.trim().toLowerCase();
    if (!q) return VILLAINS_GLOSSARY;
    return VILLAINS_GLOSSARY.filter((item) => {
      const matchTerm = item.villainsTerm.toLowerCase().includes(q);
      const matchBase = item.baseTerm.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      return matchTerm || matchBase || matchDesc;
    });
  }, [villainsSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base sm:text-lg text-slate-100 font-['Cinzel'] tracking-wide">
              Rules & Reference Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Header */}
        <div className="flex border-b border-slate-800 bg-slate-950/20 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('setup')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'setup'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Deck Setup Breakdown
          </button>
          <button
            onClick={() => setActiveTab('keywords')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'keywords'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Keywords Reference ({GAME_KEYWORDS.length})
          </button>
          <button
            onClick={() => setActiveTab('villains')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'villains'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Villains Terminology Guide
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'setup' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-200 text-sm">
                  Active Scenario Breakdown
                </h4>
                {setup && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {setup.playerCount} Player{setup.playerCount > 1 ? 's' : ''} Game
                  </span>
                )}
              </div>

              {!setup || !setup.deckBreakdown ? (
                <div className="text-center py-12 text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                  <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p>Generate a setup first to see the exact deck composition.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Scheme Rules Details Section */}
                  {setup.scheme && (
                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3 shadow-inner">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Scroll className="w-4 h-4 text-amber-400" />
                          <span className="font-bold text-slate-100 text-sm">{setup.scheme.name}</span>
                        </div>
                        <span className="text-xs font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-900/50">
                          {setup.scheme.twists} Twists
                        </span>
                      </div>

                      <div className="space-y-2 text-xs sm:text-sm">
                        {setup.scheme.setupRule && (
                          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                            <RichRulesText
                              text={
                                /^(Setup|When revealed):/i.test(setup.scheme.setupRule.trim())
                                  ? setup.scheme.setupRule
                                  : `Setup: ${setup.scheme.setupRule}`
                              }
                            />
                          </div>
                        )}

                        {setup.scheme.specialRules && (
                          <div className="bg-sky-950/30 p-2.5 rounded-lg border border-sky-900/50">
                            <RichRulesText
                              text={
                                /^Special Rules?:/i.test(setup.scheme.specialRules.trim())
                                  ? setup.scheme.specialRules
                                  : `Special Rules: ${setup.scheme.specialRules}`
                              }
                            />
                          </div>
                        )}

                        {setup.scheme.evilWins && (
                          <div className="bg-red-950/20 p-2.5 rounded-lg border border-red-900/30">
                            <RichRulesText
                              text={
                                /^Evil Wins:/i.test(setup.scheme.evilWins.trim())
                                  ? setup.scheme.evilWins
                                  : `Evil Wins: ${setup.scheme.evilWins}`
                              }
                            />
                          </div>
                        )}

                        {setup.specialSetupNotes && setup.specialSetupNotes.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 space-y-1">
                            <span className="font-bold text-amber-300 text-xs flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Setup Modifications
                            </span>
                            <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-0.5">
                              {setup.specialSetupNotes.map((note, idx) => (
                                <li key={idx}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}
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
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center text-center">
                          <span className="text-slate-400 block text-[10px] uppercase">Villains</span>
                          <span className="font-bold text-slate-200">{setup.deckBreakdown.villainCards} ({setup.villains.length} groups)</span>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center text-center">
                          <span className="text-slate-400 block text-[10px] uppercase">Henchmen</span>
                          <span className="font-bold text-slate-200">
                            {setup.playerCount === 1
                              ? '2 cards in deck (2 in City)'
                              : `${setup.deckBreakdown.henchmenCards} (${setup.henchmen.length} groups)`}
                          </span>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center text-center">
                          <span className="text-slate-400 block text-[10px] uppercase">Bystanders</span>
                          <span className="font-bold text-slate-200">{setup.bystandersCount} {setup.bystandersCount === 1 ? 'card' : 'cards'}</span>
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

          {activeTab === 'keywords' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl shadow-inner mb-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-amber-400">Game Keywords Reference</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      A comprehensive list of all keywords found in Marvel Legendary expansions, listed alphabetically.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 self-start sm:self-auto shrink-0">
                    {filteredKeywords.length} of {sortedKeywords.length} Keywords
                  </span>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search keywords by name, rules text, or aliases..."
                    value={keywordSearch}
                    onChange={(e) => setKeywordSearch(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  {keywordSearch && (
                    <button
                      onClick={() => setKeywordSearch('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors"
                      aria-label="Clear keyword search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredKeywords.map((kw, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-amber-500/30 transition-colors flex flex-col justify-between">
                    <div>
                      <h5 className="font-extrabold text-slate-100 text-sm mb-1.5 uppercase tracking-wider text-amber-400">
                        {kw.name}
                      </h5>
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{kw.rule}</p>
                    </div>
                    {kw.aliases && kw.aliases.length > 0 && (
                      <p className="text-xs text-slate-500 mt-2.5 pt-2 border-t border-slate-800/80 italic">
                        Aliases: {kw.aliases.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
                {filteredKeywords.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                    No keywords found matching "<span className="text-slate-300 font-semibold">{keywordSearch}</span>".
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'villains' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl shadow-inner mb-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-cyan-400 flex items-center gap-2">
                      <Languages className="w-4 h-4" />
                      Villains & Fear Itself Terminology Translation Matrix
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <em>Legendary: Villains</em> and <em>Fear Itself</em> invert standard perspective. Use this guide to translate terms.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 self-start sm:self-auto shrink-0">
                    {filteredVillainsGlossary.length} of {VILLAINS_GLOSSARY.length} Terms
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search terms or meanings..."
                    value={villainsSearch}
                    onChange={(e) => setVillainsSearch(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  {villainsSearch && (
                    <button
                      onClick={() => setVillainsSearch('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors"
                      aria-label="Clear villains search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredVillainsGlossary.map((item, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-cyan-500/40 transition-colors">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                      <span className="text-sm font-bold text-rose-400">{item.villainsTerm}</span>
                      <span className="text-xs text-slate-500 uppercase font-semibold">translates to</span>
                      <span className="text-sm font-bold text-cyan-300">{item.baseTerm}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                  </div>
                ))}
                {filteredVillainsGlossary.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                    No terms found matching "<span className="text-slate-300 font-semibold">{villainsSearch}</span>".
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
