import React, { useState } from 'react';
import { findSymbol } from './symbolDefinitions';
import { 
  Sword, 
  Star, 
  Coins, 
  Trophy, 
  Zap, 
  Target, 
  Dumbbell, 
  Cpu, 
  Shield, 
  Flame,
  Layers
} from 'lucide-react';

export interface SymbolIconProps {
  symbol: string | number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  showTooltip?: boolean;
  inline?: boolean;
  withBackground?: boolean;
}

const SIZE_MAP = {
  xs: 'w-4 h-4 text-xs',
  sm: 'w-5 h-5 text-sm',
  md: 'w-6 h-6 text-base',
  lg: 'w-7 h-7 text-lg',
  xl: 'w-8 h-8 text-xl',
  '2xl': 'w-9 h-9 text-2xl',
  '3xl': 'w-10 h-10 text-3xl',
};

export const SymbolIcon: React.FC<SymbolIconProps> = ({
  symbol,
  size = 'sm',
  className = '',
  showTooltip = true,
  inline = true,
  withBackground = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const def = findSymbol(symbol);
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.sm;

  if (!def) {
    return <span className="font-bold text-amber-300 px-1">[{symbol}]</span>;
  }

  // Render styled badge / icon fallback for standard stats and classes or when image fails
  const renderFallbackIcon = () => {
    const id = def.id.toLowerCase();
    let iconElement = <Layers className="w-3 h-3" />;
    let badgeStyle = 'bg-slate-800 text-slate-200 border-slate-600';

    if (id === 'attack') {
      iconElement = <Sword className="w-3 h-3 text-red-400" />;
      badgeStyle = 'bg-gradient-to-r from-red-950/90 via-rose-900/80 to-red-950/90 text-red-300 border-red-500/50 shadow-red-950/40';
    } else if (id === 'recruit') {
      iconElement = <Star className="w-3 h-3 text-amber-400 fill-amber-400/40" />;
      badgeStyle = 'bg-gradient-to-r from-amber-950/90 via-yellow-900/80 to-amber-950/90 text-amber-300 border-amber-500/50 shadow-amber-950/40';
    } else if (id === 'cost') {
      iconElement = <Coins className="w-3 h-3 text-slate-300" />;
      badgeStyle = 'bg-gradient-to-r from-slate-900 via-zinc-850 to-slate-900 text-slate-200 border-slate-600/60 shadow-slate-950/30';
    } else if (id === 'vp') {
      iconElement = <Trophy className="w-3 h-3 text-amber-400" />;
      badgeStyle = 'bg-gradient-to-r from-amber-950/90 via-yellow-950/95 to-amber-900/90 text-amber-300 border-amber-500/50 shadow-amber-950/30';
    } else if (id === 'covert') {
      iconElement = <Shield className="w-3 h-3 text-red-400" />;
      badgeStyle = 'bg-gradient-to-r from-red-950/90 via-rose-950/95 to-red-900/90 text-red-300 border-red-500/50 shadow-red-950/40';
    } else if (id === 'instinct') {
      iconElement = <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400/30" />;
      badgeStyle = 'bg-gradient-to-r from-amber-950/90 via-yellow-950/95 to-amber-900/90 text-yellow-300 border-amber-500/50 shadow-amber-950/40';
    } else if (id === 'ranged') {
      iconElement = <Target className="w-3 h-3 text-blue-400" />;
      badgeStyle = 'bg-gradient-to-r from-blue-950/90 via-sky-950/95 to-blue-900/90 text-blue-300 border-blue-500/50 shadow-blue-950/40';
    } else if (id === 'strength') {
      iconElement = <Dumbbell className="w-3 h-3 text-emerald-400" />;
      badgeStyle = 'bg-gradient-to-r from-emerald-950/90 via-green-950/95 to-emerald-900/90 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40';
    } else if (id === 'tech') {
      iconElement = <Cpu className="w-3 h-3 text-cyan-300" />;
      badgeStyle = 'bg-gradient-to-r from-slate-900/90 via-zinc-850 to-slate-900/90 text-cyan-300 border-slate-500/50 shadow-slate-950/40';
    } else if (id === 'piercing') {
      iconElement = <Flame className="w-3 h-3 text-sky-400" />;
      badgeStyle = 'bg-gradient-to-r from-sky-950/90 via-cyan-900/80 to-sky-950/90 text-sky-300 border-sky-500/50 shadow-sky-950/40';
    }

    return (
      <span
        className={`inline-flex items-center justify-center p-1 rounded border text-[10px] font-bold shadow-sm ${badgeStyle}`}
        title={showTooltip ? `${def.name}: ${def.description}` : undefined}
      >
        {iconElement}
      </span>
    );
  };

  // If image load error, render gorgeous fallback badge
  if (imgError) {
    return (
      <span className={`${inline ? 'inline-flex items-center align-middle mx-0.5' : 'inline-flex items-center'} ${className}`}>
        {renderFallbackIcon()}
      </span>
    );
  }

  const isTeam = def.category === 'team';

  return (
    <span
      className={`${inline ? 'inline-flex items-center align-middle mx-0.5' : 'inline-flex items-center'} ${
        isTeam && withBackground
          ? 'bg-slate-100 text-slate-950 p-[1px] rounded-[3px]'
          : ''
      } ${className}`}
      title={showTooltip ? `${def.name}: ${def.description}` : undefined}
    >
      <img
        src={def.iconSrc}
        alt={def.name}
        onError={() => setImgError(true)}
        className={`${sizeClass} object-contain inline-block select-none pointer-events-auto filter drop-shadow-xs`}
        loading="lazy"
        draggable={false}
      />
    </span>
  );
};
