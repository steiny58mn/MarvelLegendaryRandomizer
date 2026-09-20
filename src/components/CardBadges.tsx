import React from 'react';
import { TeamAffiliation, HeroClass } from '../types';
import { SymbolIcon } from './symbols/SymbolIcon';
import { findSymbol, getSymbolTextColor } from './symbols/symbolDefinitions';

export const CLASS_NAMES = ['Instinct', 'Strength', 'Ranged', 'Tech', 'Covert'];

const HC_NUM_TO_CLASS: Record<number, string> = {
  1: 'covert',
  2: 'instinct',
  3: 'ranged',
  4: 'strength',
  5: 'tech',
};

const CLASS_CANONICAL_LOWER: Record<string, string> = {
  covert: 'covert',
  rogue: 'covert',
  instinct: 'instinct',
  ranged: 'ranged',
  energy: 'ranged',
  strength: 'strength',
  tech: 'tech',
};

/**
 * Extracts all class symbols / superpower triggers referenced in the card's rules text and abilities JSON.
 * Returns normalized lowercase class names: 'covert', 'instinct', 'ranged', 'strength', 'tech'.
 */
export function extractReferencedClasses(item: any): Set<string> {
  const referenced = new Set<string>();
  if (!item) return referenced;

  const checkText = (text: string) => {
    if (!text || typeof text !== 'string') return;

    // 1. Bracket tokens: [Covert], [Rogue], [Instinct], [Ranged], [Strength], [Tech], [hc:1], [hc:5], etc.
    const bracketRegex = /\[(covert|rogue|instinct|ranged|energy|strength|tech|hc:?[1-5])\]/gi;
    let match;
    while ((match = bracketRegex.exec(text)) !== null) {
      const token = match[1].toLowerCase();
      if (token.startsWith('hc')) {
        const num = parseInt(token.replace(/\D/g, ''), 10);
        if (HC_NUM_TO_CLASS[num]) referenced.add(HC_NUM_TO_CLASS[num]);
      } else if (CLASS_CANONICAL_LOWER[token]) {
        referenced.add(CLASS_CANONICAL_LOWER[token]);
      }
    }

    // 2. Superpower trigger prefixes: "Tech:", "Covert:", "Rogue:", "Instinct:", "Ranged:", "Strength:"
    const triggerRegex = /\b(covert|rogue|instinct|ranged|strength|tech)\s*:(?!\s*\d)/gi;
    while ((match = triggerRegex.exec(text)) !== null) {
      const cls = match[1].toLowerCase();
      if (CLASS_CANONICAL_LOWER[cls]) referenced.add(CLASS_CANONICAL_LOWER[cls]);
    }

    // 3. Conditional / synergy phrases:
    const phraseRegex = /\b(?:played|have|with|another|any|each|extra|bonus|discard\s+a)\s+(?:a\s+|an\s+|another\s+)?(covert|rogue|instinct|ranged|strength|tech)\b/gi;
    while ((match = phraseRegex.exec(text)) !== null) {
      const cls = match[1].toLowerCase();
      if (CLASS_CANONICAL_LOWER[cls]) referenced.add(CLASS_CANONICAL_LOWER[cls]);
    }
  };

  const traverseAbilities = (obj: any) => {
    if (!obj) return;
    if (typeof obj === 'string') {
      checkText(obj);
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach(traverseAbilities);
      return;
    }
    if (typeof obj === 'object') {
      if (obj.hc !== undefined) {
        const num = typeof obj.hc === 'number' ? obj.hc : parseInt(String(obj.hc).replace(/\D/g, ''), 10);
        if (HC_NUM_TO_CLASS[num]) referenced.add(HC_NUM_TO_CLASS[num]);
      }
      if (typeof obj.icon === 'string') {
        const ic = obj.icon.toLowerCase();
        if (CLASS_CANONICAL_LOWER[ic]) referenced.add(CLASS_CANONICAL_LOWER[ic]);
        if (ic.startsWith('hc')) {
          const num = parseInt(ic.replace(/\D/g, ''), 10);
          if (HC_NUM_TO_CLASS[num]) referenced.add(HC_NUM_TO_CLASS[num]);
        }
      }
      if (typeof obj.bold === 'string') checkText(obj.bold);
      if (typeof obj.text === 'string') checkText(obj.text);
      if (typeof obj.italic === 'string') checkText(obj.italic);
      if (obj.points) traverseAbilities(obj.points);
    }
  };

  // If hero with subcards
  if (Array.isArray(item.cards)) {
    item.cards.forEach((sub: any) => {
      if (sub.rulesText) checkText(sub.rulesText);
      if (sub.abilities) traverseAbilities(sub.abilities);
    });
  }

  if (item.rulesText) checkText(item.rulesText);
  if (item.abilities) traverseAbilities(item.abilities);
  if (item.cardsDescription) checkText(item.cardsDescription);

  return referenced;
}

/**
 * Extracts all classes provided by a hero (from top-level classes and all subcards).
 * Returns normalized lowercase class names: 'covert', 'instinct', 'ranged', 'strength', 'tech'.
 */
export function extractHeroProvidedClasses(hero: any): Set<string> {
  const provided = new Set<string>();
  if (!hero) return provided;

  extractCardClasses(hero).forEach((c) => {
    const norm = c.trim().toLowerCase();
    if (norm) provided.add(norm);
  });

  if (Array.isArray(hero.classes)) {
    hero.classes.forEach((c: string) => {
      const norm = (c || '').trim().toLowerCase();
      if (norm) provided.add(norm);
    });
  }

  if (Array.isArray(hero.cards)) {
    hero.cards.forEach((sub: any) => {
      extractCardClasses(sub).forEach((c) => {
        const norm = c.trim().toLowerCase();
        if (norm) provided.add(norm);
      });
      if (sub.heroClass) {
        const norm = String(sub.heroClass).trim().toLowerCase();
        if (norm) provided.add(norm);
      }
    });
  }

  if (hero.heroClass) {
    const norm = String(hero.heroClass).trim().toLowerCase();
    if (norm) provided.add(norm);
  }

  return provided;
}

export function extractCardClasses(card: any): string[] {
  if (!card) return [];
  const classes: string[] = [];
  const add = (val: any) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach(add);
      return;
    }
    if (typeof val === 'string') {
      const clean = val.replace(/\[\/?(BGCOLOR|COLOR|b|i)[^\]]*\]/gi, '');
      const parts = clean.split(/[,/&+;]+/).map((s) => s.trim()).filter(Boolean);
      parts.forEach((p) => {
        const matched = CLASS_NAMES.find((c) => c.toLowerCase() === p.toLowerCase()) || p;
        if (!classes.includes(matched)) {
          classes.push(matched);
        }
      });
    }
  };

  add(card.heroClass);
  add(card.hc);
  add(card.classes);
  add(card.heroClasses);
  add(card.hc2);

  return classes;
}

/**
 * Normalizes a team name/symbol string to its canonical display name.
 */
export function normalizeTeamName(teamStr: any): string {
  if (!teamStr || typeof teamStr !== 'string') return '';
  const clean = teamStr.trim();
  if (!clean || clean.toLowerCase() === 'unaffiliated' || clean.toLowerCase() === 'none') return '';
  const sym = findSymbol(clean);
  if (sym && sym.category === 'team') {
    return sym.name;
  }
  return clean;
}

/**
 * Extracts all team affiliations / team symbols referenced in the card's rules text and abilities.
 * Returns normalized canonical team names (e.g., 'Avengers', 'S.H.I.E.L.D.', 'Spider-Friends', 'X-Men').
 */
export function extractReferencedTeams(item: any): Set<string> {
  const referenced = new Set<string>();
  if (!item) return referenced;

  const checkText = (text: string) => {
    if (!text || typeof text !== 'string') return;

    // 1. Bracket tokens: [Avengers], [S.H.I.E.L.D.], [X-Men], [team:1], etc.
    const bracketRegex = /\[([a-zA-Z0-9.\s-]+)\]/g;
    let match;
    while ((match = bracketRegex.exec(text)) !== null) {
      const token = match[1].trim();
      const sym = findSymbol(token);
      if (sym && sym.category === 'team') {
        referenced.add(sym.name);
      }
    }

    // 2. Team name trigger prefixes: "Avengers:", "S.H.I.E.L.D.:", etc.
    const triggerRegex = /\b(Avengers|S\.H\.I\.E\.L\.D\.|SHIELD|Spider-Friends|X-Men|Fantastic Four|Marvel Knights|X-Force|Guardians of the Galaxy|Inhumans|Champions|Illuminati|Cabal|HYDRA|Sinister Six|Brotherhood|Foes of Asgard|Crime Syndicate|Warbound|Venomverse)\s*:(?!\s*\d)/gi;
    while ((match = triggerRegex.exec(text)) !== null) {
      const norm = normalizeTeamName(match[1]);
      if (norm) referenced.add(norm);
    }
  };

  const traverseAbilities = (obj: any) => {
    if (!obj) return;
    if (typeof obj === 'string') {
      checkText(obj);
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach(traverseAbilities);
      return;
    }
    if (typeof obj === 'object') {
      if (obj.team) {
        const norm = normalizeTeamName(obj.team);
        if (norm) referenced.add(norm);
      }
      if (typeof obj.icon === 'string') {
        const sym = findSymbol(obj.icon);
        if (sym && sym.category === 'team') referenced.add(sym.name);
      }
      if (typeof obj.bold === 'string') checkText(obj.bold);
      if (typeof obj.text === 'string') checkText(obj.text);
      if (typeof obj.italic === 'string') checkText(obj.italic);
      if (obj.points) traverseAbilities(obj.points);
    }
  };

  if (Array.isArray(item.cards)) {
    item.cards.forEach((sub: any) => {
      if (sub.rulesText) checkText(sub.rulesText);
      if (sub.abilities) traverseAbilities(sub.abilities);
    });
  }

  if (item.rulesText) checkText(item.rulesText);
  if (item.abilities) traverseAbilities(item.abilities);
  if (item.cardsDescription) checkText(item.cardsDescription);

  return referenced;
}

/**
 * Extracts all teams provided by a hero.
 * Returns normalized canonical team names (e.g., 'Avengers', 'S.H.I.E.L.D.').
 */
export function extractHeroProvidedTeams(hero: any): Set<string> {
  const provided = new Set<string>();
  if (!hero) return provided;

  const addTeam = (val: any) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach(addTeam);
      return;
    }
    if (typeof val === 'string') {
      const clean = val.replace(/\[\/?(BGCOLOR|COLOR|b|i)[^\]]*\]/gi, '');
      const parts = clean.split(/[,/&+;]+/).map((s) => s.trim()).filter(Boolean);
      parts.forEach((p) => {
        const norm = normalizeTeamName(p);
        if (norm) provided.add(norm);
      });
    }
  };

  addTeam(hero.team);
  addTeam(hero.teams);
  addTeam(hero.teamAffiliation);

  if (Array.isArray(hero.cards)) {
    hero.cards.forEach((sub: any) => {
      addTeam(sub.team);
      addTeam(sub.teams);
    });
  }

  return provided;
}

const FALLBACK_GRADIENTS = [
  'bg-gradient-to-r from-sky-950 via-blue-900/80 to-cyan-950 border-sky-400/50 shadow-sky-950/30 text-sky-300',
  'bg-gradient-to-r from-emerald-950 via-teal-900/80 to-emerald-900 border-emerald-400/50 shadow-emerald-950/30 text-emerald-300',
  'bg-gradient-to-r from-amber-950 via-yellow-900/80 to-amber-900 border-amber-400/50 shadow-amber-950/30 text-amber-300',
  'bg-gradient-to-r from-red-950 via-rose-900/80 to-red-900 border-rose-400/50 shadow-red-950/30 text-rose-300',
  'bg-gradient-to-r from-slate-900 via-zinc-850 to-slate-900 border-slate-500/50 shadow-slate-950/30 text-slate-300',
];

function getFallbackGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FALLBACK_GRADIENTS.length;
  return FALLBACK_GRADIENTS[index];
}

export const TeamBadge: React.FC<{
  team: TeamAffiliation | string;
  className?: string;
  showIcon?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}> = ({
  team,
  className = '',
  showIcon = true,
  size = 'xs',
}) => {
  const sym = findSymbol(team);

  if (sym) {
    const iconSize = size === 'lg' ? 'xl' : size === 'md' ? 'md' : size === 'sm' ? 'sm' : 'xs';
    const textColor = getSymbolTextColor(sym);
    const padClass =
      size === 'lg' ? 'px-3 py-1.5 text-xs gap-1.5' : size === 'md' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[11px] gap-1';

    return (
      <span
        title={sym.name}
        className={`inline-flex items-center ${padClass} rounded-lg font-semibold border shadow-sm ${sym.badgeBg} ${sym.badgeBorder} ${textColor} ring-1 ring-white/10 backdrop-blur-md transition-all ${className}`}
      >
        {showIcon && (
          <span className="inline-flex items-center justify-center shrink-0">
            <SymbolIcon
              symbol={sym.id}
              size={iconSize}
              showTooltip={false}
              inline={false}
              className="!bg-transparent !p-0 !border-0 !shadow-none !ring-0"
            />
          </span>
        )}
        <span className="truncate tracking-wide">{sym.name}</span>
      </span>
    );
  }

  const fallbackStyle = getFallbackGradient(String(team || ''));
  const padClass =
    size === 'lg' ? 'px-3 py-1.5 text-xs gap-1.5' : size === 'md' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[11px] gap-1';

  return (
    <span
      className={`inline-flex items-center ${padClass} rounded-lg font-semibold border shadow-sm ring-1 ring-white/10 backdrop-blur-md ${fallbackStyle} ${className}`}
    >
      <span className="truncate tracking-wide">{team}</span>
    </span>
  );
};

export const ClassBadge: React.FC<{ heroClass: HeroClass | string; showLabel?: boolean; shortLabel?: boolean; size?: 'xs' | 'sm' | 'md' }> = ({
  heroClass,
  showLabel = false,
  shortLabel = false,
  size = 'xs',
}) => {
  const normalizedClass = (typeof heroClass === 'string' ? heroClass : '').trim();
  const sym = findSymbol(normalizedClass);

  if (sym) {
    const textColor = getSymbolTextColor(sym);
    const iconSize = size === 'md' ? 'md' : size === 'sm' ? 'sm' : 'xs';
    return (
      <span
        title={`${sym.name}: ${sym.description}`}
        className={`inline-flex items-center gap-1 ${showLabel ? 'px-2 py-0.5' : 'p-1'} rounded-lg text-[11px] font-semibold border shadow-sm ${sym.badgeBg} ${sym.badgeBorder} ${textColor} ring-1 ring-white/10 backdrop-blur-md transition-all`}
      >
        <span className="inline-flex items-center justify-center shrink-0">
          <SymbolIcon symbol={sym.id} size={iconSize} showTooltip={false} inline={false} className="!bg-transparent !p-0 !border-0 !shadow-none !ring-0" />
        </span>
        {showLabel && <span className="tracking-wide">{sym.name}</span>}
        {!showLabel && shortLabel && <span className="font-bold text-[10px] leading-none px-0.5">{sym.name.charAt(0).toUpperCase()}</span>}
      </span>
    );
  }

  return (
    <span
      title={normalizedClass || 'Class'}
      className={`inline-flex items-center gap-1 ${showLabel ? 'px-2 py-0.5' : 'p-1'} rounded-lg text-[11px] font-semibold border text-zinc-300 bg-gradient-to-r from-zinc-950/90 via-slate-900/90 to-zinc-950/90 border-zinc-700/60 ring-1 ring-white/10 backdrop-blur-md shadow-sm`}
    >
      <span className="inline-flex items-center justify-center shrink-0">
        <SymbolIcon symbol="tech" size="xs" showTooltip={false} inline={false} className="!bg-transparent !p-0 !border-0 !shadow-none !ring-0" />
      </span>
      {showLabel && <span>{normalizedClass}</span>}
    </span>
  );
};

export const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
  const getColor = () => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-gradient-to-r from-emerald-950/90 via-teal-900/80 to-emerald-950/90 text-emerald-200 border-emerald-500/50 ring-1 ring-white/10 shadow-sm shadow-emerald-950/40';
      case 'Moderate':
        return 'bg-gradient-to-r from-amber-950/90 via-yellow-900/80 to-amber-950/90 text-amber-200 border-amber-500/50 ring-1 ring-white/10 shadow-sm shadow-amber-950/40';
      case 'Hard':
        return 'bg-gradient-to-r from-orange-950/90 via-amber-900/80 to-orange-950/90 text-orange-200 border-orange-500/50 ring-1 ring-white/10 shadow-sm shadow-orange-950/40';
      case 'Extreme':
        return 'bg-gradient-to-r from-rose-950/90 via-red-900/90 to-rose-950/90 text-rose-300 border-rose-500/60 ring-1 ring-rose-400/30 shadow-md shadow-rose-950/60';
      default:
        return 'bg-gradient-to-r from-slate-900/90 via-zinc-900/90 to-slate-900/90 text-slate-300 border-slate-600/60 ring-1 ring-white/10 shadow-sm';
    }
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider backdrop-blur-sm transition-all ${getColor()}`}
    >
      {difficulty}
    </span>
  );
};
