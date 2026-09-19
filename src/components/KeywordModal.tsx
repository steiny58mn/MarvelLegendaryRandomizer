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
      id="keyword-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div 
        id="keyword-modal-content"
        className="bg-gradient-to-br from-teal-950/95 via-slate-950/98 to-teal-950/95 border border-teal-400/50 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative ring-1 ring-teal-400/20 backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3.5 py-2.5 border-b border-teal-400/30 bg-teal-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isThematic ? <Tag className="w-4 h-4 text-teal-400 shrink-0" /> : <BookOpen className="w-4 h-4 text-teal-400 shrink-0" />}
            <h3 className="text-sm sm:text-base font-bold text-teal-100 uppercase tracking-wide truncate">
              {activeKeyword}
            </h3>
          </div>
          <button
            id="close-keyword-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-teal-300 hover:text-white hover:bg-teal-900/60 transition-colors cursor-pointer ml-2 shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 bg-slate-950/70 text-teal-100/90 text-sm leading-relaxed border-t border-teal-400/10">
          {rule}
        </div>
      </div>
    </div>
  );
};
