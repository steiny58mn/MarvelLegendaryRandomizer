import { KeywordBadge } from "./KeywordBadge";
import { RichRulesText } from './symbols/RichRulesText';
import { SymbolIcon } from './symbols/SymbolIcon';
import { useData } from '../contexts/DataContext';
import React, { useState, useMemo } from 'react';
import { CardType } from '../types';
import { TeamBadge, ClassBadge, DifficultyBadge } from './CardBadges';
import { getCardKeywords, getSchemeEvilWins } from './RandomizerView';
import {
  X,
  Search,
  Check,
  ShieldAlert,
  Swords,
  Layers,
  Skull,
} from 'lucide-react';

interface CardPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardType: CardType;
  slotIndex?: number;
  currentCardId?: string;
  currentId?: string;
  enabledExpansions?: string[];
  onSelectCard?: (type: CardType, card: any, slotIndex?: number) => void;
  onSelect?: (type: CardType, card: any, slotIndex?: number) => void;
}

export const CardPickerModal: React.FC<CardPickerModalProps> = ({
  isOpen,
  onClose,
  cardType,
  slotIndex,
  currentCardId,
  currentId,
  enabledExpansions = [],
  onSelectCard,
  onSelect,
}) => {
  const { heroes, masterminds, villains, henchmen, schemes, expansions } =
    useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpansion, setSelectedExpansion] = useState<string>('all');
  const [villainHenchmanTab, setVillainHenchmanTab] = useState<'all' | 'villain' | 'henchman'>('all');

  const safeExpansions = useMemo(() => expansions || [], [expansions]);
  const HEROES = useMemo(() => heroes || [], [heroes]);
  const MASTERMINDS = useMemo(() => masterminds || [], [masterminds]);
  const VILLAINS = useMemo(() => villains || [], [villains]);
  const HENCHMEN = useMemo(() => henchmen || [], [henchmen]);
  const SCHEMES = useMemo(() => schemes || [], [schemes]);
  const safeEnabledExpansions = useMemo(() => enabledExpansions || [], [enabledExpansions]);

  const expansionMap = useMemo(() => {
    return new Map(safeExpansions.map((e) => [e.id, e.name]));
  }, [safeExpansions]);

  const openGroupModal = (e: React.MouseEvent, title: string, subtitle?: string, cards?: any[], cardType?: string) => {
    e.stopPropagation();
    if (cards && cards.length > 0) {
      window.dispatchEvent(new CustomEvent('open-card-group-modal', {
        detail: { title, subtitle, cards, cardType }
      }));
    }
  };

  const isVillainOrHenchman = cardType === 'villain' || cardType === 'henchman';

  // Get raw pool based on type
  const rawCards = useMemo<any[]>(() => {
    switch (cardType) {
      case 'mastermind':
        return MASTERMINDS;
      case 'scheme':
        return SCHEMES;
      case 'hero':
        return HEROES;
      case 'villain':
      case 'henchman': {
        // Tag each with its kind so we can distinguish them in the unified list
        const taggedVillains = VILLAINS.map((v) => ({ ...v, _kind: 'villain' as const }));
        const taggedHenchmen = HENCHMEN.map((h) => ({ ...h, _kind: 'henchman' as const }));
        
        if (villainHenchmanTab === 'villain') return taggedVillains;
        if (villainHenchmanTab === 'henchman') return taggedHenchmen;
        return [...taggedVillains, ...taggedHenchmen];
      }
      default:
        return [];
    }
  }, [cardType, villainHenchmanTab, MASTERMINDS, SCHEMES, HEROES, VILLAINS, HENCHMEN]);

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    let result = rawCards;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((card) => {
        const nameMatch = (card.name || '').toLowerCase().includes(term);
        const expMatch = (expansionMap.get(card.expansion) || card.expansion || '')
          .toLowerCase()
          .includes(term);
        const realNameMatch =
          'realName' in card &&
          (card.realName || '').toLowerCase().includes(term);
        const alwaysLeadsMatch =
          'alwaysLeads' in card &&
          (card.alwaysLeads || '').toLowerCase().includes(term);

        return nameMatch || expMatch || realNameMatch || alwaysLeadsMatch;
      });
    }

    // Expansion filter
    if (selectedExpansion !== 'all') {
      result = result.filter((c) => c.expansion === selectedExpansion);
    }

    // Sort strictly alphabetically by card name
    return [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [rawCards, searchTerm, selectedExpansion, expansionMap]);

  if (!isOpen) return null;

  const activeCardId = currentCardId || currentId;

  const handleSelect = (type: CardType, card: any, idx?: number) => {
    // If selecting from the combined villain/henchman list, use the card's real kind
    const effectiveType = card._kind || type;
    if (onSelectCard) {
      onSelectCard(effectiveType, card, idx);
    } else if (onSelect) {
      onSelect(effectiveType, card, idx);
    }
  };

  const getTitle = () => {
    switch (cardType) {
      case 'mastermind':
        return 'Choose Mastermind';
      case 'scheme':
        return 'Choose Scheme';
      case 'hero':
        return `Choose Hero (Slot ${(slotIndex ?? 0) + 1})`;
      case 'villain':
      case 'henchman':
        return `Choose Villain or Henchman (Slot ${(slotIndex ?? 0) + 1})`;
      default:
        return 'Choose Card';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900/95 border border-purple-500/40 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10 backdrop-blur-md">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-500/30 flex items-center justify-between bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-['Cinzel'] tracking-wide">
              {getTitle()}
            </h2>
            <p className="text-xs text-purple-200/80 mt-0.5">
              Browse and select a replacement card. Sorted alphabetically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-purple-300 hover:text-white hover:bg-purple-900/60 active:scale-95 transition-all shrink-0 touch-manipulation cursor-pointer"
            aria-label="Close picker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs for Villain & Henchman Combined Group */}
        {isVillainOrHenchman && (
          <div className="px-4 py-2.5 bg-slate-950/80 border-b border-purple-500/20 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 shadow-sm relative z-10">
            <span className="text-xs font-semibold text-purple-300 mr-1 flex items-center gap-1 shrink-0">
              <Skull className="w-3.5 h-3.5 text-purple-400" />
              Type:
            </span>
            <button
              onClick={() => setVillainHenchmanTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                villainHenchmanTab === 'all'
                  ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 text-purple-100 border-purple-500/60 shadow-lg shadow-purple-950/50 ring-1 ring-white/15 backdrop-blur-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              All ({VILLAINS.length + HENCHMEN.length})
            </button>
            <button
              onClick={() => setVillainHenchmanTab('villain')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                villainHenchmanTab === 'villain'
                  ? 'bg-gradient-to-r from-red-950/90 via-zinc-950/95 to-red-900/90 text-red-100 border-red-500/60 shadow-lg shadow-red-950/50 ring-1 ring-white/15 backdrop-blur-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              Villains ({VILLAINS.length})
            </button>
            <button
              onClick={() => setVillainHenchmanTab('henchman')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                villainHenchmanTab === 'henchman'
                  ? 'bg-gradient-to-r from-sky-950 via-blue-900/80 to-cyan-950 text-sky-100 border-sky-400/60 shadow-lg shadow-sky-950/50 ring-1 ring-white/15 backdrop-blur-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              Henchmen ({HENCHMEN.length})
            </button>
          </div>
        )}

        {/* Filter Controls: Search & Expansion Filter */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, expansion, hero..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors min-h-[42px]"
              />
            </div>

            {/* Expansion Filter */}
            <div>
              <select
                value={selectedExpansion}
                onChange={(e) => setSelectedExpansion(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors min-h-[42px] cursor-pointer"
              >
                <option value="all">All Expansions ({safeExpansions.length})</option>
                {safeExpansions.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.name} {!safeEnabledExpansions.includes(exp.id) ? '(Unselected)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-slate-200">{filteredAndSortedCards.length}</strong> options in alphabetical order
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {/* Card List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredAndSortedCards.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No matching options found. Try clearing your search or switching expansion filter to "All Expansions".
            </div>
          ) : (
            filteredAndSortedCards.map((card: any) => {
              const isSelected = card.id === activeCardId;
              const expName = expansionMap.get(card.expansion) || card.expansion;
              const isOwned = safeEnabledExpansions.includes(card.expansion);
              const cardKeywords = getCardKeywords(card);
              const evilWinsText = (cardType === 'scheme' || card.twists !== undefined) ? getSchemeEvilWins(card) : '';
              const cardCategory = card._kind || cardType;

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    handleSelect(cardType, card, slotIndex);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 border-purple-500/80 text-white shadow-lg shadow-purple-950/60 ring-1 ring-white/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-purple-500/40 hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-slate-100 break-words leading-tight">
                        <button onClick={(e) => openGroupModal(e, card.name, expName, (card as any).cards || [], cardCategory)} className="hover:text-purple-300 hover:underline transition-colors cursor-pointer text-left">
                          {card.name}
                        </button>
                      </span>

                      {/* Kind Badge for Villains & Henchmen */}
                      {card._kind === 'villain' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg bg-gradient-to-r from-red-950/90 via-zinc-950/80 to-red-900/90 text-red-300 border border-red-500/50 ring-1 ring-white/10 shadow-sm">
                          Villain Group ({card.cardsCount || 8})
                        </span>
                      )}
                      {card._kind === 'henchman' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg bg-gradient-to-r from-sky-950 via-blue-900/80 to-cyan-950 text-sky-300 border border-sky-400/60 ring-1 ring-white/10 shadow-sm shadow-sky-950/40">
                          Henchman Group ({card.cardsCount || 10})
                        </span>
                      )}

                      {card.realName && (
                        <span className="text-xs text-slate-400 italic">
                          ({card.realName})
                        </span>
                      )}

                      {card.team && <TeamBadge team={card.team} />}
                      {card.difficulty && (
                        <DifficultyBadge difficulty={card.difficulty} />
                      )}

                      {/* Adversary ATK & VP (not Schemes or Heroes) */}
                      {cardCategory !== 'scheme' && cardCategory !== 'hero' && card.attack && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-300 bg-gradient-to-r from-red-950/90 via-rose-950/80 to-red-900/90 px-2.5 py-0.5 rounded-lg border border-red-500/50 ring-1 ring-white/10 backdrop-blur-md shadow-sm">
                          <Swords className="w-3.5 h-3.5 text-red-400" />
                          {card.attack} ATK
                        </span>
                      )}
                      {cardCategory !== 'scheme' && cardCategory !== 'hero' && card.victoryPoints && (
                        <span className="text-xs font-semibold text-emerald-300 bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-emerald-900/90 px-2.5 py-0.5 rounded-lg border border-emerald-500/50 ring-1 ring-white/10 backdrop-blur-md shadow-sm">
                          {card.victoryPoints} VP
                        </span>
                      )}
                    </div>

                    {card.classes && (
                      <div className="flex items-center gap-1 pt-0.5">
                        {card.classes.map((c: any) => (
                          <ClassBadge key={c} heroClass={c} showLabel />
                        ))}
                      </div>
                    )}

                    {card.alwaysLeads && (
                      <div className="text-xs text-purple-300 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-purple-400" />
                        Always Leads: <span className="font-semibold text-purple-300">{card.alwaysLeads}</span>
                      </div>
                    )}

                    {/* Evil Wins text for Schemes */}
                    {evilWinsText && (
                      <div className="text-xs text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 mt-1">
                        <RichRulesText text={evilWinsText} />
                      </div>
                    )}

                    {/* Keywords list */}
                    {cardKeywords.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {cardKeywords.map((kw: string) => (
                          <KeywordBadge key={kw} keyword={kw} />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                      <span className="font-medium text-slate-400">{expName}</span>
                      {!isOwned && (
                        <span className="text-amber-500/80 italic">
                          (Set unselected in your settings)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 text-purple-200 border border-purple-500/60 font-bold text-xs shadow-md ring-1 ring-white/15">
                        <Check className="w-3.5 h-3.5 text-purple-300" /> Selected
                      </span>
                    ) : (
                      <button className="px-4 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 hover:from-purple-900 hover:via-indigo-900 hover:to-purple-800 active:scale-95 text-xs font-semibold text-purple-100 hover:text-white border border-purple-500/50 hover:border-purple-400/80 shadow-md ring-1 ring-white/15 backdrop-blur-md transition-all touch-manipulation cursor-pointer">
                        Choose
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            Sorted alphabetically
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 hover:from-purple-900 hover:via-indigo-900 hover:to-purple-800 text-purple-100 hover:text-white border border-purple-500/50 hover:border-purple-400/80 shadow-md ring-1 ring-white/15 backdrop-blur-md transition-all font-semibold min-h-[38px] touch-manipulation cursor-pointer active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
