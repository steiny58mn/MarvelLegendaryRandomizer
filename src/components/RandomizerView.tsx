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
  Sparkles,
  Users,
  Trophy,
  Skull,
  Scroll,
  Trash2,
  Layers,
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
  onToggleLockAll?: () => void;
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
      card.specialRules || '',
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

        const regex = new RegExp(`\\b${kw.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (regex.test(textToSearch)) {
          found.add(kw.name);
          continue;
        }

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
    
  return list.filter((kw: string) => !getKeywordRule(kw).includes('thematic tag'));
}

export const RandomizerView: React.FC<RandomizerViewProps> = ({
  setup,
  playerCount,
  onPlayerCountChange,
  onRandomizeAll,
  onToggleLock,
  onToggleLockAll,
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
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 touch-manipulation transition-all cursor-pointer"
              >
                <Scroll className="w-4 h-4" />
                <span className="hidden sm:inline">Rules</span>
              </button>
              <button
                onClick={onRandomizeAll}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 touch-manipulation transition-all cursor-pointer"
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
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 touch-manipulation cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Random Game</span>
          </button>
        </div>

        {/* Fixed Mobile Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-2.5 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 z-30 sm:hidden flex items-center justify-center gap-2 shadow-2xl safe-area-inset-bottom max-w-full box-border">
          <button
            onClick={onRandomizeAll}
            className="w-full max-w-md min-h-[44px] px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 touch-manipulation flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Dices className="w-4 h-4" />
            <span>Randomize Setup</span>
          </button>
        </div>
      </div>
    );
  }

  const isMastermindLocked = Boolean(setup.lockedSlots?.mastermind);
  const isSchemeLocked = Boolean(setup.lockedSlots?.scheme);

  const isAllLocked =
    Boolean(setup.lockedSlots?.mastermind) &&
    Boolean(setup.lockedSlots?.scheme) &&
    setup.heroes.length > 0 &&
    setup.heroes.every((_, i) => Boolean(setup.lockedSlots?.heroes?.[i])) &&
    setup.villains.length > 0 &&
    setup.villains.every((_, i) => Boolean(setup.lockedSlots?.villains?.[i])) &&
    setup.henchmen.length > 0 &&
    setup.henchmen.every((_, i) => Boolean(setup.lockedSlots?.henchmen?.[i]));

  const allVillainsLocked =
    setup.villains.length > 0 &&
    setup.villains.every((_, i) => Boolean(setup.lockedSlots?.villains?.[i]));

  const allHenchLocked =
    setup.henchmen.length > 0 &&
    setup.henchmen.every((_, i) => Boolean(setup.lockedSlots?.henchmen?.[i]));

  const allHeroesLocked =
    setup.heroes.length > 0 &&
    setup.heroes.every((_, i) => Boolean(setup.lockedSlots?.heroes?.[i]));

  const openGroupModal = (title: string, subtitle: string, cards?: any[]) => {
    const safeCards = cards || [];
    window.dispatchEvent(new CustomEvent('open-card-group-modal', { detail: { title, subtitle, cards: safeCards } }));
  };

  const mmKeywords = getCardKeywords(setup.mastermind);
  const schemeKeywords = getCardKeywords(setup.scheme);

  const safeBystanders = setup.bystandersCount ?? setup.deckBreakdown?.bystanders ?? (setup.playerCount === 1 ? 1 : setup.playerCount <= 3 ? 2 : setup.playerCount === 4 ? 8 : 12);

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

          {/* Right: Actions (Randomize Setup and Lock All share Row 1 neatly on mobile) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={onRandomizeAll}
              className="px-3.5 py-2.5 min-h-[42px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 touch-manipulation cursor-pointer"
            >
              <Dices className="w-4 h-4 shrink-0" />
              <span className="truncate">Randomize</span>
            </button>

            {onToggleLockAll && (
              <button
                onClick={onToggleLockAll}
                className={`px-3.5 py-2.5 min-h-[42px] rounded-xl font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 touch-manipulation border cursor-pointer ${
                  isAllLocked
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title={isAllLocked ? 'Unlock all slots' : 'Lock all slots'}
              >
                {isAllLocked ? <Lock className="w-3.5 h-3.5 shrink-0" /> : <Unlock className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{isAllLocked ? 'Unlock All' : 'Lock All'}</span>
              </button>
            )}

            <button
              onClick={() => onStartScoring(setup)}
              className="px-3.5 py-2.5 min-h-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 touch-manipulation cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Track Score</span>
            </button>
            
            <button
              onClick={onOpenRulesModal}
              className="px-3.5 py-2.5 min-h-[42px] rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 touch-manipulation cursor-pointer"
            >
              <Scroll className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Rules</span>
            </button>

            <div className="col-span-2 sm:col-span-1 flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => onSaveSetup(setup)}
                className={`flex-1 sm:flex-initial px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border touch-manipulation active:scale-95 cursor-pointer ${
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
                  className="flex-1 sm:flex-initial p-2.5 min-h-[42px] min-w-[42px] rounded-xl bg-slate-800/60 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 border border-slate-700/80 text-xs flex items-center justify-center transition-colors touch-manipulation active:scale-95 ml-auto cursor-pointer"
                  title="Clear current setup"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Deck Composition & Setup Summary Strip */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-400 font-normal">Villain Deck:</span>
              <span className="text-amber-300 font-bold">{setup.deckBreakdown?.villainDeckTotal || (setup.villains.length * 8 + (setup.playerCount === 1 ? 2 : setup.henchmen.length * 10) + safeBystanders + setup.masterStrikesCount + setup.twistsCount)} Cards</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-400">
              <span>{setup.villains.length} Villains ({setup.villains.length * 8} cards)</span>
              <span>•</span>
              <span className={setup.playerCount === 1 ? 'text-amber-400 font-semibold' : ''}>
                {setup.playerCount === 1 ? '1 Henchman (2 in deck, 2 in City)' : `${setup.henchmen.length} Henchmen (${setup.henchmen.length * 10} cards)`}
              </span>
              <span>•</span>
              <span className="text-slate-200 font-semibold">{safeBystanders} {safeBystanders === 1 ? 'Bystander' : 'Bystanders'}</span>
              <span>•</span>
              <span>{setup.masterStrikesCount} Strikes</span>
              <span>•</span>
              <span>{setup.twistsCount} Twists</span>
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
                  {setup.mastermind.victoryPoints !== undefined && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-500/30">
                      {setup.mastermind.victoryPoints} VP
                    </span>
                  )}
                  {setup.mastermind.attack !== undefined && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-950/80 text-red-400 border border-red-500/30">
                      {setup.mastermind.attack} ATK
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">
                    {expansionMap.get(setup.mastermind.expansion) || setup.mastermind.expansion}
                  </span>
                  {setup.mastermind.alwaysLeads && (
                    <span className="text-xs text-amber-400/90 font-medium">
                      Always Leads: {setup.mastermind.alwaysLeads}
                    </span>
                  )}
                </div>

                {setup.mastermind.masterStrikeText && (
                  <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-bold text-red-400 block mb-1">Master Strike:</span>
                    <RichRulesText text={setup.mastermind.masterStrikeText} />
                  </div>
                )}

                {mmKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {mmKeywords.map((kw) => (
                      <KeywordBadge key={kw} keyword={kw} />
                    ))}
                  </div>
                )}
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => onToggleLock('mastermind')}
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isMastermindLocked
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {isMastermindLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{isMastermindLocked ? 'Locked' : 'Lock'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onRerollSingle('mastermind')}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Re-roll Mastermind"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenCardPicker('mastermind', setup.mastermind.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Pick Mastermind"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: SCHEME */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between gap-3 h-full">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Scroll className="w-4 h-4 text-amber-400" />
              <h2 className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">Scheme</h2>
            </div>
            {setup.scheme.difficulty && (
              <DifficultyBadge difficulty={setup.scheme.difficulty} />
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-full gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-extrabold text-slate-100 break-words leading-tight">
                    <button onClick={() => openGroupModal(setup.scheme.name, expansionMap.get(setup.scheme.expansion) || setup.scheme.expansion, setup.scheme.cards)} className="hover:text-indigo-400 hover:underline text-left transition-colors cursor-pointer">
                      {setup.scheme.name}
                    </button>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-950/80 text-purple-400 border border-purple-500/30">
                    {setup.twistsCount} Twists
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  {expansionMap.get(setup.scheme.expansion) || setup.scheme.expansion}
                </div>

                {setup.scheme.setupRule && (
                  <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-bold text-amber-400 block mb-0.5">Setup:</span>
                    <RichRulesText text={setup.scheme.setupRule} />
                  </div>
                )}

                {setup.scheme.specialRules && (
                  <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-bold text-cyan-400 block mb-0.5">Special Rules:</span>
                    <RichRulesText text={setup.scheme.specialRules} />
                  </div>
                )}

                {setup.scheme.twistEffect && (
                  <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-bold text-purple-400 block mb-0.5">Twist:</span>
                    <RichRulesText text={setup.scheme.twistEffect} />
                  </div>
                )}

                {setup.scheme.evilWins && (
                  <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-bold text-rose-400 block mb-0.5">Evil Wins:</span>
                    <RichRulesText text={setup.scheme.evilWins} />
                  </div>
                )}

                {schemeKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {schemeKeywords.map((kw) => (
                      <KeywordBadge key={kw} keyword={kw} />
                    ))}
                  </div>
                )}
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => onToggleLock('scheme')}
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isSchemeLocked
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {isSchemeLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{isSchemeLocked ? 'Locked' : 'Lock'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onRerollSingle('scheme')}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Re-roll Scheme"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenCardPicker('scheme', setup.scheme.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Pick Scheme"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: VILLAINS & HENCHMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Villains */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Skull className="w-4 h-4 text-red-400" />
              <h2 className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">
                Villain Groups ({setup.villains.length})
              </h2>
            </div>
            <button
              onClick={() => onToggleLock('villain')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                allVillainsLocked
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={allVillainsLocked ? 'Unlock all villains' : 'Lock all villains'}
            >
              {allVillainsLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{allVillainsLocked ? 'Unlock' : 'Lock All'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {setup.villains.map((villain, idx) => {
              const isLocked = Boolean(setup.lockedSlots?.villains?.[idx]);
              const isLed = isVillainLedByMastermind(villain, idx, setup.mastermind, setup.villains);
              const kwList = getCardKeywords(villain);

              return (
                <div
                  key={villain.id || idx}
                  className={`bg-slate-950/80 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 transition-all ${
                    isLed
                      ? 'border-2 border-amber-500/70 bg-amber-950/10 shadow-md shadow-amber-500/5'
                      : 'border border-slate-800/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-base font-bold text-slate-100 break-words leading-tight">
                        <button onClick={() => openGroupModal(villain.name, expansionMap.get(villain.expansion) || villain.expansion, villain.cards)} className="hover:text-indigo-400 hover:underline text-left transition-colors cursor-pointer">
                          {villain.name}
                        </button>
                      </h4>
                      {isLed && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950 shrink-0">
                          Led by MM
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {expansionMap.get(villain.expansion) || villain.expansion}
                    </div>

                    {kwList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {kwList.map((kw) => (
                          <KeywordBadge key={kw} keyword={kw} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    <button
                      onClick={() => onToggleLock('villain', idx)}
                      className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                        isLocked
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{isLocked ? 'Locked' : 'Lock'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onRerollSingle('villain', idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Re-roll Villain"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenCardPicker('villain', villain.id, idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Pick Villain"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Henchmen */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Skull className="w-4 h-4 text-purple-400" />
              <h2 className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">
                Henchman Groups ({setup.henchmen.length})
              </h2>
            </div>
            <button
              onClick={() => onToggleLock('henchman')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                allHenchLocked
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={allHenchLocked ? 'Unlock all henchmen' : 'Lock all henchmen'}
            >
              {allHenchLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{allHenchLocked ? 'Unlock' : 'Lock All'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {setup.henchmen.map((hench, idx) => {
              const isLocked = Boolean(setup.lockedSlots?.henchmen?.[idx]);
              const isLed = isHenchmanLedByMastermind(hench, idx, setup.mastermind, setup.henchmen);
              const kwList = getCardKeywords(hench);

              return (
                <div
                  key={hench.id || idx}
                  className={`bg-slate-950/80 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 transition-all ${
                    isLed
                      ? 'border-2 border-amber-500/70 bg-amber-950/10 shadow-md shadow-amber-500/5'
                      : 'border border-slate-800/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-base font-bold text-slate-100 break-words leading-tight">
                        <button onClick={() => openGroupModal(hench.name, expansionMap.get(hench.expansion) || hench.expansion, hench.cards)} className="hover:text-indigo-400 hover:underline text-left transition-colors cursor-pointer">
                          {hench.name}
                        </button>
                      </h4>
                      {isLed && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950 shrink-0">
                          Led by MM
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {expansionMap.get(hench.expansion) || hench.expansion}
                    </div>

                    {kwList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {kwList.map((kw) => (
                          <KeywordBadge key={kw} keyword={kw} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    <button
                      onClick={() => onToggleLock('henchman', idx)}
                      className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                        isLocked
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{isLocked ? 'Locked' : 'Lock'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onRerollSingle('henchman', idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Re-roll Henchman"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenCardPicker('henchman', hench.id, idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Pick Henchman"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 4: HEROES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h2 className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">
              Heroes ({setup.heroes.length})
            </h2>
          </div>
          <button
            onClick={() => onToggleLock('hero')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              allHeroesLocked
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={allHeroesLocked ? 'Unlock all heroes' : 'Lock all heroes'}
          >
            {allHeroesLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{allHeroesLocked ? 'Unlock' : 'Lock All'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {setup.heroes.map((hero, idx) => {
            const isLocked = Boolean(setup.lockedSlots?.heroes?.[idx]);
            const kwList = getCardKeywords(hero);

            return (
              <div
                key={hero.id || idx}
                className="bg-slate-950/80 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 border border-slate-800/80 transition-all hover:border-slate-700"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h4 className="text-sm font-bold text-slate-100 break-words leading-tight">
                      <button onClick={() => openGroupModal(hero.name, expansionMap.get(hero.expansion) || hero.expansion, hero.cards)} className="hover:text-cyan-400 hover:underline text-left transition-colors cursor-pointer">
                        {hero.name}
                      </button>
                    </h4>
                  </div>

                  <div className="text-[11px] text-slate-400 mb-2">
                    {expansionMap.get(hero.expansion) || hero.expansion}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {hero.team && <TeamBadge team={hero.team} />}
                    {hero.classes ? hero.classes.map(cls => <ClassBadge key={cls} heroClass={cls} />) : ((hero as any).heroClass && <ClassBadge heroClass={(hero as any).heroClass} />)}
                  </div>

                  {kwList.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {kwList.slice(0, 3).map((kw) => (
                        <KeywordBadge key={kw} keyword={kw} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <button
                    onClick={() => onToggleLock('hero', idx)}
                    className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                      isLocked
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{isLocked ? 'Locked' : 'Lock'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRerollSingle('hero', idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Re-roll Hero"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenCardPicker('hero', hero.id, idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Pick Hero"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
