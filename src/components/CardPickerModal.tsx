import { KeywordBadge } from "./KeywordBadge";
import { RichRulesText } from './symbols/RichRulesText';
import { useData } from '../contexts/DataContext';
import React, { useState, useMemo, useCallback } from 'react';
import { CardType, ActiveSetup } from '../types';
import {
  TeamBadge,
  ClassBadge,
  DifficultyBadge,
  extractReferencedClasses,
  extractHeroProvidedClasses,
  extractReferencedTeams,
  extractHeroProvidedTeams,
} from './CardBadges';
import { getCardKeywords, getSchemeEvilWins } from './RandomizerView';
import {
  X,
  Search,
  Check,
  ShieldAlert,
  Swords,
  Layers,
  Skull,
  ArrowUpDown,
  Users,
  Shield,
  BookOpen,
} from 'lucide-react';

interface CardPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardType: CardType;
  slotIndex?: number;
  currentCardId?: string;
  currentId?: string;
  currentSetup?: ActiveSetup | null;
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
  currentSetup,
  enabledExpansions = [],
  onSelectCard,
  onSelect,
}) => {
  const { heroes, masterminds, villains, henchmen, schemes, expansions } =
    useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpansion, setSelectedExpansion] = useState<string>('all');
  const [villainHenchmanTab, setVillainHenchmanTab] = useState<'all' | 'villain' | 'henchman'>('all');
  const [filterTeamSynergy, setFilterTeamSynergy] = useState(false);
  const [filterClassSynergy, setFilterClassSynergy] = useState(false);
  const [filterKeywordSynergy, setFilterKeywordSynergy] = useState(false);
  const [heroSortBySynergy, setHeroSortBySynergy] = useState(false);

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
  const isHeroPicker = cardType === 'hero';

  // Analyze active team, class, and keyword synergy context strictly from other heroes (excluding the slot being replaced)
  const activeSetupSynergyContext = useMemo(() => {
    if (!currentSetup || !isHeroPicker) return null;

    const currentHeroes = currentSetup.heroes || [];
    // Strictly exclude the hero in the slot being replaced
    const otherHeroes = currentHeroes.filter((_, idx) => (slotIndex !== undefined ? idx !== slotIndex : true));
    
    // Gather teams provided and referenced by other heroes
    const otherHeroProvidedTeams = new Set<string>();
    const otherHeroReferencedTeams = new Set<string>();
    const teamCounts: Record<string, number> = {};

    otherHeroes.forEach((h) => {
      const provided = extractHeroProvidedTeams(h);
      provided.forEach((t) => {
        otherHeroProvidedTeams.add(t);
        teamCounts[t] = (teamCounts[t] || 0) + 1;
      });

      const referenced = extractReferencedTeams(h);
      referenced.forEach((t) => {
        otherHeroReferencedTeams.add(t);
      });
    });

    // Gather classes provided and referenced by other heroes
    const otherHeroProvidedClasses = new Set<string>();
    const otherHeroReferencedClasses = new Set<string>();
    const classCounts: Record<string, number> = {};

    otherHeroes.forEach((h) => {
      const provided = extractHeroProvidedClasses(h);
      provided.forEach((c) => {
        otherHeroProvidedClasses.add(c);
        classCounts[c] = (classCounts[c] || 0) + 1;
      });

      const referenced = extractReferencedClasses(h);
      referenced.forEach((c) => {
        otherHeroReferencedClasses.add(c);
      });
    });

    // Gather all keywords present across other heroes
    const otherHeroKeywords = new Set<string>();
    otherHeroes.forEach((h) => {
      getCardKeywords(h).forEach((kw) => {
        const norm = kw.trim().toLowerCase();
        if (norm) otherHeroKeywords.add(norm);
      });
    });

    return {
      otherHeroes,
      teamCounts,
      classCounts,
      otherHeroProvidedTeams,
      otherHeroReferencedTeams,
      otherHeroProvidedClasses,
      otherHeroReferencedClasses,
      otherHeroKeywords,
    };
  }, [currentSetup, isHeroPicker, slotIndex]);

  // Check if hero matches team synergy:
  // When the active team's cards contain team symbols/triggers in their rules text,
  // the candidate hero MUST provide at least one of those required teams.
  // If the active team has no team triggers in rules text, fallback to candidates that share teams or trigger team affiliations in the setup.
  const isHeroMatchingTeamSynergy = useCallback((hero: any): boolean => {
    if (!activeSetupSynergyContext) return true;
    const { otherHeroProvidedTeams, otherHeroReferencedTeams } = activeSetupSynergyContext;

    const candidateProvided = extractHeroProvidedTeams(hero);
    const candidateReferenced = extractReferencedTeams(hero);

    if (otherHeroReferencedTeams.size > 0) {
      return Array.from(candidateProvided).some((t) => otherHeroReferencedTeams.has(t));
    }

    if (otherHeroProvidedTeams.size > 0) {
      const sharesTeam = Array.from(candidateProvided).some((t) => otherHeroProvidedTeams.has(t));
      const triggersTeam = Array.from(candidateReferenced).some((t) => otherHeroProvidedTeams.has(t));
      return sharesTeam || triggersTeam;
    }

    return false;
  }, [activeSetupSynergyContext]);

  // Check if hero matches keyword synergy: shares at least one keyword with another hero
  const isHeroMatchingKeywordSynergy = useCallback((hero: any): boolean => {
    if (!activeSetupSynergyContext) return true;
    const { otherHeroKeywords } = activeSetupSynergyContext;
    if (otherHeroKeywords.size === 0) return false;
    const heroKeywords = getCardKeywords(hero);
    return heroKeywords.some((kw) => otherHeroKeywords.has(kw.trim().toLowerCase()));
  }, [activeSetupSynergyContext]);

  // Check if hero matches class synergy:
  // When the active team's cards contain class symbols/triggers in their rules text,
  // the candidate hero MUST provide at least one of those required classes (e.g. Rogue/Covert).
  // If the active team has no class triggers in rules text, fallback to candidates whose card text cares about what the team provides.
  const isHeroMatchingClassSynergy = useCallback((hero: any): boolean => {
    if (!activeSetupSynergyContext) return true;
    const { otherHeroProvidedClasses, otherHeroReferencedClasses } = activeSetupSynergyContext;
    
    const candidateProvided = extractHeroProvidedClasses(hero);
    const candidateReferenced = extractReferencedClasses(hero);

    if (otherHeroReferencedClasses.size > 0) {
      return Array.from(candidateProvided).some((c) => otherHeroReferencedClasses.has(c));
    }

    if (otherHeroProvidedClasses.size > 0) {
      return Array.from(candidateReferenced).some((c) => otherHeroProvidedClasses.has(c));
    }

    return false;
  }, [activeSetupSynergyContext]);

  // Counts of heroes matching synergy modes
  const teamSynergyCount = useMemo(() => {
    if (!isHeroPicker || !activeSetupSynergyContext) return 0;
    return HEROES.filter((h) => isHeroMatchingTeamSynergy(h)).length;
  }, [isHeroPicker, activeSetupSynergyContext, HEROES, isHeroMatchingTeamSynergy]);

  const classSynergyCount = useMemo(() => {
    if (!isHeroPicker || !activeSetupSynergyContext) return 0;
    return HEROES.filter((h) => isHeroMatchingClassSynergy(h)).length;
  }, [isHeroPicker, activeSetupSynergyContext, HEROES, isHeroMatchingClassSynergy]);

  const keywordSynergyCount = useMemo(() => {
    if (!isHeroPicker || !activeSetupSynergyContext) return 0;
    return HEROES.filter((h) => isHeroMatchingKeywordSynergy(h)).length;
  }, [isHeroPicker, activeSetupSynergyContext, HEROES, isHeroMatchingKeywordSynergy]);

  // Compute synergy info for a hero
  const getHeroSynergyInfo = useCallback((hero: any) => {
    if (!activeSetupSynergyContext) return { score: 0, matchingTeams: [], matchingClasses: [], matchingKeywords: [] };

    const matchingTeams: { team: string; type: 'provides' | 'triggers' }[] = [];
    const candidateProvidedTeams = extractHeroProvidedTeams(hero);
    const candidateReferencedTeams = extractReferencedTeams(hero);

    if (activeSetupSynergyContext.otherHeroReferencedTeams.size > 0) {
      Array.from(candidateProvidedTeams).forEach((t) => {
        if (activeSetupSynergyContext.otherHeroReferencedTeams.has(t)) {
          matchingTeams.push({ team: t, type: 'provides' });
        }
      });
    } else if (activeSetupSynergyContext.otherHeroProvidedTeams.size > 0) {
      Array.from(candidateProvidedTeams).forEach((t) => {
        if (activeSetupSynergyContext.otherHeroProvidedTeams.has(t)) {
          matchingTeams.push({ team: t, type: 'provides' });
        }
      });
      Array.from(candidateReferencedTeams).forEach((t) => {
        if (activeSetupSynergyContext.otherHeroProvidedTeams.has(t)) {
          matchingTeams.push({ team: t, type: 'triggers' });
        }
      });
    }

    const matchingClasses: { heroClass: string; type: 'provides' | 'triggers' }[] = [];
    const candidateProvided = extractHeroProvidedClasses(hero);
    const candidateReferenced = extractReferencedClasses(hero);

    if (activeSetupSynergyContext.otherHeroReferencedClasses.size > 0) {
      Array.from(candidateProvided).forEach((c) => {
        if (activeSetupSynergyContext.otherHeroReferencedClasses.has(c)) {
          matchingClasses.push({ heroClass: c, type: 'provides' });
        }
      });
    } else if (activeSetupSynergyContext.otherHeroProvidedClasses.size > 0) {
      Array.from(candidateReferenced).forEach((c) => {
        if (activeSetupSynergyContext.otherHeroProvidedClasses.has(c)) {
          matchingClasses.push({ heroClass: c, type: 'triggers' });
        }
      });
    }

    const heroKeywords = getCardKeywords(hero);
    const matchingKeywords: string[] = [];
    heroKeywords.forEach((kw) => {
      if (activeSetupSynergyContext.otherHeroKeywords.has(kw.trim().toLowerCase())) {
        matchingKeywords.push(kw);
      }
    });

    // Score calculation
    const teamScore = matchingTeams.length * 8;
    const classScore = matchingClasses.length * 5;
    const kwScore = matchingKeywords.length * 2.5;
    const score = teamScore + classScore + kwScore;

    return { score, matchingTeams, matchingClasses, matchingKeywords };
  }, [activeSetupSynergyContext]);

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
        const teamMatch =
          'team' in card &&
          (card.team || '').toLowerCase().includes(term);

        return nameMatch || expMatch || realNameMatch || alwaysLeadsMatch || teamMatch;
      });
    }

    // Expansion filter
    if (selectedExpansion !== 'all') {
      result = result.filter((c) => c.expansion === selectedExpansion);
    }

    // Hero Synergy Filters (multi-select with AND logic)
    if (isHeroPicker && activeSetupSynergyContext) {
      if (filterTeamSynergy) {
        result = result.filter((hero) => isHeroMatchingTeamSynergy(hero));
      }
      if (filterClassSynergy) {
        result = result.filter((hero) => isHeroMatchingClassSynergy(hero));
      }
      if (filterKeywordSynergy) {
        result = result.filter((hero) => isHeroMatchingKeywordSynergy(hero));
      }
    }

    // Sorting
    if (isHeroPicker && heroSortBySynergy && activeSetupSynergyContext) {
      return [...result].sort((a, b) => {
        const scoreA = getHeroSynergyInfo(a).score;
        const scoreB = getHeroSynergyInfo(b).score;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (a.name || '').localeCompare(b.name || '');
      });
    }

    // Default sort strictly alphabetically by card name
    return [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [
    rawCards,
    searchTerm,
    selectedExpansion,
    expansionMap,
    isHeroPicker,
    filterTeamSynergy,
    filterClassSynergy,
    filterKeywordSynergy,
    heroSortBySynergy,
    activeSetupSynergyContext,
    isHeroMatchingTeamSynergy,
    isHeroMatchingClassSynergy,
    isHeroMatchingKeywordSynergy,
    getHeroSynergyInfo,
  ]);

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
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-['Cinzel'] tracking-wide flex items-center gap-2">
              <span>{getTitle()}</span>
            </h2>
            <p className="text-xs text-purple-200/80 mt-0.5">
              Browse and select a replacement card.
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

        {/* Sub-Tabs for Hero Synergy Filters */}
        {isHeroPicker && activeSetupSynergyContext && (
          <div className="px-4 py-2.5 bg-slate-950/80 border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-sm relative z-10">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-xs font-semibold text-purple-300 mr-1 flex items-center gap-1 shrink-0">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                Synergies:
              </span>

              {/* All / Reset Filters */}
              <button
                onClick={() => {
                  setFilterTeamSynergy(false);
                  setFilterClassSynergy(false);
                  setFilterKeywordSynergy(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                  !filterTeamSynergy && !filterClassSynergy && !filterKeywordSynergy
                    ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 text-purple-100 border-purple-500/60 shadow-md ring-1 ring-white/15 backdrop-blur-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                All ({HEROES.length})
              </button>

              {/* Team Synergy */}
              <button
                onClick={() => setFilterTeamSynergy((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  filterTeamSynergy
                    ? 'bg-gradient-to-r from-amber-950/90 via-yellow-950/95 to-amber-900/90 text-amber-200 border-amber-500/60 shadow-md ring-1 ring-white/15 backdrop-blur-md'
                    : 'bg-slate-950/60 border-slate-800 text-amber-400 hover:text-amber-200 hover:bg-slate-900/80'
                }`}
                title="Only include heroes with team synergy: cards that trigger off team symbols referenced in rules text, or provide the required teams"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Team Synergy</span>
                <span className="text-[10px] font-mono opacity-80 font-bold ml-0.5">({teamSynergyCount})</span>
              </button>

              {/* Class Synergy button */}
              <button
                onClick={() => setFilterClassSynergy((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  filterClassSynergy
                    ? 'bg-gradient-to-r from-blue-950 via-cyan-950 to-teal-950 text-cyan-200 border-cyan-500/60 shadow-md ring-1 ring-white/15 backdrop-blur-md'
                    : 'bg-slate-950/60 border-slate-800 text-cyan-400 hover:text-cyan-200 hover:bg-slate-900/80'
                }`}
                title="Only include heroes with class synergy: cards that trigger off classes provided by the team, or provide classes required by the team's cards"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Class Synergy</span>
                <span className="text-[10px] font-mono opacity-80 font-bold ml-0.5">({classSynergyCount})</span>
              </button>

              {/* Keyword Synergy button */}
              <button
                onClick={() => setFilterKeywordSynergy((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  filterKeywordSynergy
                    ? 'bg-gradient-to-r from-purple-950 via-fuchsia-950 to-pink-950 text-purple-200 border-purple-500/60 shadow-md ring-1 ring-white/15 backdrop-blur-md'
                    : 'bg-slate-950/60 border-slate-800 text-purple-400 hover:text-purple-200 hover:bg-slate-900/80'
                }`}
                title="Only include heroes with at least one keyword shared with another hero (excluding replaced hero)"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Keyword Synergy</span>
                <span className="text-[10px] font-mono opacity-80 font-bold ml-0.5">({keywordSynergyCount})</span>
              </button>
            </div>

            <button
              onClick={() => setHeroSortBySynergy(!heroSortBySynergy)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0 ${
                heroSortBySynergy
                  ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 text-purple-100 border-purple-500/60 shadow-lg shadow-purple-950/50 ring-1 ring-white/15 backdrop-blur-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
              <span>{heroSortBySynergy ? 'Sorted by Synergy Score' : 'Sort: Alphabetical'}</span>
            </button>
          </div>
        )}

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
                placeholder="Search by name, expansion, hero, team..."
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
              Showing <strong className="text-slate-200">{filteredAndSortedCards.length}</strong> options {heroSortBySynergy ? 'by synergy rank' : 'in alphabetical order'}
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
              No matching options found. Try clearing your search, disabling synergy filter, or switching expansion filter to "All Expansions".
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
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 border-purple-500/80 text-white shadow-lg shadow-purple-950/60 ring-1 ring-white/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-purple-500/40 hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                        <span className="font-bold text-base text-slate-100 break-words leading-tight">
                          <button
                            onClick={(e) => openGroupModal(e, card.name, expName, (card as any).cards || [], cardCategory)}
                            className="hover:text-purple-300 hover:underline transition-colors cursor-pointer text-left"
                          >
                            {card.name}
                          </button>
                        </span>

                        {/* Class symbols immediately after Hero Name */}
                        {card.classes && (
                          <div className="flex items-center gap-1">
                            {card.classes.map((c: any) => (
                              <ClassBadge key={c} heroClass={c} showLabel={false} />
                            ))}
                          </div>
                        )}

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

                      {/* Far right: Team Badge & Selected indicator */}
                      <div className="flex items-center gap-2 shrink-0 ml-auto">
                        {card.team && <TeamBadge team={card.team} />}
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-950/90 text-purple-200 border border-purple-400/60 font-bold text-xs shadow-sm ring-1 ring-white/10">
                            <Check className="w-3.5 h-3.5 text-purple-300" /> Current
                          </span>
                        )}
                      </div>
                    </div>

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
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            {heroSortBySynergy ? 'Sorted by synergy rank' : 'Sorted alphabetically'}
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
