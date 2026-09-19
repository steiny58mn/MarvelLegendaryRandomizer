import { getKeywordRule, GAME_KEYWORDS } from '../data/keywords';
import { KeywordBadge } from "./KeywordBadge";
import { RichRulesText } from './symbols/RichRulesText';
import React, { useMemo, useEffect, useState } from 'react';
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
  Skull,
  Scroll,
  Layers,
  Swords,
  AlertCircle,
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
  onStartScoring?: (setup: ActiveSetup) => void;
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

export function filterTwistEvilWins(text?: string): string {
  if (!text) return '';
  const lines = text.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    const isTwistEvilWins = /^[-*•]?\s*Twists?\s*(?:\d+(?:-\d+)?|\d+(?:,\s*\d+)*(?:\s*and\s*\d+)?|\s*)?:?\s*Evil\s+Wins[!.]?(?:\s*\([^)]*\))?\s*$/i.test(trimmed);
    return !isTwistEvilWins;
  });
  return filtered.join('\n').trim();
}

export function getSchemeEvilWins(scheme: any): string {
  if (!scheme) return '';
  const rawEvil = scheme.evilWins || scheme.evil_wins || scheme.EvilWins || '';
  if (rawEvil && rawEvil.trim()) {
    const trimmed = rawEvil.trim();
    if (/^evil wins:?/i.test(trimmed)) {
      return trimmed;
    }
    return `Evil Wins: ${trimmed}`;
  }

  const allText = [
    scheme.twistEffect || scheme.twist_effect || '',
    scheme.specialRules || scheme.special_rules || '',
    scheme.setupRule || scheme.setup_rule || '',
    ...(Array.isArray(scheme.cards) ? scheme.cards.map((c: any) => c.rulesText || c.text || '') : [])
  ].join('\n');

  // Check for Twist X: Evil Wins!
  const twistEvilMatch = allText.match(/Twists?\s*(\d+(?:-\d+)?|\d+(?:,\s*\d+)*(?:\s*and\s*\d+)?):?[^\n\r]*?Evil [Ww]ins!?(?:\s*\(([^)]+)\))?/i);
  if (twistEvilMatch) {
    const twistNum = twistEvilMatch[1];
    const extraCond = twistEvilMatch[2] ? ` (${twistEvilMatch[2]})` : '';
    return `Evil Wins: When Twist ${twistNum} is drawn${extraCond}.`;
  }

  // Check for "Evil Wins: ..." anywhere in text
  const evilMatch = allText.match(/Evil Wins:?\s*([^\n\r]+)/i);
  if (evilMatch) {
    const matchStr = evilMatch[0].trim();
    if (/^evil wins:?/i.test(matchStr)) {
      return matchStr;
    }
    return `Evil Wins: ${matchStr}`;
  }

  // Check for "players lose" condition
  const loseMatch = allText.match(/([^\n\r.]*players lose[^\n\r.]*\.)/i);
  if (loseMatch) {
    return `Evil Wins: ${loseMatch[0].trim()}`;
  }

  // Fallback so scheme is never completely empty when collapsed
  return scheme.setupRule || scheme.twistEffect || scheme.specialRules || '';
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
  onOpenRulesModal,
  isSaved,
}) => {
  const { expansions } = useData();
  const safeExpansions = useMemo(() => expansions || [], [expansions]);
  const expansionMap = useMemo(() => new Map(safeExpansions.map((e) => [e.id, e.name])), [safeExpansions]);
  const [showRandomizeConfirm, setShowRandomizeConfirm] = useState(false);
  const [isSchemeExpanded, setIsSchemeExpanded] = useState(false);

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

  const handleRandomizeClick = () => {
    if (setup) {
      setShowRandomizeConfirm(true);
    } else {
      onRandomizeAll();
    }
  };

  const handleConfirmRandomize = () => {
    setShowRandomizeConfirm(false);
    onRandomizeAll();
  };

  // Floating Action Button overlay helper
  const renderFloatingRandomizeButton = () => (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40">
      <button
        onClick={handleRandomizeClick}
        className="flex items-center gap-2.5 px-5 py-3.5 sm:px-6 sm:py-4 rounded-full bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 hover:from-purple-900/95 hover:via-indigo-900/95 hover:to-purple-800/95 text-purple-100 hover:text-white font-black text-sm uppercase tracking-wider shadow-2xl shadow-purple-950/80 border border-purple-500/50 hover:border-purple-400/80 ring-1 ring-white/15 hover:ring-white/25 backdrop-blur-md active:scale-95 hover:scale-105 transition-all cursor-pointer group relative overflow-hidden"
        title="Randomize Setup"
      >
        <span className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <Dices className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:rotate-45 text-purple-300 group-hover:text-purple-100 drop-shadow" />
        <span className="font-extrabold tracking-wide drop-shadow-sm">Randomize</span>
      </button>
    </div>
  );

  // Confirm Prompt Modal
  const renderConfirmModal = () => {
    if (!showRandomizeConfirm) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 mt-0.5 shadow-inner">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-100 font-['Cinzel'] leading-tight">
                Randomize Setup?
              </h3>
              <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
                Are you sure you want to randomize? Any unlocked cards will be replaced with new selections.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setShowRandomizeConfirm(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRandomize}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 hover:from-purple-900 hover:via-indigo-900 hover:to-purple-800 text-purple-100 hover:text-white border border-purple-500/50 hover:border-purple-400/80 ring-1 ring-white/15 shadow-lg shadow-purple-950/60 backdrop-blur-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Dices className="w-4 h-4 text-purple-300" />
              <span>Randomize</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // If no active setup, render clean blank state
  if (!setup) {
    return (
      <div className="space-y-6 animate-fade-in pb-28 sm:pb-32">
        {/* Control Bar: Player Count & Rules */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Players:</span>
              </div>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => onPlayerCountChange(count)}
                    className={`px-3.5 py-1.5 min-h-[38px] min-w-[36px] rounded-lg text-xs font-extrabold transition-all active:scale-95 touch-manipulation cursor-pointer ${
                      playerCount === count
                        ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 text-purple-100 border border-purple-500/60 shadow-lg shadow-purple-950/60 font-black scale-105 ring-1 ring-white/15 backdrop-blur-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                    }`}
                  >
                    {count}P
                  </button>
                ))}
              </div>

              {/* Rules Icon Button */}
              <button
                onClick={onOpenRulesModal}
                className="p-2.5 min-h-[38px] min-w-[38px] rounded-xl bg-gradient-to-r from-blue-950/90 via-cyan-950/95 to-blue-900/90 hover:from-blue-900 hover:to-cyan-900 text-blue-200 hover:text-white border border-blue-500/50 hover:border-blue-400/80 shadow-md ring-1 ring-white/15 backdrop-blur-md active:scale-95 transition-all flex items-center justify-center touch-manipulation cursor-pointer"
                title="View Rules & Keywords Reference"
              >
                <Scroll className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto shadow-2xl">
          <div className="w-20 h-20 bg-purple-500/10 border border-purple-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5 text-purple-400 shadow-inner">
            <Dices className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wide font-['Cinzel'] mb-2">
            Marvel Legendary Randomizer
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-2">
            Select your player count above and tap the <strong>Randomize</strong> button in the bottom right to generate a balanced scenario with full rule enforcement and card synergies.
          </p>
        </div>

        {renderFloatingRandomizeButton()}
        {renderConfirmModal()}
      </div>
    );
  }

  const isMastermindLocked = Boolean(setup.lockedSlots?.mastermind);
  const isSchemeLocked = Boolean(setup.lockedSlots?.scheme);
  const allHeroesLocked =
    setup.heroes.length > 0 &&
    setup.heroes.every((_, i) => Boolean(setup.lockedSlots?.heroes?.[i]));
  const allVillainsLocked =
    setup.villains.length > 0 &&
    setup.villains.every((_, i) => Boolean(setup.lockedSlots?.villains?.[i]));
  const allHenchLocked =
    setup.henchmen.length > 0 &&
    setup.henchmen.every((_, i) => Boolean(setup.lockedSlots?.henchmen?.[i]));
  const allVillainsAndHenchLocked = allVillainsLocked && allHenchLocked;

  const handleToggleAllVillainsAndHenchmen = () => {
    const newLockState = !allVillainsAndHenchLocked;
    setup.villains.forEach((_, i) => {
      if (Boolean(setup.lockedSlots?.villains?.[i]) !== newLockState) {
        onToggleLock('villain', i);
      }
    });
    setup.henchmen.forEach((_, i) => {
      if (Boolean(setup.lockedSlots?.henchmen?.[i]) !== newLockState) {
        onToggleLock('henchman', i);
      }
    });
  };

  const mmKeywords = getCardKeywords(setup.mastermind);
  const schemeKeywords = getCardKeywords(setup.scheme);
  const safeBystanders = setup.bystandersCount ?? (setup.playerCount === 1 ? 1 : setup.playerCount <= 3 ? 2 : setup.playerCount === 4 ? 8 : 12);
  const schemeEvilWins = getSchemeEvilWins(setup.scheme);
  const filteredTwistEffect = filterTwistEvilWins(setup.scheme.twistEffect);

  const openGroupModal = (title: string, subtitle?: string, cards?: any[]) => {
    if (cards && cards.length > 0) {
      window.dispatchEvent(new CustomEvent('open-card-group-modal', {
        detail: { title, subtitle, cards }
      }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-28 sm:pb-32">
      {/* Control Bar: Player Count, Icon Action Buttons, Deck Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Player Count Selection & Action Icon Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Players:</span>
            </div>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => onPlayerCountChange(count)}
                  className={`px-3 py-1.5 min-h-[36px] min-w-[34px] rounded-lg text-xs font-extrabold transition-all active:scale-95 touch-manipulation cursor-pointer ${
                    setup.playerCount === count
                      ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 text-purple-100 border border-purple-500/60 shadow-lg shadow-purple-950/60 font-black scale-105 ring-1 ring-white/15 backdrop-blur-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  {count}P
                </button>
              ))}
            </div>

            {/* Action Icon Buttons next to player count */}
            <div className="flex items-center gap-2">
              {/* Rules Icon Button (Blue Gradient matching Save button) */}
              <button
                onClick={onOpenRulesModal}
                className="p-2 min-h-[38px] min-w-[38px] rounded-xl bg-gradient-to-r from-blue-950/90 via-cyan-950/95 to-blue-900/90 hover:from-blue-900 hover:to-cyan-900 text-blue-200 hover:text-white border border-blue-500/50 hover:border-blue-400/80 shadow-md ring-1 ring-white/15 backdrop-blur-md active:scale-95 transition-all flex items-center justify-center touch-manipulation cursor-pointer"
                title="View Rules & Keywords Reference"
              >
                <Scroll className="w-4 h-4 shrink-0" />
              </button>

              {/* Save Icon Button (Deep Emerald / Forest Green Gradient) */}
              <button
                onClick={() => onSaveSetup(setup)}
                className={`p-2 min-h-[38px] min-w-[38px] rounded-xl text-xs flex items-center justify-center transition-all border touch-manipulation active:scale-95 cursor-pointer shadow-md backdrop-blur-md ${
                  isSaved
                    ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white border-emerald-400 shadow-emerald-950/60 ring-1 ring-white/25 font-bold'
                    : 'bg-gradient-to-r from-emerald-950/90 via-teal-950/95 to-emerald-900/90 hover:from-emerald-900 hover:to-teal-900 text-emerald-200 hover:text-white border-emerald-500/50 hover:border-emerald-400/80 ring-1 ring-white/15'
                }`}
                title={isSaved ? 'Setup saved to favorites' : 'Save setup to favorites'}
              >
                <Bookmark className={`w-4 h-4 shrink-0 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Right: Summary Strip moved up to the right of the buttons */}
          <div className="flex flex-wrap items-center lg:justify-end gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-semibold">
              <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-slate-400 font-normal">Villain Deck:</span>
              <span className="text-purple-300 font-bold">
                {setup.deckBreakdown?.villainDeckTotal ||
                  setup.villains.length * 8 +
                    (setup.playerCount === 1 ? 2 : setup.henchmen.length * 10) +
                    safeBystanders +
                    setup.masterStrikesCount +
                    setup.twistsCount}{' '}
                Cards
              </span>
            </div>
            <span className="hidden sm:inline text-slate-600">•</span>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-400">
              <span>{setup.villains.length} Villains ({setup.villains.length * 8} cards)</span>
              <span>•</span>
              <span>
                {setup.henchmen.length} Henchmen (
                {setup.playerCount === 1 ? '2 in deck, 2 in City' : `${setup.henchmen.length * 10} cards`})
              </span>
              <span>•</span>
              <span>{safeBystanders} Bystanders</span>
              <span>•</span>
              <span>{setup.masterStrikesCount} Strikes</span>
              <span>•</span>
              <span>{setup.twistsCount} Twists</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1 & 2: MASTERMIND & SCHEME (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* SECTION 1: MASTERMIND */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between gap-3 h-full">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Skull className="w-4 h-4 text-rose-400" />
              <h2 className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">Mastermind</h2>
            </div>
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
                  {setup.mastermind.alwaysLeads && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-950/90 via-yellow-950/80 to-amber-900/90 text-amber-200 border border-amber-500/50 ring-1 ring-white/10 backdrop-blur-xs shadow-sm">
                      <span className="text-slate-400 font-normal">Always Leads: </span>
                      {setup.mastermind.alwaysLeads}
                    </span>
                  )}
                </div>

                {mmKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {mmKeywords.map((kw) => (
                      <KeywordBadge key={kw} keyword={kw} />
                    ))}
                  </div>
                )}

                {setup.mastermind.masterStrikeText && (
                  <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-bold text-rose-400 block mb-0.5 uppercase text-[10px] tracking-wider">Master Strike:</span>
                    <RichRulesText text={setup.mastermind.masterStrikeText} />
                  </div>
                )}
              </div>

              {/* Mastermind Controls: Footer with 3 icon buttons together */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500">
                  {expansionMap.get(setup.mastermind.expansion) || setup.mastermind.expansion}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onRerollSingle('mastermind')}
                    disabled={isMastermindLocked}
                    className={`p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation backdrop-blur-md ${
                      isMastermindLocked
                        ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-600'
                        : 'bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border-slate-700/70 hover:border-slate-500 text-slate-300 hover:text-white ring-1 ring-white/10 shadow-sm cursor-pointer'
                    }`}
                    title={isMastermindLocked ? 'Mastermind is locked' : 'Re-roll Mastermind'}
                  >
                    <RefreshCw className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    onClick={() => onOpenCardPicker('mastermind', setup.mastermind.id)}
                    className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border border-slate-700/70 hover:border-purple-500/60 text-slate-300 hover:text-white transition-all active:scale-95 touch-manipulation ring-1 ring-white/10 shadow-sm backdrop-blur-md cursor-pointer"
                    title="Swap Mastermind manually"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    onClick={() => onToggleLock('mastermind')}
                    className={`p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation cursor-pointer backdrop-blur-md ${
                      isMastermindLocked
                        ? 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white border-teal-400 shadow-teal-950/60 ring-1 ring-white/25 font-bold shadow-md'
                        : 'bg-gradient-to-r from-teal-950/90 via-emerald-950/90 to-teal-900/90 hover:from-teal-900 hover:to-emerald-900 text-teal-300 hover:text-teal-100 border-teal-600/50 ring-1 ring-white/10'
                    }`}
                    title={isMastermindLocked ? 'Unlock Mastermind' : 'Lock Mastermind'}
                  >
                    {isMastermindLocked ? (
                      <Lock className="w-4 h-4 shrink-0 stroke-[2.5]" />
                    ) : (
                      <Unlock className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: SCHEME */}
        <div 
          onClick={() => setIsSchemeExpanded((prev) => !prev)}
          className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between gap-3 h-full cursor-pointer group/scheme transition-all hover:border-slate-700 select-none"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Scroll className="w-4 h-4 text-amber-400" />
              <h2 className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">Scheme</h2>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {setup.scheme.difficulty && (
                <DifficultyBadge difficulty={setup.scheme.difficulty} />
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-full gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-extrabold text-slate-100 break-words leading-tight">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openGroupModal(setup.scheme.name, expansionMap.get(setup.scheme.expansion) || setup.scheme.expansion, setup.scheme.cards);
                      }} 
                      className="hover:text-indigo-400 hover:underline text-left transition-colors cursor-pointer"
                    >
                      {setup.scheme.name}
                    </button>
                  </h3>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-indigo-900/90 text-indigo-200 border border-indigo-500/50 ring-1 ring-white/10 backdrop-blur-xs shadow-sm">
                    {setup.twistsCount} Twists
                  </span>
                </div>

                {schemeKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {schemeKeywords.map((kw) => (
                      <KeywordBadge key={kw} keyword={kw} />
                    ))}
                  </div>
                )}

                {/* When Expanded: Setup Rule, Special Rules, Twist Effect, then Evil Wins at bottom */}
                {isSchemeExpanded ? (
                  <div className="space-y-2 pt-1 animate-fade-in">
                    {setup.scheme.setupRule && (
                      <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        <RichRulesText text={setup.scheme.setupRule} />
                      </div>
                    )}

                    {setup.scheme.specialRules && (
                      <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        <RichRulesText text={setup.scheme.specialRules} />
                      </div>
                    )}

                    {filteredTwistEffect && (
                      <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        <RichRulesText text={filteredTwistEffect} />
                      </div>
                    )}

                    {/* Evil Wins at bottom when expanded */}
                    {schemeEvilWins && (
                      <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        <RichRulesText text={schemeEvilWins} />
                      </div>
                    )}
                  </div>
                ) : (
                  /* When Collapsed: Evil Wins only */
                  schemeEvilWins && (
                    <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      <RichRulesText text={schemeEvilWins} />
                    </div>
                  )
                )}
              </div>

              {/* Scheme Controls: Footer with 3 icon buttons together */}
              <div 
                className="flex items-center justify-between pt-3 border-t border-slate-800/80"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] text-slate-500">
                  {expansionMap.get(setup.scheme.expansion) || setup.scheme.expansion}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onRerollSingle('scheme')}
                    disabled={isSchemeLocked}
                    className={`p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation backdrop-blur-md ${
                      isSchemeLocked
                        ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-600'
                        : 'bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border-slate-700/70 hover:border-slate-500 text-slate-300 hover:text-white ring-1 ring-white/10 shadow-sm cursor-pointer'
                    }`}
                    title={isSchemeLocked ? 'Scheme is locked' : 'Re-roll Scheme'}
                  >
                    <RefreshCw className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    onClick={() => onOpenCardPicker('scheme', setup.scheme.id)}
                    className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border border-slate-700/70 hover:border-purple-500/60 text-slate-300 hover:text-white transition-all active:scale-95 touch-manipulation ring-1 ring-white/10 shadow-sm backdrop-blur-md cursor-pointer"
                    title="Swap Scheme manually"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    onClick={() => onToggleLock('scheme')}
                    className={`p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation cursor-pointer backdrop-blur-md ${
                      isSchemeLocked
                        ? 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white border-teal-400 shadow-teal-950/60 ring-1 ring-white/25 font-bold shadow-md'
                        : 'bg-gradient-to-r from-teal-950/90 via-emerald-950/90 to-teal-900/90 hover:from-teal-900 hover:to-emerald-900 text-teal-300 hover:text-teal-100 border-teal-600/50 ring-1 ring-white/10'
                    }`}
                    title={isSchemeLocked ? 'Unlock Scheme' : 'Lock Scheme'}
                  >
                    {isSchemeLocked ? (
                      <Lock className="w-4 h-4 shrink-0 stroke-[2.5]" />
                    ) : (
                      <Unlock className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: VILLAINS & HENCHMEN (Unified Panel) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-rose-400" />
            <h2 className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">
              Villains & Henchmen
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAllVillainsAndHenchmen}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border backdrop-blur-md active:scale-95 touch-manipulation shadow-md ${
                allVillainsAndHenchLocked
                  ? 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white border-teal-400 shadow-teal-950/60 ring-1 ring-white/25 font-bold'
                  : 'bg-gradient-to-r from-teal-950/90 via-emerald-950/90 to-teal-900/90 hover:from-teal-900 hover:to-emerald-900 text-teal-300 hover:text-teal-100 border-teal-600/50 ring-1 ring-white/10'
              }`}
              title={allVillainsAndHenchLocked ? 'Unlock all villains and henchmen' : 'Lock all villains and henchmen'}
            >
              {allVillainsAndHenchLocked ? <Unlock className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" /> : <Lock className="w-3.5 h-3.5 shrink-0" />}
              <span>{allVillainsAndHenchLocked ? 'Unlock All' : 'Lock All'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
          {/* Villain Groups */}
          {setup.villains.map((villain, idx) => {
            const isLocked = Boolean(setup.lockedSlots?.villains?.[idx]);
            const isLed = isVillainLedByMastermind(villain, idx, setup.mastermind, setup.villains);
            const kwList = getCardKeywords(villain);

            return (
              <div
                key={villain.id || idx}
                className={`bg-slate-950/80 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 transition-all ${
                  isLed
                    ? 'border-2 border-purple-500/70 bg-purple-950/20 shadow-md shadow-purple-500/10'
                    : 'border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-gradient-to-r from-red-950/90 via-rose-950/80 to-red-900/90 text-red-300 border border-red-500/50 ring-1 ring-white/10 backdrop-blur-xs shadow-sm">
                        Villain Group
                      </span>
                      {isLed && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-amber-950/90 via-yellow-900/80 to-amber-900/90 text-amber-200 border border-amber-400/60 ring-1 ring-white/15 backdrop-blur-xs shadow-sm flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Led by MM
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-slate-100 break-words leading-tight">
                    <button
                      onClick={() => openGroupModal(villain.name, expansionMap.get(villain.expansion) || villain.expansion, villain.cards)}
                      className="hover:text-indigo-400 hover:underline text-left transition-colors cursor-pointer"
                    >
                      {villain.name}
                    </button>
                  </h4>

                  {kwList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {kwList.map((kw) => (
                        <KeywordBadge key={kw} keyword={kw} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Villain Controls: Footer with 3 icon buttons */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {expansionMap.get(villain.expansion) || villain.expansion}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRerollSingle('villain', idx)}
                      disabled={isLocked}
                      className={`p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation backdrop-blur-md ${
                        isLocked
                          ? 'text-slate-600 opacity-40 cursor-not-allowed bg-slate-950 border-slate-800'
                          : 'bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border-slate-700/70 hover:border-slate-500 text-slate-300 hover:text-white ring-1 ring-white/10 shadow-sm cursor-pointer'
                      }`}
                      title={isLocked ? 'Villain is locked' : 'Re-roll Villain'}
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      onClick={() => onOpenCardPicker('villain', villain.id, idx)}
                      className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border border-slate-700/70 hover:border-purple-500/60 text-slate-300 hover:text-white transition-all active:scale-95 touch-manipulation ring-1 ring-white/10 shadow-sm backdrop-blur-md cursor-pointer"
                      title="Pick Villain manually"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      onClick={() => onToggleLock('villain', idx)}
                      className={`p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation cursor-pointer backdrop-blur-md ${
                        isLocked
                          ? 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white border-teal-400 shadow-teal-950/60 ring-1 ring-white/25 font-bold shadow-md'
                          : 'bg-gradient-to-r from-teal-950/90 via-emerald-950/90 to-teal-900/90 hover:from-teal-900 hover:to-emerald-900 text-teal-300 hover:text-teal-100 border-teal-600/50 ring-1 ring-white/10'
                      }`}
                      title={isLocked ? 'Unlock Villain' : 'Lock Villain'}
                    >
                      {isLocked ? <Lock className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" /> : <Unlock className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Henchman Groups */}
          {setup.henchmen.map((hench, idx) => {
            const isLocked = Boolean(setup.lockedSlots?.henchmen?.[idx]);
            const isLed = isHenchmanLedByMastermind(hench, idx, setup.mastermind, setup.henchmen);
            const kwList = getCardKeywords(hench);

            return (
              <div
                key={hench.id || idx}
                className={`bg-slate-950/80 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 transition-all ${
                  isLed
                    ? 'border-2 border-purple-500/70 bg-purple-950/20 shadow-md shadow-purple-500/10'
                    : 'border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-gradient-to-r from-amber-950/90 via-orange-950/80 to-amber-900/90 text-amber-300 border border-amber-500/50 ring-1 ring-white/10 backdrop-blur-xs shadow-sm">
                        Henchman Group
                      </span>
                      {isLed && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-amber-950/90 via-yellow-900/80 to-amber-900/90 text-amber-200 border border-amber-400/60 ring-1 ring-white/15 backdrop-blur-xs shadow-sm flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Led by MM
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-slate-100 break-words leading-tight">
                    <button
                      onClick={() => openGroupModal(hench.name, expansionMap.get(hench.expansion) || hench.expansion, hench.cards)}
                      className="hover:text-indigo-400 hover:underline text-left transition-colors cursor-pointer"
                    >
                      {hench.name}
                    </button>
                  </h4>

                  {kwList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {kwList.map((kw) => (
                        <KeywordBadge key={kw} keyword={kw} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Henchman Controls: Footer with 3 icon buttons */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {expansionMap.get(hench.expansion) || hench.expansion}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRerollSingle('henchman', idx)}
                      disabled={isLocked}
                      className={`p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation backdrop-blur-md ${
                        isLocked
                          ? 'text-slate-600 opacity-40 cursor-not-allowed bg-slate-950 border-slate-800'
                          : 'bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border-slate-700/70 hover:border-slate-500 text-slate-300 hover:text-white ring-1 ring-white/10 shadow-sm cursor-pointer'
                      }`}
                      title={isLocked ? 'Henchman is locked' : 'Re-roll Henchman'}
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      onClick={() => onOpenCardPicker('henchman', hench.id, idx)}
                      className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border border-slate-700/70 hover:border-purple-500/60 text-slate-300 hover:text-white transition-all active:scale-95 touch-manipulation ring-1 ring-white/10 shadow-sm backdrop-blur-md cursor-pointer"
                      title="Pick Henchman manually"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      onClick={() => onToggleLock('henchman', idx)}
                      className={`p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation cursor-pointer backdrop-blur-md ${
                        isLocked
                          ? 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white border-teal-400 shadow-teal-950/60 ring-1 ring-white/25 font-bold shadow-md'
                          : 'bg-gradient-to-r from-teal-950/90 via-emerald-950/90 to-teal-900/90 hover:from-teal-900 hover:to-emerald-900 text-teal-300 hover:text-teal-100 border-teal-600/50 ring-1 ring-white/10'
                      }`}
                      title={isLocked ? 'Unlock Henchman' : 'Lock Henchman'}
                    >
                      {isLocked ? <Lock className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" /> : <Unlock className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: HEROES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h2 className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">
              Heroes ({setup.heroes.length})
            </h2>
          </div>
          <button
            onClick={() => onToggleLock('hero')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border backdrop-blur-md active:scale-95 touch-manipulation shadow-md ${
              allHeroesLocked
                ? 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white border-teal-400 shadow-teal-950/60 ring-1 ring-white/25 font-bold'
                : 'bg-gradient-to-r from-teal-950/90 via-emerald-950/90 to-teal-900/90 hover:from-teal-900 hover:to-emerald-900 text-teal-300 hover:text-teal-100 border-teal-600/50 ring-1 ring-white/10'
            }`}
            title={allHeroesLocked ? 'Unlock all heroes' : 'Lock all heroes'}
          >
            {allHeroesLocked ? <Unlock className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" /> : <Lock className="w-3.5 h-3.5 shrink-0" />}
            <span>{allHeroesLocked ? 'Unlock All' : 'Lock All'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {setup.heroes.map((hero, idx) => {
            const isLocked = Boolean(setup.lockedSlots?.heroes?.[idx]);
            const kwList = getCardKeywords(hero);

            return (
              <div
                key={hero.id || idx}
                className="bg-slate-950/80 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 border border-slate-800/80 hover:border-slate-700 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <TeamBadge team={hero.team} />
                  </div>

                  <h4 className="text-base font-bold text-slate-100 break-words leading-tight group-hover:text-purple-400 transition-colors">
                    <button
                      onClick={() => openGroupModal(hero.name, expansionMap.get(hero.expansion) || hero.expansion, hero.cards)}
                      className="hover:text-cyan-400 hover:underline text-left transition-colors cursor-pointer"
                    >
                      {hero.name}
                    </button>
                  </h4>

                  {hero.realName && (
                    <p className="text-[11px] text-slate-400 italic mb-1.5">
                      {hero.realName}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 flex-wrap my-2">
                    {hero.classes ? hero.classes.map(cls => <ClassBadge key={cls} heroClass={cls} showLabel />) : ((hero as any).heroClass && <ClassBadge heroClass={(hero as any).heroClass} showLabel />)}
                  </div>

                  {kwList.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {kwList.slice(0, 3).map((kw) => (
                        <KeywordBadge key={kw} keyword={kw} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Hero Controls: Footer with 3 icon buttons */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {expansionMap.get(hero.expansion) || hero.expansion}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRerollSingle('hero', idx)}
                      disabled={isLocked}
                      className={`p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation backdrop-blur-md ${
                        isLocked
                          ? 'text-slate-600 opacity-40 cursor-not-allowed bg-slate-950 border-slate-800'
                          : 'bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border-slate-700/70 hover:border-slate-500 text-slate-300 hover:text-white ring-1 ring-white/10 shadow-sm cursor-pointer'
                      }`}
                      title={isLocked ? 'Hero is locked' : 'Re-roll Hero'}
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      onClick={() => onOpenCardPicker('hero', hero.id, idx)}
                      className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border border-slate-700/70 hover:border-purple-500/60 text-slate-300 hover:text-white transition-all active:scale-95 touch-manipulation ring-1 ring-white/10 shadow-sm backdrop-blur-md cursor-pointer"
                      title="Pick Hero manually"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      onClick={() => onToggleLock('hero', idx)}
                      className={`p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation cursor-pointer backdrop-blur-md ${
                        isLocked
                          ? 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white border-teal-400 shadow-teal-950/60 ring-1 ring-white/25 font-bold shadow-md'
                          : 'bg-gradient-to-r from-teal-950/90 via-emerald-950/90 to-teal-900/90 hover:from-teal-900 hover:to-emerald-900 text-teal-300 hover:text-teal-100 border-teal-600/50 ring-1 ring-white/10'
                      }`}
                      title={isLocked ? 'Unlock Hero' : 'Lock Hero'}
                    >
                      {isLocked ? <Lock className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" /> : <Unlock className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Randomize Button Overlay (Bottom Right) */}
      {renderFloatingRandomizeButton()}

      {/* Confirmation Modal for Randomize */}
      {renderConfirmModal()}
    </div>
  );
};
