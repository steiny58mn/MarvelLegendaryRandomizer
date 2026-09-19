import React, { useState } from 'react';
import { X, Layers, AlertCircle, Image as ImageIcon, ChevronDown, ChevronUp, Loader2, Languages, Scroll, Skull, Swords, Users } from 'lucide-react';
import { GAME_KEYWORDS, getKeywordRule } from '../data/keywords';
import { KeywordBadge } from './KeywordBadge';
import { ClassBadge, CLASS_NAMES, extractCardClasses } from './CardBadges';
import { CardDetail } from '../types';
import { useData } from '../contexts/DataContext';
import { RichRulesText } from './symbols/RichRulesText';
import { SymbolIcon } from './symbols/SymbolIcon';
import { getOptimizedImageUrl, prefetchImageUrl, isImagePrecached } from '../utils/imageOptimizer';
import { parseSplitCard } from '../utils/splitCardParser';
import { SplitCardItem } from './SplitCardItem';
import { hasVillainsTerminology } from '../utils/terminologyTranslator';

interface CardGroupModalProps {
  title: string;
  subtitle?: string;
  cards?: CardDetail[];
  cardType?: 'scheme' | 'mastermind' | 'villain' | 'henchman' | 'hero' | string | null;
  isOpen: boolean;
  onClose: () => void;
}

const IGNORED_KEYWORDS: string[] = [
  'Ambush',
  'Fight',
  'Escape',
  'Rescue',
  'Strike',
  'Master Strike',
  'Command Strike',
  'Scheme Twist',
  'Plot Twist',
  'Wound',
  'Bribe',
  'Bystander Rescue'
];

function extractKeywords(text?: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  
  // Ignore dialogue quotes ending with exclamation marks (e.g., “NUL SMASH!“, "HULK SMASH!") to prevent flavor text from matching keywords
  const searchableText = text.replace(/[“"][^”"\n]*?[!][”"]/g, ' ');

  for (const kw of GAME_KEYWORDS) {
    if (IGNORED_KEYWORDS.includes(kw.name)) continue;
    
    let matched = false;
    
    // Check matchPattern if provided
    if (kw.matchPattern) {
      try {
        const regex = new RegExp(kw.matchPattern, 'i');
        if (regex.test(searchableText)) {
          matched = true;
        }
      } catch {
        // fallback
      }
    } else {
      // Check primary name
      const nameRegex = new RegExp(`\\b${kw.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (nameRegex.test(searchableText)) matched = true;
      
      // Check aliases
      if (!matched && kw.aliases) {
        for (const alias of kw.aliases) {
          const aliasRegex = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
          if (aliasRegex.test(searchableText)) {
            matched = true;
            break;
          }
        }
      }
    }

    if (matched) {
      found.add(kw.name);
    }
  }

  return Array.from(found).filter((kw: string) => !getKeywordRule(kw).includes('thematic tag'));
}

const ModalCardItem: React.FC<{ card: any; idx: number; groupExpansion?: string }> = ({ card, idx, groupExpansion }) => {
  const { translateVillainsTerms } = useData();
  const [showImage, setShowImage] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [perCardTranslate, setPerCardTranslate] = useState<boolean | null>(null);

  const isEligibleForTranslation = hasVillainsTerminology(
    card.rulesText || card.text,
    card.abilities,
    card.expansion || groupExpansion
  );

  const effectiveTranslate = perCardTranslate !== null ? perCardTranslate : translateVillainsTerms;

  const optimizedUrl = getOptimizedImageUrl(card.imageUrl, 540, 75);
  const [isLoaded, setIsLoaded] = useState(() => isImagePrecached(card.imageUrl, 540, 75));
  const kws: string[] = card.keywords || [];
  const cardClasses: string[] = extractCardClasses(card);

  const preloadImage = () => {
    prefetchImageUrl(card.imageUrl, 540, 75);
  };

  const hasVal = (val: any) =>
    val !== undefined &&
    val !== null &&
    val !== '' &&
    val !== false &&
    String(val).trim() !== '' &&
    String(val).trim() !== 'null';

  const isHero =
    card.groupType === 'hero' ||
    Boolean(card.heroClass) ||
    Boolean(card.hc) ||
    hasVal(card.cost) ||
    hasVal(card.recruit);

  const isScheme =
    !isHero &&
    (card.groupType === 'scheme' ||
      Boolean(card.scheme) ||
      Boolean(card.twists) ||
      Boolean(card.setupRule));

  const isAdversary =
    !isHero &&
    (card.groupType === 'mastermind' ||
      card.groupType === 'villain' ||
      card.groupType === 'henchman' ||
      Boolean(card.tactic) ||
      Boolean(card.epic));

  const showCost = !isScheme && !isAdversary && hasVal(card.cost);
  const showRecruit = !isScheme && !isAdversary && hasVal(card.recruit);
  const showAttack = !isScheme && hasVal(card.attack);

  return (
    <div key={idx} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 sm:p-4 flex flex-col gap-2.5 select-text">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/50 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-bold text-slate-200 text-base sm:text-lg">{card.name}</h4>
          {cardClasses.map((cls: string, cIdx: number) => (
            <ClassBadge key={cIdx} heroClass={cls} showLabel={false} />
          ))}
          {card.transformed && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
              Transformed Side
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold flex-wrap">
          {showCost && (
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-slate-900/90 via-zinc-900/90 to-slate-900/90 text-slate-200 border border-slate-500/50 ring-1 ring-white/10 backdrop-blur-md shadow-sm inline-flex items-center gap-1.5 font-bold">
              <SymbolIcon symbol="cost" size="sm" /> <span>{card.cost}</span>
            </span>
          )}
          {showRecruit && (
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-950/90 via-yellow-950/80 to-amber-900/90 text-amber-300 border border-amber-500/50 ring-1 ring-white/10 backdrop-blur-md shadow-sm inline-flex items-center gap-1.5 font-bold">
              <SymbolIcon symbol="recruit" size="sm" /> <span>{card.recruit}</span>
            </span>
          )}
          {showAttack && (
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-950/90 via-rose-950/80 to-red-900/90 text-red-300 border border-red-500/50 ring-1 ring-white/10 backdrop-blur-md shadow-sm inline-flex items-center gap-1.5 font-bold">
              <SymbolIcon symbol="attack" size="sm" /> <span>{card.attack}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/* Keywords and Per-Card Translation Button */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
          {kws.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {kws.map((kw: string) => (
                <KeywordBadge key={kw} keyword={kw} />
              ))}
            </div>
          ) : <div />}

          {isEligibleForTranslation && (
            <button
              id={`toggle-translate-card-${idx}`}
              type="button"
              onClick={() => setPerCardTranslate(!effectiveTranslate)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                effectiveTranslate
                  ? 'bg-amber-950/80 text-amber-300 border-amber-600/60 hover:bg-amber-900/80'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
              }`}
              title="Toggle Villains <-> Standard Base Terminology translation for this card"
            >
              <Languages className="w-3 h-3" />
              <span>{effectiveTranslate ? 'Translated Terms' : 'Original Terms'}</span>
            </button>
          )}
        </div>

        {card.rulesText || (card.abilities && card.abilities.length > 0) ? (
          <RichRulesText
            text={card.rulesText}
            abilities={card.abilities}
            translated={effectiveTranslate}
          />
        ) : kws.length > 0 ? null : (
          <div className="text-slate-600 text-xs sm:text-sm italic">No rules text</div>
        )}

        {card.imageUrl && (
          <div className="mt-1 pt-2 border-t border-slate-700/40 flex flex-col gap-2 select-none">
            <button
              type="button"
              onMouseEnter={preloadImage}
              onTouchStart={preloadImage}
              onClick={() => {
                setShowImage(!showImage);
                if (imgError) {
                  setImgError(false);
                  setIsLoaded(false);
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold self-start py-1 px-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer select-none"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{showImage ? 'Hide Card Artwork' : 'View Card Artwork'}</span>
              {showImage ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showImage && (
              <div 
                className="relative rounded-2xl overflow-hidden border border-slate-700 w-full max-w-sm sm:max-w-md mx-auto shadow-2xl bg-slate-950 mt-2 p-2 aspect-[5/7] flex items-center justify-center select-none cursor-default"
                tabIndex={-1}
                onMouseDown={(e) => {
                  if ((e.target as HTMLElement).tagName !== 'A') {
                    e.preventDefault();
                  }
                }}
              >
                {!isLoaded && !imgError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95 z-10 select-none p-4 text-center">
                    <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                    <span className="text-xs text-slate-300 font-medium tracking-wide">Loading card artwork...</span>
                  </div>
                )}
                {imgError ? (
                  <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-3 select-none">
                    <ImageIcon className="w-10 h-10 text-slate-600" />
                    <p className="text-sm font-medium text-slate-300">Card artwork preview unavailable</p>
                    <a
                      href={card.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-300 hover:text-amber-200 underline font-medium inline-flex items-center gap-1.5 bg-amber-950/50 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs cursor-pointer select-auto shadow-md"
                    >
                      Open full artwork scan in new tab ↗
                    </a>
                  </div>
                ) : (
                  <img
                    src={optimizedUrl}
                    alt={card.name}
                    referrerPolicy="no-referrer"
                    decoding="async"
                    loading="eager"
                    onLoad={() => setIsLoaded(true)}
                    onError={(e) => {
                      const target = e.currentTarget;
                      const step = parseInt(target.dataset.fallbackStep || '0', 10);
                      if (step === 0) {
                        target.dataset.fallbackStep = '1';
                        target.src = `https://wsrv.nl/?url=${encodeURIComponent(card.imageUrl!)}&w=540&q=75&output=webp`;
                      } else if (step === 1) {
                        target.dataset.fallbackStep = '2';
                        target.src = `/api/card-image?url=${encodeURIComponent(card.imageUrl!)}`;
                      } else if (step === 2) {
                        target.dataset.fallbackStep = '3';
                        target.src = card.imageUrl!;
                      } else {
                        setImgError(true);
                      }
                    }}
                    className={`w-full h-full object-contain rounded-xl transition-opacity duration-150 select-none pointer-events-none ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const CardGroupModal: React.FC<CardGroupModalProps> = ({ title, subtitle, cards: propCards, cardType, isOpen, onClose }) => {
  const data = useData() || {};
  const expansions = data.expansions || [];
  const heroes = data.heroes || [];
  const villains = data.villains || [];
  const henchmen = data.henchmen || [];
  const masterminds = data.masterminds || [];
  const schemes = data.schemes || [];

  const normSub = (subtitle || '').trim().toLowerCase();
  const foundExp = React.useMemo(() => {
    if (!subtitle) return null;
    return expansions.find(
      e => e.id.toLowerCase() === normSub || e.name.toLowerCase() === normSub
    );
  }, [subtitle, expansions]);

  const displaySubtitle = React.useMemo(() => {
    if (!subtitle) return '';
    if (foundExp) return foundExp.name;
    if (subtitle.includes('-') && subtitle === subtitle.toLowerCase()) {
      return subtitle
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
    }
    return subtitle;
  }, [subtitle, foundExp]);

  const matchingHero = React.useMemo(() => {
    const normTitle = (title || '').trim().toLowerCase();
    const targetExpId = foundExp ? foundExp.id.toLowerCase() : normSub;
    if (targetExpId) {
      const expMatch = heroes.find(h => h.name.trim().toLowerCase() === normTitle && (h.expansion || '').toLowerCase() === targetExpId);
      if (expMatch) return expMatch;
    }
    return heroes.find(h => h.name.trim().toLowerCase() === normTitle);
  }, [title, heroes, foundExp, normSub]);

  const activeCards = React.useMemo(() => {
    const normTitle = (title || '').trim().toLowerCase();
    const targetExpId = foundExp ? foundExp.id.toLowerCase() : normSub;

    let liveGroup: any = null;
    if (targetExpId) {
      liveGroup = 
        heroes.find(h => h.name.trim().toLowerCase() === normTitle && (h.expansion || '').toLowerCase() === targetExpId) ||
        villains.find(v => v.name.trim().toLowerCase() === normTitle && (v.expansion || '').toLowerCase() === targetExpId) ||
        henchmen.find(h => h.name.trim().toLowerCase() === normTitle && (h.expansion || '').toLowerCase() === targetExpId) ||
        masterminds.find(m => m.name.trim().toLowerCase() === normTitle && (m.expansion || '').toLowerCase() === targetExpId) ||
        schemes.find(s => s.name.trim().toLowerCase() === normTitle && (s.expansion || '').toLowerCase() === targetExpId);
    }

    if (!liveGroup) {
      liveGroup = 
        heroes.find(h => h.name.trim().toLowerCase() === normTitle) ||
        villains.find(v => v.name.trim().toLowerCase() === normTitle) ||
        henchmen.find(h => h.name.trim().toLowerCase() === normTitle) ||
        masterminds.find(m => m.name.trim().toLowerCase() === normTitle) ||
        schemes.find(s => s.name.trim().toLowerCase() === normTitle);
    }

    const groupType: 'hero' | 'villain' | 'henchman' | 'mastermind' | 'scheme' | null = (() => {
      if (schemes.some(s => s.name.trim().toLowerCase() === normTitle && (!targetExpId || (s.expansion || '').toLowerCase() === targetExpId))) {
        return 'scheme';
      }
      if (masterminds.some(m => m.name.trim().toLowerCase() === normTitle && (!targetExpId || (m.expansion || '').toLowerCase() === targetExpId))) {
        return 'mastermind';
      }
      if (villains.some(v => v.name.trim().toLowerCase() === normTitle && (!targetExpId || (v.expansion || '').toLowerCase() === targetExpId))) {
        return 'villain';
      }
      if (henchmen.some(h => h.name.trim().toLowerCase() === normTitle && (!targetExpId || (h.expansion || '').toLowerCase() === targetExpId))) {
        return 'henchman';
      }
      if (heroes.some(h => h.name.trim().toLowerCase() === normTitle && (!targetExpId || (h.expansion || '').toLowerCase() === targetExpId))) {
        return 'hero';
      }
      if (schemes.some(s => s.name.trim().toLowerCase() === normTitle)) return 'scheme';
      if (masterminds.some(m => m.name.trim().toLowerCase() === normTitle)) return 'mastermind';
      if (villains.some(v => v.name.trim().toLowerCase() === normTitle)) return 'villain';
      if (henchmen.some(h => h.name.trim().toLowerCase() === normTitle)) return 'henchman';
      if (heroes.some(h => h.name.trim().toLowerCase() === normTitle)) return 'hero';
      return null;
    })();

    const sourceCards = (liveGroup && liveGroup.cards && liveGroup.cards.length > 0)
      ? liveGroup.cards
      : (propCards || []);

    return sourceCards.map((card: any) => {
      const rawRulesText = card.rulesText || '';
      let lines = rawRulesText.split('\n').filter((l: string) => !/^\s*={2,}\s*[^=]+\s*={2,}\s*$/.test(l.trim()));
      lines = lines.map((line: string) => {
        line = line.replace(/\[url=[^\]]*\](.*?)\[\/url\]/gi, '$1');
        line = line.replace(/\[\/?url[^\]]*\]/gi, '');
        line = line.replace(/\[\/?(BGCOLOR|COLOR)[^\]]*\]/gi, '');
        line = line.replace(/\[\/?(b|i)\]/gi, '');
        line = line.replace(/\s*={2,}\s*[^=]+\s*={2,}\s*/g, '');
        return line;
      });

      let heroClass = card.heroClass || card.hc || '';
      if (heroClass) {
        heroClass = heroClass.replace(/\[\/?(BGCOLOR|COLOR|b|i)[^\]]*\]/gi, '').trim().replace(/\s*,\s*/g, ', ');
      }

      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        if (!firstLine.includes(':')) {
          const tokens = firstLine.split(/[\s,]+/).filter(Boolean);
          if (tokens.length > 0 && tokens.every((t: string) => CLASS_NAMES.includes(t))) {
            if (!heroClass) {
              heroClass = tokens.join(', ');
            } else {
              tokens.forEach((t: string) => {
                if (!heroClass.toLowerCase().includes(t.toLowerCase())) {
                  heroClass += `, ${t}`;
                }
              });
            }
            lines.shift();
          }
        }
      }

      const kws = extractKeywords(lines.join('\n'));
      const cleanedRulesText = lines.join('\n').trim().replace(/\n{3,}/g, '\n\n');

      return {
        ...card,
        rulesText: cleanedRulesText,
        keywords: kws,
        heroClass,
        groupType: card.groupType || groupType,
        expansion: card.expansion || liveGroup?.expansion || (foundExp ? foundExp.id : undefined)
      };
    });
  }, [title, propCards, heroes, villains, henchmen, masterminds, schemes, foundExp, normSub]);

  // Determine category type for matching icon and modal colors
  const effectiveType = React.useMemo<'scheme' | 'mastermind' | 'villain' | 'henchman' | 'hero' | 'default'>(() => {
    if (cardType) {
      const lower = cardType.toLowerCase();
      if (lower.includes('scheme')) return 'scheme';
      if (lower.includes('mastermind')) return 'mastermind';
      if (lower.includes('villain')) return 'villain';
      if (lower.includes('henchman')) return 'henchman';
      if (lower.includes('hero')) return 'hero';
    }

    const normTitle = (title || '').trim().toLowerCase();
    const targetExpId = foundExp ? foundExp.id.toLowerCase() : normSub;

    if (schemes.some(s => s.name.trim().toLowerCase() === normTitle && (!targetExpId || (s.expansion || '').toLowerCase() === targetExpId))) return 'scheme';
    if (masterminds.some(m => m.name.trim().toLowerCase() === normTitle && (!targetExpId || (m.expansion || '').toLowerCase() === targetExpId))) return 'mastermind';
    if (villains.some(v => v.name.trim().toLowerCase() === normTitle && (!targetExpId || (v.expansion || '').toLowerCase() === targetExpId))) return 'villain';
    if (henchmen.some(h => h.name.trim().toLowerCase() === normTitle && (!targetExpId || (h.expansion || '').toLowerCase() === targetExpId))) return 'henchman';
    if (heroes.some(h => h.name.trim().toLowerCase() === normTitle && (!targetExpId || (h.expansion || '').toLowerCase() === targetExpId))) return 'hero';

    if (schemes.some(s => s.name.trim().toLowerCase() === normTitle)) return 'scheme';
    if (masterminds.some(m => m.name.trim().toLowerCase() === normTitle)) return 'mastermind';
    if (villains.some(v => v.name.trim().toLowerCase() === normTitle)) return 'villain';
    if (henchmen.some(h => h.name.trim().toLowerCase() === normTitle)) return 'henchman';
    if (heroes.some(h => h.name.trim().toLowerCase() === normTitle)) return 'hero';
    if (matchingHero) return 'hero';

    if (activeCards && activeCards.length > 0) {
      for (const card of activeCards) {
        if (card.groupType) {
          const gt = String(card.groupType).toLowerCase();
          if (gt.includes('scheme')) return 'scheme';
          if (gt.includes('mastermind')) return 'mastermind';
          if (gt.includes('villain')) return 'villain';
          if (gt.includes('henchman')) return 'henchman';
          if (gt.includes('hero')) return 'hero';
        }
        if (card.scheme || card.twists || card.setupRule) return 'scheme';
        if (card.tactic || card.masterStrikeText || card.vps) return 'mastermind';
        if (card.cost || card.recruit || card.heroClass || card.hc) return 'hero';
      }
    }
    return 'default';
  }, [cardType, title, foundExp, normSub, schemes, masterminds, villains, henchmen, heroes, matchingHero, activeCards]);

  const theme = React.useMemo(() => {
    switch (effectiveType) {
      case 'scheme':
        return {
          containerBorder: 'border-amber-500/50',
          containerRing: 'ring-1 ring-amber-500/25 shadow-amber-950/40',
          headerBg: 'bg-gradient-to-r from-amber-950/95 via-yellow-950/95 to-amber-900/90',
          headerBorder: 'border-b border-amber-500/35',
          subtitleColor: 'text-amber-200/85',
          closeBtn: 'text-amber-300 hover:text-white hover:bg-amber-900/60',
          renderIcon: () => <Scroll className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        };
      case 'mastermind':
        return {
          containerBorder: 'border-stone-800/80',
          containerRing: 'ring-1 ring-zinc-700/50 shadow-2xl shadow-black',
          headerBg: 'bg-gradient-to-r from-zinc-950 via-stone-900 to-zinc-900',
          headerBorder: 'border-b border-stone-800/80',
          subtitleColor: 'text-stone-300',
          closeBtn: 'text-stone-400 hover:text-white hover:bg-stone-800/80',
          renderIcon: () => <Skull className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        };
      case 'villain':
        return {
          containerBorder: 'border-red-600/70',
          containerRing: 'ring-1 ring-red-500/35 shadow-2xl shadow-red-950/70',
          headerBg: 'bg-gradient-to-r from-red-950 via-zinc-950 to-red-950',
          headerBorder: 'border-b border-red-500/40',
          subtitleColor: 'text-red-200/90',
          closeBtn: 'text-red-400 hover:text-white hover:bg-red-900/60',
          renderIcon: () => <Swords className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        };
      case 'henchman':
        return {
          containerBorder: 'border-sky-400/60',
          containerRing: 'ring-1 ring-sky-400/30 shadow-2xl shadow-sky-950/60',
          headerBg: 'bg-gradient-to-r from-sky-950 via-blue-900/80 to-cyan-950',
          headerBorder: 'border-b border-sky-400/40',
          subtitleColor: 'text-sky-200/90',
          closeBtn: 'text-sky-300 hover:text-white hover:bg-sky-900/60',
          renderIcon: () => <Swords className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        };
      case 'hero':
        return {
          containerBorder: 'border-cyan-500/50',
          containerRing: 'ring-1 ring-cyan-500/25 shadow-cyan-950/40',
          headerBg: 'bg-gradient-to-r from-cyan-950/95 via-sky-950/95 to-cyan-900/90',
          headerBorder: 'border-b border-cyan-500/35',
          subtitleColor: 'text-cyan-200/85',
          closeBtn: 'text-cyan-300 hover:text-white hover:bg-cyan-900/60',
          renderIcon: () => matchingHero && matchingHero.team ? (
            <span className="inline-flex items-center justify-center shrink-0">
              <SymbolIcon symbol={matchingHero.team} size="3xl" showTooltip={false} inline={false} className="!bg-transparent !p-0 !border-0 !shadow-none !ring-0 block" />
            </span>
          ) : (
            <Users className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          )
        };
      default:
        return {
          containerBorder: 'border-purple-500/40',
          containerRing: 'ring-1 ring-white/10',
          headerBg: 'bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90',
          headerBorder: 'border-b border-purple-500/30',
          subtitleColor: 'text-purple-200/80',
          closeBtn: 'text-purple-300 hover:text-white hover:bg-purple-900/60',
          renderIcon: () => <Layers className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        };
    }
  }, [effectiveType, matchingHero]);

  React.useEffect(() => {
    if (isOpen && activeCards && activeCards.length > 0) {
      activeCards.forEach((c: any) => {
        if (c.imageUrl) {
          prefetchImageUrl(c.imageUrl, 540, 75);
        }
      });
    }
  }, [isOpen, activeCards]);

  if (!isOpen) return null;

  return (
    <div id="card-group-modal-backdrop" className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        id="card-group-modal-content"
        className={`bg-slate-900/95 border ${theme.containerBorder} rounded-2xl w-full max-w-2xl max-h-[88vh] sm:max-h-[85vh] shadow-2xl flex flex-col relative overflow-hidden ${theme.containerRing} backdrop-blur-md my-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-4 ${theme.headerBorder} ${theme.headerBg} flex items-start justify-between shrink-0 gap-3`}>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-lg sm:text-xl font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2.5 font-['Cinzel']">
              {theme.renderIcon()}
              <span className="break-words leading-tight">{title}</span>
            </h3>
            {displaySubtitle && <p className={`text-xs sm:text-sm ${theme.subtitleColor} mt-1 break-words font-sans`}>{displaySubtitle}</p>}
          </div>
          <button
            id="close-card-group-modal-btn"
            onClick={onClose}
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl ${theme.closeBtn} active:scale-95 transition-all shrink-0 touch-manipulation cursor-pointer`}
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-3.5 sm:p-5 overflow-y-auto bg-slate-900/90 flex-1 overscroll-contain">
          {!activeCards || activeCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 text-slate-500">
              <AlertCircle className="w-12 h-12 mb-3 text-slate-700" />
              <p className="text-slate-400 text-lg">No card details available.</p>
              <p className="text-sm mt-2 max-w-sm">Individual rules text data has not been entered for this group yet.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {activeCards.map((card: any, idx: number) => {
                const splitData = parseSplitCard(card);
                if (splitData) {
                  return <SplitCardItem key={idx} card={card} idx={idx} splitData={splitData} />;
                }
                return <ModalCardItem key={idx} card={card} idx={idx} groupExpansion={foundExp?.id} />;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
