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
      className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-amber-300 px-1.5 py-0.5 rounded border border-slate-700 transition-colors cursor-pointer"
      title={`View rules for ${keyword}`}
    >
      <Tag className="w-2.5 h-2.5 text-amber-500/70" />
      {keyword}
    </button>
  );
};
