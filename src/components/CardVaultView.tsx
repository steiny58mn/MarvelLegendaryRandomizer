import { KeywordBadge } from "./KeywordBadge";
import { useData } from '../contexts/DataContext';
import React, { useState, useMemo } from 'react';
import { CardType } from '../types';
import { TeamBadge, ClassBadge, DifficultyBadge } from './CardBadges';
import { getCardKeywords } from './RandomizerView';
import { RichRulesText } from './symbols/RichRulesText';
import { SymbolLibraryModal } from './symbols/SymbolLibraryModal';
import { prefetchImageUrl } from '../utils/imageOptimizer';
import {
  Search,
  BookOpen,
  Swords,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Skull,
  Scroll,
  UserCheck,
} from 'lucide-react';

type VaultCategory = 'all' | 'mastermind' | 'scheme' | 'hero' | 'villains_and_henchmen';

export const CardVaultView: React.FC = () => {
  const data = useData() || {};
  const HEROES = data.heroes || [];
  const MASTERMINDS = data.masterminds || [];
  const VILLAINS = data.villains || [];
  const HENCHMEN = data.henchmen || [];
  const SCHEMES = data.schemes || [];
  const EXPANSIONS = data.expansions || [];

  const [activeCategory, setActiveCategory] = useState<VaultCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniverse, setSelectedUniverse] = useState<string>('all');
  const [selectedExpansion, setSelectedExpansion] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);

  // Universe map for expansions
  const expUniverseMap = useMemo(() => {
    const map = new Map<string, string>();
    EXPANSIONS.forEach((e) => map.set(e.id, e.universe || 'Marvel'));
    return map;
  }, [EXPANSIONS]);

  // Unique universes and dynamic teams list
  const availableUniverses = useMemo(() => {
    const set = new Set<string>();
    EXPANSIONS.forEach((e) => set.add(e.universe || 'Marvel'));
    return Array.from(set).sort();
  }, [EXPANSIONS]);

  const availableTeams = useMemo(() => {
    const set = new Set<string>();
    HEROES.forEach((h) => {
      if (h.team) set.add(h.team);
    });
    return Array.from(set).sort();
  }, [HEROES]);

  // Filter expansions based on selected universe
  const filteredExpansionsList = useMemo(() => {
    if (selectedUniverse === 'all') return EXPANSIONS;
    return EXPANSIONS.filter((e) => (e.universe || 'Marvel') === selectedUniverse);
  }, [EXPANSIONS, selectedUniverse]);

  // Collapsible sections, all starting collapsed
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    mastermind: true,
    scheme: true,
    hero: true,
    villains_and_henchmen: true,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const expandAll = () => {
    setCollapsedSections({
      mastermind: false,
      scheme: false,
      hero: false,
      villains_and_henchmen: false,
    });
  };

  const collapseAll = () => {
    setCollapsedSections({
      mastermind: true,
      scheme: true,
      hero: true,
      villains_and_henchmen: true,
    });
  };

  const allCollapsed = Object.values(collapsedSections).every(Boolean);

  const expansionMap = useMemo(() => {
    return new Map((EXPANSIONS || []).map((e) => [e.id, e.name]));
  }, [EXPANSIONS]);

  // Filter Masterminds

  const openGroupModal = (e: React.MouseEvent, title: string, subtitle: string, cards: any[]) => {
    e.stopPropagation();
    if (Array.isArray(cards)) {
      cards.forEach((c: any) => {
        if (c.imageUrl) prefetchImageUrl(c.imageUrl, 540, 75);
      });
    }
    window.dispatchEvent(new CustomEvent('open-card-group-modal', { detail: { title, subtitle, cards } }));
  };

  const filteredMasterminds = useMemo(() => {
    return MASTERMINDS.filter((m) => {
      const u = expUniverseMap.get(m.expansion) || 'Marvel';
      if (selectedUniverse !== 'all' && u !== selectedUniverse) return false;
      if (selectedExpansion !== 'all' && m.expansion !== selectedExpansion) return false;
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const kws = getCardKeywords(m).join(' ').toLowerCase();
        const hasCardMatch = (m as any).cards?.some((c: any) =>
          c.name?.toLowerCase().includes(q) ||
          c.subtitle?.toLowerCase().includes(q) ||
          c.rulesText?.toLowerCase().includes(q)
        );
        if (
          !m.name.toLowerCase().includes(q) &&
          !m.alwaysLeads?.toLowerCase().includes(q) &&
          !m.masterStrikeText?.toLowerCase().includes(q) &&
          !kws.includes(q) &&
          !hasCardMatch
        ) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [MASTERMINDS, searchQuery, selectedExpansion, selectedUniverse, expUniverseMap]);

  // Filter Schemes
  const filteredSchemes = useMemo(() => {
    return SCHEMES.filter((s) => {
      const u = expUniverseMap.get(s.expansion) || 'Marvel';
      if (selectedUniverse !== 'all' && u !== selectedUniverse) return false;
      if (selectedExpansion !== 'all' && s.expansion !== selectedExpansion) return false;
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const kws = getCardKeywords(s).join(' ').toLowerCase();
        const hasCardMatch = (s as any).cards?.some((c: any) =>
          c.name?.toLowerCase().includes(q) ||
          c.rulesText?.toLowerCase().includes(q)
        );
        if (
          !s.name.toLowerCase().includes(q) &&
          !s.difficulty?.toLowerCase().includes(q) &&
          !s.setupRule?.toLowerCase().includes(q) &&
          !s.twistEffect?.toLowerCase().includes(q) &&
          !s.evilWins?.toLowerCase().includes(q) &&
          !kws.includes(q) &&
          !hasCardMatch
        ) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [SCHEMES, searchQuery, selectedExpansion, selectedUniverse, expUniverseMap]);

  // Filter Heroes
  const filteredHeroes = useMemo(() => {
    return HEROES.filter((h) => {
      const u = expUniverseMap.get(h.expansion) || 'Marvel';
      if (selectedUniverse !== 'all' && u !== selectedUniverse) return false;
      if (selectedExpansion !== 'all' && h.expansion !== selectedExpansion) return false;
      if (selectedTeam !== 'all' && h.team !== selectedTeam) return false;
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const kws = getCardKeywords(h).join(' ').toLowerCase();
        const hasCardMatch = (h as any).cards?.some((c: any) =>
          c.name?.toLowerCase().includes(q) ||
          c.subtitle?.toLowerCase().includes(q) ||
          c.rulesText?.toLowerCase().includes(q)
        );
        if (
          !h.name.toLowerCase().includes(q) &&
          !h.realName?.toLowerCase().includes(q) &&
          !h.team.toLowerCase().includes(q) &&
          !kws.includes(q) &&
          !hasCardMatch
        ) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [HEROES, searchQuery, selectedExpansion, selectedTeam, selectedUniverse, expUniverseMap]);

  // Filter Villains & Henchmen (in the SAME group!)
  const filteredVillainsAndHenchmen = useMemo(() => {
    const list: Array<{ subType: 'villain' | 'henchman'; data: any }> = [];

    VILLAINS.forEach((v) => list.push({ subType: 'villain', data: v }));
    HENCHMEN.forEach((h) => list.push({ subType: 'henchman', data: h }));

    return list.filter(({ subType, data }) => {
      const u = expUniverseMap.get(data.expansion) || 'Marvel';
      if (selectedUniverse !== 'all' && u !== selectedUniverse) return false;
      if (selectedExpansion !== 'all' && data.expansion !== selectedExpansion) return false;
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const kws = getCardKeywords(data).join(' ').toLowerCase();
        const leads = data.ledBy?.join(' ').toLowerCase() || '';
        const hasCardMatch = data.cards?.some((c: any) =>
          c.name?.toLowerCase().includes(q) ||
          c.rulesText?.toLowerCase().includes(q)
        );
        if (
          !data.name.toLowerCase().includes(q) &&
          !leads.includes(q) &&
          !data.fightEffect?.toLowerCase().includes(q) &&
          !data.escapeEffect?.toLowerCase().includes(q) &&
          !kws.includes(q) &&
          !hasCardMatch
        ) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => a.data.name.localeCompare(b.data.name));
  }, [VILLAINS, HENCHMEN, searchQuery, selectedExpansion, selectedUniverse, expUniverseMap]);

  const totalCount =
    filteredMasterminds.length +
    filteredSchemes.length +
    filteredHeroes.length +
    filteredVillainsAndHenchmen.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Card Vault & Reference</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Condensed card library with keywords and expansions. Henchmen and Villains unified.
            </p>
          </div>

          {/* Category Tabs & Expand Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-slate-950 p-1 rounded-xl border border-slate-800 max-w-full">
              {(
                [
                  { id: 'all', label: 'All Cards' },
                  { id: 'mastermind', label: 'Masterminds' },
                  { id: 'scheme', label: 'Schemes' },
                  { id: 'hero', label: 'Heroes' },
                  { id: 'villains_and_henchmen', label: 'Villains & Henchmen' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 touch-manipulation ${
                    activeCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsSymbolModalOpen(true)}
              className="px-3.5 py-2 min-h-[38px] rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-colors active:scale-95 touch-manipulation cursor-pointer"
              title="Open Symbol & Icon Library"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Symbol Library</span>
            </button>

            <button
              onClick={allCollapsed ? expandAll : collapseAll}
              className="px-3.5 py-2 min-h-[38px] rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors active:scale-95 touch-manipulation"
            >
              {allCollapsed ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expand All</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Collapse All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-3 border-t border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by card name, hero, keywords, rules text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-slate-950 border border-slate-700/80 rounded-xl text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <select
              value={selectedUniverse}
              onChange={(e) => {
                setSelectedUniverse(e.target.value);
                setSelectedExpansion('all'); // reset expansion when universe changes
              }}
              className="w-full px-3 py-2.5 min-h-[44px] bg-slate-950 border border-slate-700/80 rounded-xl text-base sm:text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Universes</option>
              {availableUniverses.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedExpansion}
              onChange={(e) => setSelectedExpansion(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] bg-slate-950 border border-slate-700/80 rounded-xl text-base sm:text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Expansions</option>
              {filteredExpansionsList.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] bg-slate-950 border border-slate-700/80 rounded-xl text-base sm:text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-40"
              disabled={activeCategory !== 'all' && activeCategory !== 'hero'}
            >
              <option value="all">All Hero Teams</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
              <option value="Unaffiliated">Unaffiliated</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Found {totalCount} matching cards across vault</span>
          <span className="text-[11px] text-slate-400">Click section headers to expand or collapse</span>
        </div>
      </div>

      {/* SECTION 1: MASTERMINDS */}
      {(activeCategory === 'all' || activeCategory === 'mastermind') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all">
          <button
            onClick={() => toggleSection('mastermind')}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-850/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 rounded-lg bg-red-950/80 text-red-400 border border-red-800/50">
                <Skull className="w-4 h-4" />
              </span>
              <span className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">
                Masterminds
              </span>
              <span className="text-xs font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded-md border border-red-800/40">
                {filteredMasterminds.length} Cards
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-xs hidden sm:inline text-slate-500">
                {collapsedSections.mastermind ? 'Expand section' : 'Collapse section'}
              </span>
              {collapsedSections.mastermind ? (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-amber-400" />
              )}
            </div>
          </button>

          {!collapsedSections.mastermind && (
            <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/60 mt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                {filteredMasterminds.map((mm) => {
                  const expName = expansionMap.get(mm.expansion) || mm.expansion;
                  const keywords = getCardKeywords(mm);

                  return (
                    <div
                      key={mm.id}
                      className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-red-500/50 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950/80 text-red-400 border border-red-800/40">
                              Mastermind
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/50 border border-red-800/40 text-red-400 font-bold text-xs">
                              <Swords className="w-3 h-3" />
                              {mm.attack}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 font-bold text-xs">
                              <Shield className="w-3 h-3" />
                              {mm.victoryPoints} VP
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 capitalize">{expName}</span>
                        </div>

                        {/* Name condensed */}
                        <h4 className="font-extrabold text-base text-slate-100 mb-2">
                          <button onClick={(e) => openGroupModal(e, mm.name, expName, (mm as any).cards)} className="hover:text-indigo-400 hover:underline transition-colors text-left cursor-pointer">
                            {mm.name}
                          </button>
                        </h4>

                        {/* Description with Keywords */}
                        {(keywords.length > 0 || mm.alwaysLeads) && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {keywords.map((kw) => (
                              <KeywordBadge key={kw} keyword={kw} />
                            ))}
                            {mm.alwaysLeads && (
                              <span className="text-[11px] font-semibold text-amber-300/90 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-700/40 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                Leads: {mm.alwaysLeads}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                        4 Tactics Cards
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: SCHEMES */}
      {(activeCategory === 'all' || activeCategory === 'scheme') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all">
          <button
            onClick={() => toggleSection('scheme')}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-850/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/50">
                <Scroll className="w-4 h-4" />
              </span>
              <span className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">
                Schemes
              </span>
              <span className="text-xs font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40">
                {filteredSchemes.length} Cards
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-xs hidden sm:inline text-slate-500">
                {collapsedSections.scheme ? 'Expand section' : 'Collapse section'}
              </span>
              {collapsedSections.scheme ? (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-amber-400" />
              )}
            </div>
          </button>

          {!collapsedSections.scheme && (
            <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/60 mt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                {filteredSchemes.map((scheme) => {
                  const expName = expansionMap.get(scheme.expansion) || scheme.expansion;
                  const keywords = getCardKeywords(scheme);

                  return (
                    <div
                      key={scheme.id}
                      className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/50 transition-all shadow-md group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/80 text-amber-400 border border-amber-800/40">
                              Scheme
                            </span>
                            <DifficultyBadge difficulty={scheme.difficulty} />
                            <span className="text-xs font-semibold text-amber-400">
                              {scheme.twists} Twists
                            </span>
                            {scheme.cards && scheme.cards.length > 1 && (
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                                {scheme.cards.length}-Sided
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 capitalize">{expName}</span>
                        </div>

                        {/* Name */}
                        <h4 className="font-extrabold text-base text-slate-100 mb-2">
                          <button
                            onClick={(e) => openGroupModal(e, scheme.name, expName, (scheme as any).cards)}
                            className="hover:text-amber-400 transition-colors text-left cursor-pointer group-hover:text-amber-300"
                          >
                            {scheme.name}
                          </button>
                        </h4>

                        {/* Description with Keywords */}
                        {keywords.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                            {keywords.map((kw) => (
                              <KeywordBadge key={kw} keyword={kw} />
                            ))}
                          </div>
                        )}

                        {/* Setup Rule Preview */}
                        {scheme.setupRule && (
                          <div className="mt-1 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
                            <RichRulesText text={scheme.setupRule} className="line-clamp-3" />
                          </div>
                        )}

                        {/* Evil Wins Preview */}
                        {scheme.evilWins && (
                          <div className="mt-1.5 p-2 rounded-lg bg-red-950/20 border border-red-900/30 text-xs">
                            <RichRulesText text={scheme.evilWins} className="line-clamp-2" />
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {scheme.cards && scheme.cards.length > 1 ? `${scheme.cards.length} Scheme Cards` : '1 Scheme Card'}
                        </span>
                        <button
                          onClick={(e) => openGroupModal(e, scheme.name, expName, (scheme as any).cards)}
                          className="text-xs text-amber-400 hover:text-amber-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Card & Rules</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: HEROES */}
      {(activeCategory === 'all' || activeCategory === 'hero') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all">
          <button
            onClick={() => toggleSection('hero')}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-850/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                <UserCheck className="w-4 h-4" />
              </span>
              <span className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">
                Heroes
              </span>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-800/40">
                {filteredHeroes.length} Heroes
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-xs hidden sm:inline text-slate-500">
                {collapsedSections.hero ? 'Expand section' : 'Collapse section'}
              </span>
              {collapsedSections.hero ? (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-amber-400" />
              )}
            </div>
          </button>

          {!collapsedSections.hero && (
            <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/60 mt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                {filteredHeroes.map((hero) => {
                  const expName = expansionMap.get(hero.expansion) || hero.expansion;
                  const keywords = getCardKeywords(hero);

                  return (
                    <div
                      key={hero.id}
                      className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <TeamBadge team={hero.team} />
                          <span className="text-[11px] text-slate-400 capitalize">{expName}</span>
                        </div>

                        {/* Name condensed */}
                        <h4 className="font-extrabold text-base text-slate-100 mb-0.5">
                          <button onClick={(e) => openGroupModal(e, hero.name, expName, (hero as any).cards)} className="hover:text-indigo-400 hover:underline transition-colors text-left cursor-pointer">
                            {hero.name}
                          </button>
                        </h4>
                        {hero.realName && (
                          <p className="text-xs text-slate-400 italic mb-2">
                            {hero.realName}
                          </p>
                        )}

                        {/* Classes */}
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          {hero.classes.map((cls) => (
                            <ClassBadge key={cls} heroClass={cls} showLabel />
                          ))}
                        </div>

                        {/* Description with Keywords */}
                        {keywords.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {keywords.map((kw) => (
                              <KeywordBadge key={kw} keyword={kw} />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                        14 Cards (1 Rare, 3 Uncommons, 10 Commons)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: VILLAINS & HENCHMEN IN THE SAME GROUP */}
      {(activeCategory === 'all' || activeCategory === 'villains_and_henchmen') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all">
          <button
            onClick={() => toggleSection('villains_and_henchmen')}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-850/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-800/50">
                <Swords className="w-4 h-4" />
              </span>
              <span className="font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] text-sm sm:text-base">
                Villains & Henchmen
              </span>
              <span className="text-xs font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-800/40">
                {filteredVillainsAndHenchmen.length} Groups
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-xs hidden sm:inline text-slate-500">
                {collapsedSections.villains_and_henchmen ? 'Expand section' : 'Collapse section'}
              </span>
              {collapsedSections.villains_and_henchmen ? (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-amber-400" />
              )}
            </div>
          </button>

          {!collapsedSections.villains_and_henchmen && (
            <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/60 mt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                {filteredVillainsAndHenchmen.map(({ subType, data }) => {
                  const expName = expansionMap.get(data.expansion) || data.expansion;
                  const keywords = getCardKeywords(data);

                  return (
                    <div
                      key={data.id}
                      className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-red-500/40 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              subType === 'villain'
                                ? 'bg-red-950/80 text-red-400 border-red-800/40'
                                : 'bg-amber-950/80 text-amber-400 border-amber-800/40'
                            }`}
                          >
                            {subType === 'villain' ? 'Villain Group' : 'Henchman Group'}
                          </span>
                          <span className="text-[11px] text-slate-400 capitalize">{expName}</span>
                        </div>

                        {/* Name condensed */}
                        <h4 className="font-extrabold text-base text-slate-100 mb-2">
                          <button onClick={(e) => openGroupModal(e, data.name, expName, (data as any).cards)} className="hover:text-indigo-400 hover:underline transition-colors text-left cursor-pointer">
                            {data.name}
                          </button>
                        </h4>

                        {/* Description with Keywords */}
                        {(keywords.length > 0 || (data.ledBy && data.ledBy.length > 0)) && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {keywords.map((kw) => (
                              <KeywordBadge key={kw} keyword={kw} />
                            ))}
                            {data.ledBy && data.ledBy.length > 0 && (
                              <span className="text-[11px] font-semibold text-amber-300/90 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-700/40">
                                Led by: {data.ledBy.join(', ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                        {subType === 'villain' ? '8 Cards per Group' : '10 Cards per Group'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Symbol Library Modal */}
      <SymbolLibraryModal
        isOpen={isSymbolModalOpen}
        onClose={() => setIsSymbolModalOpen(false)}
      />
    </div>
  );
};
