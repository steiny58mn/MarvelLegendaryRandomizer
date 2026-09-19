import React from 'react';
import { X, BookOpen, Tag } from 'lucide-react';
import { getKeywordRule } from '../data/keywords';

interface KeywordModalProps {
  keyword?: string | null;
  keywordName?: string | null;
  isOpen?: boolean;
  onClose: () => void;
}

export const KeywordModal: React.FC<KeywordModalProps> = ({
  keyword,
  keywordName,
  isOpen,
  onClose,
}) => {
  const activeKeyword = keyword ?? keywordName ?? null;
  const isModalOpen = isOpen !== undefined ? isOpen : Boolean(activeKeyword);

  React.useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isModalOpen, onClose]);

  if (!isModalOpen || !activeKeyword) return null;

  const rule = getKeywordRule(activeKeyword);
  const isThematic = rule.includes('thematic tag');

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div 
        className="bg-gradient-to-r from-purple-950/95 via-indigo-950/98 to-purple-900/95 border border-purple-500/50 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative ring-1 ring-white/15 backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-purple-500/30 bg-purple-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isThematic ? <Tag className="w-5 h-5 text-amber-400" /> : <BookOpen className="w-5 h-5 text-amber-400" />}
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">
              {activeKeyword}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 bg-slate-950/60 text-purple-100 text-sm leading-relaxed">
          {rule}
        </div>
        
        <div className="p-3 bg-purple-950/80 border-t border-purple-500/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 hover:from-purple-900 hover:via-indigo-900 hover:to-purple-800 text-xs font-semibold text-purple-100 hover:text-white border border-purple-500/50 hover:border-purple-400/80 shadow-md ring-1 ring-white/15 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
