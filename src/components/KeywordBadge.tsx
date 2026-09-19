import React from 'react';
import { Tag } from 'lucide-react';

export const KeywordBadge: React.FC<{ keyword: string }> = ({ keyword }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-keyword-modal', { detail: keyword }));
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-200 hover:text-amber-100 bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-amber-950/80 hover:from-amber-900/90 hover:via-slate-800/90 hover:to-amber-900/90 px-2 py-0.5 rounded-lg border border-amber-500/40 hover:border-amber-400/70 ring-1 ring-white/10 shadow-sm backdrop-blur-xs transition-all active:scale-95 cursor-pointer touch-manipulation"
      title={`View rules for ${keyword}`}
    >
      <Tag className="w-2.5 h-2.5 text-amber-400 shrink-0" />
      <span>{keyword}</span>
    </button>
  );
};
