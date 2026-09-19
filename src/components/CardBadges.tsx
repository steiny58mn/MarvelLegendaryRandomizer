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
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-sm ${sym.badgeBg} ${sym.badgeBorder} text-slate-100 ${className}`}
      >
        {showIcon && (
          <span className="inline-flex items-center justify-center shrink-0">
            <SymbolIcon symbol={sym.id} size={iconSize} showTooltip={false} inline={false} className="!bg-transparent !p-0 !border-0 !shadow-none !ring-0" />
          </span>
        )}
        <span>{sym.name}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border bg-zinc-850 text-zinc-200 border-zinc-700 ${className}`}
    >
      {team}
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-sm ${sym.badgeBg} ${sym.badgeBorder} text-slate-100`}
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border font-medium text-zinc-300 bg-zinc-900/80 border-zinc-700/60"
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
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40';
      case 'Moderate':
        return 'bg-amber-950/70 text-amber-300 border-amber-500/40';
      case 'Hard':
        return 'bg-rose-950/70 text-rose-300 border-rose-500/40';
      case 'Extreme':
        return 'bg-purple-950/70 text-purple-300 border-purple-500/40 ring-1 ring-purple-500/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-semibold border uppercase tracking-wider ${getColor()}`}
    >
      {difficulty}
    </span>
  );
};
