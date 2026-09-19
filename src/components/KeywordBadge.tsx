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
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-200 hover:text-white bg-gradient-to-r from-teal-950 via-cyan-900/80 to-sky-950 hover:from-teal-900 hover:via-cyan-900 hover:to-sky-900 px-2 py-0.5 rounded-lg border border-teal-400/60 hover:border-teal-300 ring-1 ring-white/15 shadow-sm shadow-teal-950/40 backdrop-blur-md transition-all active:scale-95 cursor-pointer touch-manipulation"
      title={`View rules for ${keyword}`}
    >
      <Tag className="w-2.5 h-2.5 text-teal-400 shrink-0" />
      <span>{keyword}</span>
    </button>
  );
};
