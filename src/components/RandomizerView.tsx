import { getKeywordRule, GAME_KEYWORDS } from '../data/keywords';
import { KeywordBadge } from "./KeywordBadge";
import { RichRulesText } from './symbols/RichRulesText';
import React, { useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { prefetchImageUrl } from '../utils/imageOptimizer';
import {
  ActiveSetup,
  CardType,
} from '../types';
import { isVillainLedByMastermind, isHenchmanLedByMastermind } from '../utils/setupGenerator';
import { TeamBadge, ClassBadge, DifficultyBadge } from './CardBadges';
import {
  Dices,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  Bookmark,
  Swords,
  Sparkles,
  Users,
  Trophy,
  Skull,
  Scroll,
  UserCheck,
  Trash2,
} from 'lucide-react';

interface RandomizerViewProps {
  setup: ActiveSetup | null;
  playerCount: number;
  onPlayerCountChange: (count: number) => void;
  onRandomizeAll: () => void;
  onToggleLock: (
    type: 'scheme' | 'mastermind' | 'hero' | 'villain' | 'henchman',
    index?: number
  ) => void;
  onRerollSingle: (type: CardType, index?: number) => void;
  onOpenCardPicker: (type: CardType, currentId: string, index?: number) => void;
  onSaveSetup: (setup: ActiveSetup) => void;
  onStartScoring: (setup: ActiveSetup) => void;
  onClearSetup?: () => void;
  onOpenRulesModal: () => void;
  isSaved: boolean;
}

export function getCardKeywords(card: any): string[] {
  let list: string[] = [];
  if (card.keywords && card.keywords.length > 0) {
    list = card.keywords;
  } else if (card.highlightKeywords && card.highlightKeywords.length > 0) {
    list = card.highlightKeywords;
  } else {
    // Infer keywords from card text if not explicitly provided
    const textToSearch = [
      card.rulesText || '',
      card.description || '',
      card.text || '',
      card.masterStrikeText || '',
      card.setupRule || '',
      card.twistEffect || '',
      card.evilWins || '',
      card.fightEffect || '',
      card.escapeEffect || '',
      ...(Array.isArray(card.cards) ? card.cards.map((c: any) => c.rulesText || c.text || '') : [])
    ].join(' ');
    
    if (textToSearch.trim()) {
      const found = new Set<string>();
      for (const kw of GAME_KEYWORDS) {
        if (['Ambush', 'Fight', 'Escape', 'Rescue', 'Strike', 'Scheme Twist', 'Wound', 'Bribe', 'Bystander Rescue'].includes(kw.name)) continue;

        let matched = false;

        // Match using specific regex pattern if provided
        if (kw.matchPattern) {
          try {
            const regex = new RegExp(kw.matchPattern, 'i');
            if (regex.test(textToSearch)) {
              found.add(kw.name);
              matched = true;
            }
          } catch (e) {
            // fallback
          }
        }

        if (matched) continue;

        // Match keyword name as a whole word
        const regex = new RegExp(`\\b${kw.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (regex.test(textToSearch)) {
          found.add(kw.name);
          continue;
        }

        // Check aliases
        if (kw.aliases && kw.aliases.length > 0) {
          for (const alias of kw.aliases) {
            const aliasRegex = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
            if (aliasRegex.test(textToSearch)) {
              found.add(kw.name);
              break;
            }
          }
        }
      }
      list = Array.from(found);
    }
  }
    
  // Filter out thematic keywords
  return list.filter((kw: string) => !getKeywordRule(kw).includes('thematic tag'));
}

export const RandomizerView: React.FC<RandomizerViewProps> = ({
  setup,
  playerCount,
  onPlayerCountChange,
  onRandomizeAll,
  onToggleLock,
  onRerollSingle,
  onOpenCardPicker,
  onSaveSetup,
  onStartScoring,
  onClearSetup,
  onOpenRulesModal,
  isSaved,
}) => {
  const { expansions } = useData();
  const safeExpansions = useMemo(() => expansions || [], [expansions]);
  const expansionMap = useMemo(() => new Map(safeExpansions.map((e) => [e.id, e.name])), [safeExpansions]);

  // Pre-warm card artwork scans for the active game setup immediately
  useEffect(() => {
    if (!setup) return;
    const items = [
      setup.mastermind,
      setup.scheme,
      ...(setup.heroes || []),
      ...(setup.villains || []),
      ...(setup.henchmen || []),
    ];

    items.forEach((item: any) => {
      if (!item) return;
      if (item.imageUrl) prefetchImageUrl(item.imageUrl, 540, 75);
      if (Array.isArray(item.cards)) {
        item.cards.forEach((c: any) => {
          if (c.imageUrl) prefetchImageUrl(c.imageUrl, 540, 75);
        });
      }
    });
  }, [setup]);

  // If no active setup, render clean blank state with randomize controls
  if (!setup) {
    return (
      <div className="space-y-6 animate-fade-in pb-16 sm:pb-0">
        {/* Control Bar: Player Count & Generate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Players:</span>
              </div>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => onPlayerCountChange(count)}
                    className={`px-3.5 py-1.5 min-h-[38px] min-w-[36px] rounded-lg text-xs font-extrabold transition-all active:scale-95 touch-manipulation ${
                      playerCount === count
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black scale-105'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {count}P
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onOpenRulesModal}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 touch-manipulation transition-all"
              >
                <Scroll className="w-4 h-4" />
                <span className="hidden sm:inline">Rules</span>
              </button>
              <button
                onClick={onRandomizeAll}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 touch-manipulation transition-all"
              >
                <Dices className="w-4 h-4" />
                <span>Randomize Setup</span>
              </button>
            </div>
          </div>
        </div>

        {/* Blank state card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
            <Dices className="w-8 h-8 animate-pulse" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-xl font-black text-slate-100 tracking-wide font-['Cinzel']">
              Ready to Play Legendary
            </h3>
            <p className="text-sm text-slate-400">
              Select your player count above and tap <strong className="text-amber-400">Randomize Setup</strong> to build your game.
            </p>
          </div>
          <button
            onClick={onRandomizeAll}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 touch-manipulation"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Random Game</span>
          </button>
        </div>

        {/* Fixed Mobile Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-2.5 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 z-30 sm:hidden flex items-center justify-center gap-2 shadow-2xl safe-area-inset-bottom max-w-full box-border">
          <button
            onClick={onRandomizeAll}
            className="w-full max-w-md min-h-[44px] px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 touch-manipulation flex items-center justify-center gap-1.5"
          >
            <Dices className="w-4 h-4" />
            <span>Randomize Setup</span>
          </button>
        </div>
      </div>
    );
  }

  const isMastermindLocked = !setup.lockedSlots.mastermind;
  const isSchemeLocked = !setup.lockedSlots.scheme;

  const openGroupModal = (title: string, subtitle: string, cards: any[]) => {
    window.dispatchEvent(new CustomEvent('open-card-group-modal', { detail: { title, subtitle, cards } }));
  };

  const mmKeywords = getCardKeywords(setup.mastermind);
  const schemeKeywords = getCardKeywords(setup.scheme);

  return (
    <div className="space-y-5 pb-16 sm:pb-0 animate-fade-in">
      {/* Control Bar: Player Count & Primary Actions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 sm:gap-4">
          {/* Left: Player Count */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Players:</span>
              </div>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => onPlayerCountChange(count)}
                    className={`px-3 py-1.5 min-h-[36px] min-w-[34px] rounded-lg text-xs font-extrabold transition-all active:scale-95 touch-manipulation ${
                      setup.playerCount === count
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black scale-105'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {count}P
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <button
              onClick={onRandomizeAll}
              className="col-span-2 sm:col-span-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <Dices className="w-4 h-4" />
              <span>Randomize Setup</span>
            </button>

            <button
              onClick={() => onStartScoring(setup)}
              className="px-3.5 py-2.5 min-h-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Track Score</span>
            </button>
            
            <button
              onClick={onOpenRulesModal}
              className="px-3.5 py-2.5 min-h-[42px] rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <Scroll className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Rules</span>
            </button>

            <div className="col-span-2 sm:col-span-1 flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => onSaveSetup(setup)}
                className={`flex-1 sm:flex-initial p-2.5 min-h-[42px] rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border touch-manipulation active:scale-95 ${
                  isSaved
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Save this setup to favorites"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>

              {onClearSetup && (
                <button
                  onClick={onClearSetup}
                  className="flex-1 sm:flex-initial p-2.5 min-h-[42px] min-w-[42px] rounded-xl bg-slate-800/60 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 border border-slate-700/80 text-xs flex items-center justify-center transition-colors touch-manipulation active:scale-95 ml-auto"
                  title="Clear current setup"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* SECTION 1: MASTERMIND */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between gap-3 h-full">
          <div className="flex items-center gap-2 mb-1">
            <Skull className="w-4 h-4 text-red-400" />
            <h2 className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">Mastermind</h2>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-full gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-extrabold text-slate-100 break-words leading-tight">
                    <button onClick={() => openGroupModal(setup.mastermind.name, expansionMap.get(setup.mastermind.expansion) || setup.mastermind.expansion, setup.mastermind.cards)} className="hover:text-indigo-400 hover:underline text-left transition-colors cursor-pointer">
                      {setup.mastermind.name}
                    </button>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-red-950/80 text-red-400 border border-red-800/50">
                    {setup.mastermind.attack} Attack
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                    {setup.mastermind.victoryPoints} VP
                  </span>
                </div>

                {/* Keywords in description */}
                {(mmKeywords.length > 0 || setup.mastermind.alwaysLeads) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {mmKeywords.map((kw) => (
                      <KeywordBadge key={kw} keyword={kw} />
                    ))}
                    {setup.mastermind.alwaysLeads && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-950/40 text-amber-300 border border-amber-700/40 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Always Leads: {setup.mastermind.alwaysLeads}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Mastermind Controls */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {expansionMap.get(setup.mastermind.expansion) || setup.mastermind.expansion}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRerollSingle('mastermind')}
                    disabled={isMastermindLocked}
                    className={`p-2.5 sm:p-2 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation ${
                      isMastermindLocked
                        ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-600'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                    title="Reroll Mastermind"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenCardPicker('mastermind', setup.mastermind.id)}
                    className="p-2.5 sm:p-2 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all active:scale-95 touch-manipulation"
                    title="Swap Mastermind manually"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onToggleLock('mastermind')}
                    className={`p-2.5 sm:p-2 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation ${
                      isMastermindLocked
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                    title={isMastermindLocked ? 'Unlock Mastermind' : 'Lock Mastermind'}
                  >
                    {isMastermindLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: SCHEME */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between gap-3 h-full">
          <div className="flex items-center gap-2 mb-1">
            <Scroll className="w-4 h-4 text-amber-400" />
            <h2 className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">Scheme</h2>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-full gap-4">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-extrabold text-slate-100 break-words leading-tight">
                    <button
                      onClick={() => openGroupModal(setup.scheme.name, expansionMap.get(setup.scheme.expansion) || setup.scheme.expansion, setup.scheme.cards)}
                      className="hover:text-amber-400 hover:underline text-left transition-colors cursor-pointer"
                    >
                      {setup.scheme.name}
                    </button>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-950/80 text-amber-400 border border-amber-800/50">
                    {setup.scheme.twists} Twists
                  </span>
                  <DifficultyBadge difficulty={setup.scheme.difficulty} />
                  {setup.scheme.cards && setup.scheme.cards.length > 1 && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-purple-950/80 text-purple-300 border border-purple-800/50">
                      {setup.scheme.cards.length}-Sided
                    </span>
                  )}
                </div>
                
                {setup.scheme.setupRule && (
                  <div className="text-xs sm:text-sm bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    <RichRulesText text={setup.scheme.setupRule} />
                  </div>
                )}

                {setup.scheme.evilWins && (
                  <div className="text-xs bg-red-950/20 p-2.5 rounded-lg border border-red-900/30">
                    <RichRulesText text={setup.scheme.evilWins} />
                  </div>
                )}

                {/* Keywords in description */}
                {schemeKeywords.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {schemeKeywords.map((kw) => (
                      <KeywordBadge key={kw} keyword={kw} />
                    ))}
                  </div>
                )}
              </div>

              {/* Scheme Controls */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {expansionMap.get(setup.scheme.expansion) || setup.scheme.expansion}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRerollSingle('scheme')}
                    disabled={isSchemeLocked}
                    className={`p-2.5 sm:p-2 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation ${
                      isSchemeLocked
                        ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-600'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                    title="Reroll Scheme"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenCardPicker('scheme', setup.scheme.id)}
                    className="p-2.5 sm:p-2 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all active:scale-95 touch-manipulation"
                    title="Swap Scheme manually"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onToggleLock('scheme')}
                    className={`p-2.5 sm:p-2 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation ${
                      isSchemeLocked
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                    title={isSchemeLocked ? 'Unlock Scheme' : 'Lock Scheme'}
                  >
                    {isSchemeLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: VILLAINS & HENCHMEN */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col gap-3 mt-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-rose-400" />
            <h2 className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">Villains & Henchmen</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onToggleLock('villain')} className="text-xs font-bold px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Lock Villains</span></button>
            <button onClick={() => onToggleLock('henchman')} className="text-xs font-bold px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Lock Henchmen</span></button>
          </div>
        </div>
        <div className="space-y-4">
            {/* Unified Grid with both Villains and Henchmen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
              {/* Villain Groups */}
              {setup.villains.map((villain, idx) => {
                const isVillainLocked = !setup.lockedSlots.villains?.[idx];
                const isAlwaysLed = isVillainLedByMastermind(villain, idx, setup.mastermind, setup.villains);
                const keywords = getCardKeywords(villain);

                return (
                  <div
                    key={villain.id + idx}
                    className={`bg-slate-950/90 border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                      isAlwaysLed
                        ? 'border-amber-500/50 bg-amber-950/10 shadow-sm'
                        : 'border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950/80 text-red-400 border border-red-800/40">
                            Villain Group
                          </span>
                          {isAlwaysLed && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Led by MM
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onRerollSingle('villain', idx)}
                            disabled={isVillainLocked}
                            className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg transition-colors active:scale-95 touch-manipulation ${
                              isVillainLocked
                                ? 'opacity-30 cursor-not-allowed text-slate-600'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                            title="Reroll Villain group"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenCardPicker('villain', villain.id, idx)}
                            className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors active:scale-95 touch-manipulation"
                            title="Swap Villain group"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleLock('villain', idx)}
                            className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg transition-colors active:scale-95 touch-manipulation ${
                              isVillainLocked
                                ? 'text-amber-400 bg-amber-500/20'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                            title={isVillainLocked ? 'Unlock' : 'Lock'}
                          >
                            {isVillainLocked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Name condensed */}
                      <h4 className="font-extrabold text-slate-100 text-base mb-1.5 group-hover:text-amber-400 transition-colors break-words leading-tight">
                        <button onClick={() => openGroupModal(villain.name, expansionMap.get(villain.expansion) || villain.expansion, villain.cards)} className="hover:text-indigo-400 hover:underline text-left transition-colors cursor-pointer">
                          {villain.name}
                        </button>
                      </h4>

                      {/* Keywords in description */}
                      {keywords.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-2">
                          {keywords.map((kw) => (
                            <KeywordBadge key={kw} keyword={kw} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                      <span>{expansionMap.get(villain.expansion) || villain.expansion}</span>
                      <span>8 cards</span>
                    </div>
                  </div>
                );
              })}

              {/* Henchman Groups */}
              {setup.henchmen.map((hench, idx) => {
                const isHenchLocked = !setup.lockedSlots.henchmen?.[idx];
                const isAlwaysLed = isHenchmanLedByMastermind(hench, idx, setup.mastermind, setup.henchmen);
                const keywords = getCardKeywords(hench);

                return (
                  <div
                    key={hench.id + idx}
                    className={`bg-slate-950/90 border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                      isAlwaysLed
                        ? 'border-amber-500/50 bg-amber-950/10 shadow-sm'
                        : 'border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/80 text-amber-400 border border-amber-800/40">
                            Henchman Group
                          </span>
                          {isAlwaysLed && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Led by MM
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onRerollSingle('henchman', idx)}
                            disabled={isHenchLocked}
                            className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg transition-colors active:scale-95 touch-manipulation ${
                              isHenchLocked
                                ? 'opacity-30 cursor-not-allowed text-slate-600'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                            title="Reroll Henchman"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenCardPicker('henchman', hench.id, idx)}
                            className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors active:scale-95 touch-manipulation"
                            title="Swap Henchman"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleLock('henchman', idx)}
                            className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg transition-colors active:scale-95 touch-manipulation ${
                              isHenchLocked
                                ? 'text-amber-400 bg-amber-500/20'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                            title={isHenchLocked ? 'Unlock' : 'Lock'}
                          >
                            {isHenchLocked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Name condensed */}
                      <h4 className="font-extrabold text-slate-100 text-base mb-1.5 group-hover:text-amber-400 transition-colors break-words leading-tight">
                        <button onClick={() => openGroupModal(hench.name, expansionMap.get(hench.expansion) || hench.expansion, hench.cards)} className="hover:text-indigo-400 hover:underline text-left transition-colors cursor-pointer">
                          {hench.name}
                        </button>
                      </h4>

                      {/* Keywords in description */}
                      {keywords.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-2">
                          {keywords.map((kw) => (
                            <KeywordBadge key={kw} keyword={kw} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                      <span>{expansionMap.get(hench.expansion) || hench.expansion}</span>
                      <span className={setup.playerCount === 1 ? 'font-semibold text-amber-400' : ''}>
                        {setup.playerCount === 1 ? '2 in deck (+ 2 in city, 6 to box)' : '10 cards'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
      </div>

      {/* SECTION 3: HEROES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col gap-3 mt-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <h2 className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">Heroes</h2>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-800/40">{setup.heroes.length} Heroes</span>
          </div>
          <button onClick={() => onToggleLock('hero')} className="text-xs font-bold px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Lock All</span></button>
        </div>
        <div className="">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
              {setup.heroes.map((hero, idx) => {
                const isHeroLocked = !setup.lockedSlots.heroes?.[idx];
                const keywords = getCardKeywords(hero);

                return (
                  <div
                    key={hero.id + idx}
                    className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <TeamBadge team={hero.team} />

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onRerollSingle('hero', idx)}
                            disabled={isHeroLocked}
                            className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg transition-colors active:scale-95 touch-manipulation ${
                              isHeroLocked
                                ? 'opacity-30 cursor-not-allowed text-slate-600'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                            title="Reroll Hero"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenCardPicker('hero', hero.id, idx)}
                            className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors active:scale-95 touch-manipulation"
                            title="Swap Hero"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleLock('hero', idx)}
                            className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg transition-colors active:scale-95 touch-manipulation ${
                              isHeroLocked
                                ? 'text-amber-400 bg-amber-500/20'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                            title={isHeroLocked ? 'Unlock Hero' : 'Lock Hero'}
                          >
                            {isHeroLocked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Hero Name condensed */}
                      <h4 className="font-extrabold text-slate-100 text-base group-hover:text-amber-400 transition-colors break-words leading-tight">
                        <button onClick={() => openGroupModal(hero.name, expansionMap.get(hero.expansion) || hero.expansion, hero.cards)} className="hover:text-indigo-400 hover:underline text-left transition-colors cursor-pointer">
                          {hero.name}
                        </button>
                      </h4>
                      {hero.realName && (
                        <p className="text-[11px] text-slate-400 italic mb-2">
                          {hero.realName}
                        </p>
                      )}

                      {/* Classes */}
                      <div className="flex items-center gap-1 flex-wrap my-2">
                        {hero.classes.map((cls) => (
                          <ClassBadge key={cls} heroClass={cls} showLabel />
                        ))}
                      </div>

                      {/* Keywords in description */}
                      {keywords.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                          {keywords.map((kw) => (
                            <KeywordBadge key={kw} keyword={kw} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                      <span>{expansionMap.get(hero.expansion) || hero.expansion}</span>
                      <span>14 cards</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-2.5 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 z-30 sm:hidden flex items-center justify-center gap-2 shadow-2xl safe-area-inset-bottom max-w-full box-border">
        <button
          onClick={onRandomizeAll}
          className="w-full max-w-md min-h-[44px] px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 touch-manipulation flex items-center justify-center gap-1.5"
        >
          <Dices className="w-4 h-4" />
          <span>Randomize Setup</span>
        </button>
      </div>
    </div>
  );
};
