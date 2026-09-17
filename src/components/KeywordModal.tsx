import React from 'react';
import { X, BookOpen, Tag } from 'lucide-react';
import { getKeywordRule } from '../data/keywords';

interface KeywordModalProps {
  keyword: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const KeywordModal: React.FC<KeywordModalProps> = ({ keyword, isOpen, onClose }) => {
  if (!isOpen || !keyword) return null;

  const rule = getKeywordRule(keyword);
  const isThematic = rule.includes('thematic tag');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isThematic ? <Tag className="w-5 h-5 text-amber-400" /> : <BookOpen className="w-5 h-5 text-amber-500" />}
            <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
              {keyword}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 bg-slate-900/90 text-slate-300 text-sm leading-relaxed">
          {rule}
        </div>
        
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
