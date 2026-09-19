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
  ChevronDown,
  ChevronUp,
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

export function getSchemeEvilWins(scheme: any): string {
  if (!scheme) return '';
  const rawEvil = scheme.evilWins || scheme.evil_wins || scheme.EvilWins || '';
  if (rawEvil && rawEvil.trim()) {
    return rawEvil.trim();
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
    return `When Twist ${twistNum} is drawn${extraCond}.`;
  }

  // Check for "Evil Wins: ..." anywhere in text
  const evilMatch = allText.match(/Evil Wins:?\s*([^\n\r]+)/i);
  if (evilMatch) {
    return evilMatch[0].trim();
  }

  // Check for "players lose" condition
  const loseMatch = allText.match(/([^\n\r.]*players lose[^\n\r.]*\.)/i);
  if (loseMatch) {
    return loseMatch[0].trim();
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
  onToggleLockAll,
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
        className="flex items-center gap-2.5 px-5 py-3.5 sm:px-6 sm:py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl shadow-amber-500/50 border-2 border-amber-300 active:scale-95 hover:scale-105 transition-all cursor-pointer group"
        title="Randomize Setup"
      >
        <Dices className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:rotate-45" />
        <span className="font-extrabold tracking-wide">Randomize</span>
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
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
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
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Dices className="w-4 h-4" />
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
                <Users className="w-4 h-4 text-amber-400" />
                <span>Players:</span>
              </div>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => onPlayerCountChange(count)}
                    className={`px-3.5 py-1.5 min-h-[38px] min-w-[36px] rounded-lg text-xs font-extrabold transition-all active:scale-95 touch-manipulation cursor-pointer ${
                      playerCount === count
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black scale-105'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {count}P
                  </button>
                ))}
              </div>

              {/* Rules Icon Button */}
              <button
                onClick={onOpenRulesModal}
                className="p-2.5 min-h-[38px] min-w-[38px] rounded-xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 text-purple-200 border border-purple-700/60 shadow-md active:scale-95 transition-all flex items-center justify-center touch-manipulation cursor-pointer"
                title="View Rules & Keywords Reference"
              >
                <Scroll className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto shadow-2xl">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5 text-amber-400 shadow-inner">
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

  const isAllLocked =
    isMastermindLocked &&
    isSchemeLocked &&
    allHeroesLocked &&
    allVillainsLocked &&
    allHenchLocked;

  const mmKeywords = getCardKeywords(setup.mastermind);
  const schemeKeywords = getCardKeywords(setup.scheme);
  const safeBystanders = setup.bystandersCount ?? (setup.playerCount === 1 ? 1 : setup.playerCount <= 3 ? 2 : setup.playerCount === 4 ? 8 : 12);
  const schemeEvilWins = getSchemeEvilWins(setup.scheme);

  const hasExtraSchemeDetails = Boolean(
    setup.scheme.setupRule ||
    setup.scheme.specialRules ||
    setup.scheme.twistEffect ||
    schemeKeywords.length > 0
  );

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
              <Users className="w-4 h-4 text-amber-400" />
              <span>Players:</span>
            </div>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => onPlayerCountChange(count)}
                  className={`px-3 py-1.5 min-h-[36px] min-w-[34px] rounded-lg text-xs font-extrabold transition-all active:scale-95 touch-manipulation cursor-pointer ${
                    setup.playerCount === count
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black scale-105'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {count}P
                </button>
              ))}
            </div>

            {/* Action Icon Buttons next to player count */}
            <div className="flex items-center gap-2">
              {/* Lock/Unlock All Icon Button (Cohesive Cyan/Teal Spectrum: Deep Cyan Base when Unlocked, Radiant Cyan Gradient when Locked) */}
              {onToggleLockAll && (
                <button
                  onClick={onToggleLockAll}
                  className={`p-2 min-h-[38px] min-w-[38px] rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center touch-manipulation cursor-pointer border ${
                    isAllLocked
                      ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black border-cyan-200 shadow-cyan-500/40 ring-1 ring-cyan-300/50'
                      : 'bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 hover:text-cyan-100 border-cyan-800/80'
                  }`}
                  title={isAllLocked ? 'Unlock all cards in setup' : 'Lock all cards in setup'}
                >
                  {isAllLocked ? <Unlock className="w-4 h-4 shrink-0 stroke-[2.5]" /> : <Lock className="w-4 h-4 shrink-0" />}
                </button>
              )}

              {/* Rules Icon Button (Darker Purple Gradient) */}
              <button
                onClick={onOpenRulesModal}
                className="p-2 min-h-[38px] min-w-[38px] rounded-xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 text-purple-200 border border-purple-700/60 shadow-md active:scale-95 transition-all flex items-center justify-center touch-manipulation cursor-pointer"
                title="View Rules & Keywords Reference"
              >
                <Scroll className="w-4 h-4 shrink-0" />
              </button>

              {/* Save Icon Button (Blue Gradient) */}
              <button
                onClick={() => onSaveSetup(setup)}
                className={`p-2 min-h-[38px] min-w-[38px] rounded-xl text-xs flex items-center justify-center transition-all border touch-manipulation active:scale-95 cursor-pointer shadow-md ${
                  isSaved
                    ? 'bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-blue-100 border-blue-400 shadow-blue-950/50'
                    : 'bg-gradient-to-r from-blue-950 via-blue-900 to-cyan-950 hover:from-blue-900 hover:to-cyan-900 text-blue-200 hover:text-blue-100 border-blue-700/60'
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
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-400 font-normal">Villain Deck:</span>
              <span className="text-amber-300 font-bold">
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
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded text-xs font-black bg-rose-950 text-rose-400 border border-rose-800/50">
                VP {setup.mastermind.victoryPoints ?? setup.mastermind.vp ?? 5}
              </div>
              <div className="px-2.5 py-0.5 rounded text-xs font-black bg-slate-950 text-amber-400 border border-amber-500/40">
                ATK {setup.mastermind.attack || setup.mastermind.victoryPoints || setup.mastermind.vp || 0}
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-full gap-4">
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-100 break-words leading-tight">
                  <button onClick={() => openGroupModal(setup.mastermind.name, expansionMap.get(setup.mastermind.expansion) || setup.mastermind.expansion, setup.mastermind.cards)} className="hover:text-indigo-400 hover:underline text-left transition-colors cursor-pointer">
                    {setup.mastermind.name}
                  </button>
                </h3>

                <div className="text-xs text-slate-400">
                  {expansionMap.get(setup.mastermind.expansion) || setup.mastermind.expansion}
                </div>

                {setup.mastermind.alwaysLeads && (
                  <div className="text-xs text-amber-400 font-semibold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <span className="text-slate-400 font-normal">Always Leads: </span>
                    {setup.mastermind.alwaysLeads}
                  </div>
                )}

                {setup.mastermind.masterStrikeText && (
                  <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-bold text-rose-400 block mb-0.5 uppercase text-[10px] tracking-wider">Master Strike:</span>
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

              {/* Mastermind Controls: Footer with 3 icon buttons together */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500">
                  {expansionMap.get(setup.mastermind.expansion) || setup.mastermind.expansion}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onRerollSingle('mastermind')}
                    disabled={isMastermindLocked}
                    className={`p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation ${
                      isMastermindLocked
                        ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-600'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 cursor-pointer'
                    }`}
                    title={isMastermindLocked ? 'Mastermind is locked' : 'Re-roll Mastermind'}
                  >
                    <RefreshCw className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    onClick={() => onOpenCardPicker('mastermind', setup.mastermind.id)}
                    className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all active:scale-95 touch-manipulation cursor-pointer"
                    title="Swap Mastermind manually"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    onClick={() => onToggleLock('mastermind')}
                    className={`p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation cursor-pointer ${
                      isMastermindLocked
                        ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black border-cyan-200 shadow-sm'
                        : 'bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border-cyan-800/70'
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between gap-3 h-full">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Scroll className="w-4 h-4 text-amber-400" />
              <h2 className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">Scheme</h2>
            </div>
            <div className="flex items-center gap-2">
              {hasExtraSchemeDetails && (
                <button
                  onClick={() => setIsSchemeExpanded(!isSchemeExpanded)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer"
                  title={isSchemeExpanded ? 'Collapse rules' : 'Expand full rules & twists'}
                >
                  <span>{isSchemeExpanded ? 'Less' : 'More'}</span>
                  {isSchemeExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
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

                {/* Evil Wins - Always Shown (Default & Expanded) */}
                {schemeEvilWins && (
                  <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <RichRulesText text={schemeEvilWins} />
                  </div>
                )}

                {/* Collapsible Details: Setup Rule, Special Rules, Twist Effect, Keywords */}
                {isSchemeExpanded && (
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

                    {setup.scheme.twistEffect && (
                      <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        <RichRulesText text={setup.scheme.twistEffect} />
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
                )}
              </div>

              {/* Scheme Controls: Footer with 3 icon buttons together */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500">
                  {expansionMap.get(setup.scheme.expansion) || setup.scheme.expansion}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onRerollSingle('scheme')}
                    disabled={isSchemeLocked}
                    className={`p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation ${
                      isSchemeLocked
                        ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-600'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 cursor-pointer'
                    }`}
                    title={isSchemeLocked ? 'Scheme is locked' : 'Re-roll Scheme'}
                  >
                    <RefreshCw className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    onClick={() => onOpenCardPicker('scheme', setup.scheme.id)}
                    className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all active:scale-95 touch-manipulation cursor-pointer"
                    title="Swap Scheme manually"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    onClick={() => onToggleLock('scheme')}
                    className={`p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl border transition-all active:scale-95 touch-manipulation cursor-pointer ${
                      isSchemeLocked
                        ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black border-cyan-200 shadow-sm'
                        : 'bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border-cyan-800/70'
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
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                allVillainsAndHenchLocked
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-bold border-cyan-200 shadow-sm'
                  : 'bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 hover:text-cyan-100 border-cyan-800/70'
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
                    ? 'border-2 border-amber-500/70 bg-amber-950/10 shadow-md shadow-amber-500/5'
                    : 'border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950/80 text-red-400 border border-red-800/40">
                        Villain Group
                      </span>
                      {isLed && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Led by MM
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

                {/* Villain Controls: Footer with 3 icon buttons */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">8 cards</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRerollSingle('villain', idx)}
                      disabled={isLocked}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isLocked
                          ? 'text-slate-600 opacity-40 cursor-not-allowed'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer'
                      }`}
                      title={isLocked ? 'Villain is locked' : 'Re-roll Villain'}
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      onClick={() => onOpenCardPicker('villain', villain.id, idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Pick Villain manually"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      onClick={() => onToggleLock('villain', idx)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLocked
                          ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black border border-cyan-200 shadow-sm'
                          : 'text-cyan-400/80 hover:text-cyan-200 hover:bg-cyan-950/40'
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
                    ? 'border-2 border-amber-500/70 bg-amber-950/10 shadow-md shadow-amber-500/5'
                    : 'border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/80 text-amber-400 border border-amber-800/40">
                        Henchman Group
                      </span>
                      {isLed && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Led by MM
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

                {/* Henchman Controls: Footer with 3 icon buttons */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs flex items-center justify-between">
                  <span className={`text-[10px] text-slate-500 ${setup.playerCount === 1 ? 'font-semibold text-amber-400' : ''}`}>
                    {setup.playerCount === 1 ? '2 in deck, 2 in City' : '10 cards'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRerollSingle('henchman', idx)}
                      disabled={isLocked}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isLocked
                          ? 'text-slate-600 opacity-40 cursor-not-allowed'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer'
                      }`}
                      title={isLocked ? 'Henchman is locked' : 'Re-roll Henchman'}
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      onClick={() => onOpenCardPicker('henchman', hench.id, idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Pick Henchman manually"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      onClick={() => onToggleLock('henchman', idx)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLocked
                          ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black border border-cyan-200 shadow-sm'
                          : 'text-cyan-400/80 hover:text-cyan-200 hover:bg-cyan-950/40'
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
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              allHeroesLocked
                ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-bold border-cyan-200 shadow-sm'
                : 'bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 hover:text-cyan-100 border-cyan-800/70'
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

                  <h4 className="text-base font-bold text-slate-100 break-words leading-tight group-hover:text-amber-400 transition-colors">
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
                  <span className="text-[10px] text-slate-500">14 cards</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRerollSingle('hero', idx)}
                      disabled={isLocked}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isLocked
                          ? 'text-slate-600 opacity-40 cursor-not-allowed'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer'
                      }`}
                      title={isLocked ? 'Hero is locked' : 'Re-roll Hero'}
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      onClick={() => onOpenCardPicker('hero', hero.id, idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Pick Hero manually"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      onClick={() => onToggleLock('hero', idx)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLocked
                          ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black border border-cyan-200 shadow-sm'
                          : 'text-cyan-400/80 hover:text-cyan-200 hover:bg-cyan-950/40'
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
