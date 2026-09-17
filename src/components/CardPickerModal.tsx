import { KeywordBadge } from "./KeywordBadge";
import { useData } from '../contexts/DataContext';
import React, { useState, useMemo } from 'react';
import {
  CardType,
  MastermindCard,
  SchemeCard,
  HeroCard,
  VillainGroup,
  HenchmanGroup,
} from '../types';
import { TeamBadge, ClassBadge, DifficultyBadge } from './CardBadges';
import { getCardKeywords } from './RandomizerView';
import {
  X,
  Search,
  Check,
  ShieldAlert,
  Swords,
  Layers,
  ArrowDownAZ,
  Tag,
  Skull,
  Users,
} from 'lucide-react';

interface CardPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardType: CardType;
  slotIndex?: number;
  currentCardId: string;
  enabledExpansions: string[];
  onSelectCard: (type: CardType, card: any, slotIndex?: number) => void;
}

export const CardPickerModal: React.FC<CardPickerModalProps> = ({
  isOpen,
  onClose,
  cardType,
  slotIndex,
  currentCardId,
  enabledExpansions,
  onSelectCard,
}) => {
  const data = useData() || {};
  const HEROES = data.heroes || [];
  const MASTERMINDS = data.masterminds || [];
  const VILLAINS = data.villains || [];
  const HENCHMEN = data.henchmen || [];
  const SCHEMES = data.schemes || [];
  const EXPANSIONS = data.expansions || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniverse, setSelectedUniverse] = useState<string>('all');
  const [selectedExpansion, setSelectedExpansion] = useState<string>('enabled_only');
  // For villain / henchman swap, allow switching between All, Villains, Henchmen
  const [villainHenchmanTab, setVillainHenchmanTab] = useState<'all' | 'villain' | 'henchman'>('all');

  const expansionMap = useMemo(() => {
    return new Map(EXPANSIONS.map((e) => [e.id, e.name]));
  }, [EXPANSIONS]);

  const expUniverseMap = useMemo(() => {
    const map = new Map<string, string>();
    EXPANSIONS.forEach((e) => map.set(e.id, e.universe || 'Marvel'));
    return map;
  }, [EXPANSIONS]);

  const availableUniverses = useMemo(() => {
    const set = new Set<string>();
    EXPANSIONS.forEach((e) => set.add(e.universe || 'Marvel'));
    return Array.from(set).sort();
  }, [EXPANSIONS]);

  const sortedExpansions = useMemo(() => {
    const filtered = selectedUniverse === 'all'
      ? EXPANSIONS
      : EXPANSIONS.filter((e) => (e.universe || 'Marvel') === selectedUniverse);
    return [...filtered].sort((a, b) => {
      const isCoreA = a.boxType === 'Core';
      const isCoreB = b.boxType === 'Core';
      if (isCoreA && !isCoreB) return -1;
      if (!isCoreA && isCoreB) return 1;
      return (a.releaseYear || 2020) - (b.releaseYear || 2020) || (a.order || 0) - (b.order || 0);
    });
  }, [EXPANSIONS, selectedUniverse]);

  const isVillainOrHenchman = cardType === 'villain' || cardType === 'henchman';

  // Derive card pool based on cardType and sub-tabs
  const rawCardList = useMemo(() => {
    switch (cardType) {
      case 'scheme':
        return SCHEMES.map((s) => ({ ...s, _kind: 'scheme' as const }));
      case 'mastermind':
        return MASTERMINDS.map((m) => ({ ...m, _kind: 'mastermind' as const }));
      case 'hero':
        return HEROES.map((h) => ({ ...h, _kind: 'hero' as const }));
      case 'villain':
      case 'henchman': {
        const vList = VILLAINS.map((v) => ({ ...v, _kind: 'villain' as const }));
        const hList = HENCHMEN.map((h) => ({ ...h, _kind: 'henchman' as const }));

        if (villainHenchmanTab === 'villain') return vList;
        if (villainHenchmanTab === 'henchman') return hList;
        // 'all': combine both
        return [...vList, ...hList];
      }
      default:
        return [];
    }
  }, [cardType, villainHenchmanTab]);

  // Filter and sort Alphabetically

  const openGroupModal = (e: React.MouseEvent, title: string, subtitle: string, cards: any[]) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-card-group-modal', { detail: { title, subtitle, cards } }));
  };

  const filteredAndSortedCards = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    const normalize = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normQ = normalize(searchTerm);

    const filtered = rawCardList.filter((card: any) => {
      if (normQ) {
        const nameMatch = normalize(card.name).includes(normQ);
        const realNameMatch = normalize(card.realName).includes(normQ);
        const teamMatch = normalize(card.team).includes(normQ);
        const alwaysLeadsMatch = normalize(card.alwaysLeads).includes(normQ);
        
        const kws = getCardKeywords(card).join(' ');
        const kwMatch = normalize(kws).includes(normQ);
        
        const ledByMatch = card.ledBy?.some((lead: string) => normalize(lead).includes(normQ));

        const cardMatch = card.cards?.some((c: any) =>
          normalize(c.name).includes(normQ) ||
          normalize(c.subtitle).includes(normQ) ||
          normalize(c.rulesText).includes(normQ)
        );

        if (!nameMatch && !realNameMatch && !teamMatch && !alwaysLeadsMatch && !kwMatch && !ledByMatch && !cardMatch) {
          return false;
        }
      }

      // Universe filter
      if (selectedUniverse !== 'all') {
        const u = expUniverseMap.get(card.expansion) || 'Marvel';
        if (u !== selectedUniverse) return false;
      }

      // Expansion filter
      if (selectedExpansion === 'enabled_only') {
        if (!enabledExpansions.includes(card.expansion)) return false;
      } else if (selectedExpansion !== 'all') {
        if (card.expansion !== selectedExpansion) return false;
      }

      return true;
    });

    // Sort all options in Alphabetical order A to Z
    return filtered.sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [rawCardList, searchTerm, selectedExpansion, selectedUniverse, enabledExpansions, expUniverseMap]);

  if (!isOpen) return null;

  const typeTitle = {
    scheme: 'Scheme',
    mastermind: 'Mastermind',
    hero: 'Hero',
    villain: 'Villain Group',
    henchman: 'Henchman Group',
  }[cardType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span>Select {isVillainOrHenchman ? 'Villains & Henchmen' : typeTitle}</span>
                {slotIndex !== undefined && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Slot #{slotIndex + 1}
                  </span>
                )}
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>Alphabetical A-Z</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose replacement card. All available options from all expansions shown in alphabetical order.
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shrink-0 touch-manipulation"
            aria-label="Close picker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs for Villain & Henchman Combined Group */}
        {isVillainOrHenchman && (
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 shadow-sm relative z-10">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              Type:
            </span>
            <button
              onClick={() => setVillainHenchmanTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                villainHenchmanTab === 'all'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-inner'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({VILLAINS.length + HENCHMEN.length})
            </button>
            <button
              onClick={() => setVillainHenchmanTab('villain')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                villainHenchmanTab === 'villain'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-inner'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Villains ({VILLAINS.length})
            </button>
            <button
              onClick={() => setVillainHenchmanTab('henchman')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                villainHenchmanTab === 'henchman'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-inner'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Henchmen ({HENCHMEN.length})
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-900/90 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search by card name, hero, keyword, or text...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-slate-950 border border-slate-700/80 rounded-xl text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={selectedUniverse}
              onChange={(e) => {
                setSelectedUniverse(e.target.value);
                setSelectedExpansion('all');
              }}
              className="w-full px-3 py-2.5 min-h-[44px] bg-slate-950 border border-slate-700/80 rounded-xl text-base sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Universes</option>
              {availableUniverses.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-60">
            <select
              value={selectedExpansion}
              onChange={(e) => setSelectedExpansion(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] bg-slate-950 border border-slate-700/80 rounded-xl text-base sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Expansions ({rawCardList.length} cards)</option>
              <option value="enabled_only">My Enabled Expansions Only</option>
              <optgroup label="Single Expansions (A-Z)">
                {sortedExpansions.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.name} {!enabledExpansions.includes(exp.id) ? '• (Not Enabled)' : ''}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Showing <strong className="text-slate-200">{filteredAndSortedCards.length}</strong> options in alphabetical order
            </span>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-amber-400 hover:text-amber-300 transition-colors"
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
              const isSelected = card.id === currentCardId;
              const expName = expansionMap.get(card.expansion) || card.expansion;
              const isOwned = enabledExpansions.includes(card.expansion);
              const cardKeywords = getCardKeywords(card);

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    onSelectCard(cardType, card, slotIndex);
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
                        <button onClick={(e) => openGroupModal(e, card.name, expName, (card as any).cards)} className="hover:text-indigo-400 hover:underline transition-colors cursor-pointer text-left">
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
                          <Swords className="w-3 h-3" />
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
                      <button className="px-4 py-2 min-h-[38px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-slate-200 border border-slate-700 transition-all touch-manipulation">
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
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Click any card to swap it immediately into your scenario.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
