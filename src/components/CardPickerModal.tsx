import { KeywordBadge } from "./KeywordBadge";
import { RichRulesText } from './symbols/RichRulesText';
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

  const openGroupModal = (e: React.MouseEvent, title: string, subtitle?: string, cards?: any[]) => {
    e.stopPropagation();
    if (cards && cards.length > 0) {
      window.dispatchEvent(new CustomEvent('open-card-group-modal', {
        detail: { title, subtitle, cards }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-['Cinzel'] tracking-wide">
              {getTitle()}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse and select a replacement card. Sorted alphabetically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shrink-0 touch-manipulation cursor-pointer"
            aria-label="Close picker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs for Villain & Henchman Combined Group */}
        {isVillainOrHenchman && (\
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 shadow-sm relative z-10">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              Type:
            </span>
            <button
              onClick={() => setVillainHenchmanTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                villainHenchmanTab === 'all'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-inner'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({VILLAINS.length + HENCHMEN.length})
            </button>
            <button
              onClick={() => setVillainHenchmanTab('villain')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                villainHenchmanTab === 'villain'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-inner'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Villains ({VILLAINS.length})
            </button>
            <button
              onClick={() => setVillainHenchmanTab('henchman')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                villainHenchmanTab === 'henchman'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-inner'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors min-h-[42px]"
              />
            </div>

            {/* Expansion Filter */}
            <div>
              <select
                value={selectedExpansion}
                onChange={(e) => setSelectedExpansion(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors min-h-[42px] cursor-pointer"
              >
                <option value="all">All Expansions ({safeExpansions.length})</option>
                {safeExpansions.map((exp) => (
                  <option key={exp.id} value={exp.id}>\
                    {exp.name} {!safeEnabledExpansions.includes(exp.id) ? '(Unselected)' : ''}\
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-slate-200">{filteredAndSortedCards.length}</strong> options in alphabetical order
            </span>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              Clear search
            </button>
          )}
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

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    handleSelect(cardType, card, slotIndex);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-slate-100 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-slate-100 break-words leading-tight">
                        <button onClick={(e) => openGroupModal(e, card.name, expName, (card as any).cards || [])} className="hover:text-indigo-400 hover:underline transition-colors cursor-pointer text-left">
                          {card.name}
                        </button>
                      </span>

                      {/* Kind Badge for Villains & Henchmen */}
                      {card._kind === 'villain' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Villain Group ({card.cardsCount || 8})
                        </span>
                      )}
                      {card._kind === 'henchman' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
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
                      {card.attack && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/40">
                          <Swords className="w-3.5 h-3.5" />
                          {card.attack} ATK
                        </span>
                      )}
                      {card.victoryPoints && (
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/40">
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
                      <div className="text-xs text-amber-300/80 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        Always Leads: <span className="font-semibold text-amber-200">{card.alwaysLeads}</span>
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
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">
                        <Check className="w-3.5 h-3.5" /> Selected
                      </span>
                    ) : (
                      <button className="px-4 py-2 min-h-[38px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-slate-200 border border-slate-700 transition-all touch-manipulation cursor-pointer">
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
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Sorted alphabetically
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium min-h-[38px] touch-manipulation cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
