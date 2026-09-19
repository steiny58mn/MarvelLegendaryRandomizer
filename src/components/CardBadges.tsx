import React from 'react';
import { TeamAffiliation, HeroClass } from '../types';
import { SymbolIcon } from './symbols/SymbolIcon';
import { findSymbol } from './symbols/symbolDefinitions';

export const CLASS_NAMES = ['Instinct', 'Strength', 'Ranged', 'Tech', 'Covert'];

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

const FALLBACK_GRADIENTS = [
  'bg-gradient-to-r from-sky-950 via-blue-900/80 to-cyan-950 border-sky-400/50 shadow-sky-950/30 text-sky-100',
  'bg-gradient-to-r from-emerald-950 via-teal-900/80 to-emerald-900 border-emerald-400/50 shadow-emerald-950/30 text-emerald-100',
  'bg-gradient-to-r from-amber-950 via-yellow-900/80 to-amber-900 border-amber-400/50 shadow-amber-950/30 text-amber-100',
  'bg-gradient-to-r from-red-950 via-rose-900/80 to-red-900 border-rose-400/50 shadow-red-950/30 text-rose-100',
  'bg-gradient-to-r from-slate-900 via-zinc-850 to-slate-900 border-slate-500/50 shadow-slate-950/30 text-slate-200',
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

export const TeamBadge: React.FC<{ team: TeamAffiliation | string; className?: string; showIcon?: boolean; size?: 'sm' | 'md' | 'lg' }> = ({
  team,
  className = '',
  showIcon = true,
  size = 'md',
}) => {
  const sym = findSymbol(team);

  if (sym) {
    const iconSize = size === 'lg' ? '2xl' : size === 'sm' ? 'lg' : 'xl';

    return (
      <span
        title={sym.name}
        className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-md ${sym.badgeBg} ${sym.badgeBorder} text-slate-100 ring-1 ring-white/10 backdrop-blur-sm transition-all ${className}`}
      >
        {showIcon && (
          <span className="inline-flex items-center justify-center shrink-0">
            <SymbolIcon symbol={sym.id} size={iconSize} showTooltip={false} inline={false} className="!bg-transparent !p-0 !border-0 !shadow-none !ring-0" />
          </span>
        )}
        <span className="truncate">{sym.name}</span>
      </span>
    );
  }

  const fallbackStyle = getFallbackGradient(String(team || ''));

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-md ring-1 ring-white/10 backdrop-blur-sm ${fallbackStyle} ${className}`}
    >
      <span className="truncate">{team}</span>
    </span>
  );
};

export const ClassBadge: React.FC<{ heroClass: HeroClass | string; showLabel?: boolean; shortLabel?: boolean; size?: 'xs' | 'sm' | 'md' }> = ({
  heroClass,
  showLabel = false,
  shortLabel = false,
  size = 'sm',
}) => {
  const normalizedClass = (typeof heroClass === 'string' ? heroClass : '').trim();
  const sym = findSymbol(normalizedClass);

  if (sym) {
    return (
      <span
        title={`${sym.name}: ${sym.description}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-sm ${sym.badgeBg} ${sym.badgeBorder} text-slate-100 ring-1 ring-white/10 backdrop-blur-sm`}
      >
        <SymbolIcon symbol={sym.id} size={size === 'md' ? 'md' : 'sm'} showTooltip={false} inline={false} />
        {showLabel && <span>{sym.name}</span>}
        {!showLabel && shortLabel && <span>{sym.name.charAt(0).toUpperCase()}</span>}
      </span>
    );
  }

  return (
    <span
      title={normalizedClass || 'Class'}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border text-zinc-200 bg-gradient-to-r from-zinc-950/90 via-slate-900/90 to-zinc-950/90 border-zinc-700/60 ring-1 ring-white/10 backdrop-blur-sm shadow-sm"
    >
      <SymbolIcon symbol="tech" size="sm" showTooltip={false} inline={false} />
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
        return 'bg-gradient-to-r from-rose-950/90 via-red-900/90 to-rose-950/90 text-rose-100 border-rose-500/60 ring-1 ring-rose-400/30 shadow-md shadow-rose-950/60';
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
