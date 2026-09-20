import React, { useState, useMemo } from 'react';
import { Search, Tag, BookOpen, Layers } from 'lucide-react';
import { GAME_KEYWORDS, getKeywordRule } from '../data/keywords';
import { KeywordBadge } from './KeywordBadge';

export const KeywordsReferenceView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredKeywords = useMemo(() => {
    return GAME_KEYWORDS.filter((kw) => {
      const ruleText = getKeywordRule(kw.name);
      if (ruleText.includes('thematic tag')) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const matchesName = kw.name.toLowerCase().includes(q);
      const matchesRule = ruleText.toLowerCase().includes(q);
      const matchesAlias = kw.aliases?.some((a) => a.toLowerCase().includes(q));

      return matchesName || matchesRule || matchesAlias;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-100 uppercase tracking-wide">
              Legendary Keywords Index ({filteredKeywords.length})
            </h4>
            <p className="text-xs text-slate-400">
              Search and explore official rules, mechanics, and triggers for all game keywords.
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords or rules..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/40 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Keywords Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredKeywords.map((kw) => {
          const rule = getKeywordRule(kw.name);
          return (
            <div
              key={kw.name}
              className="bg-slate-950/80 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-4 sm:p-5 shadow-xl transition-all space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 shadow-sm shadow-teal-400/50"></span>
                    <h5 className="text-sm sm:text-base font-bold text-teal-200 uppercase tracking-wide group-hover:text-teal-100 transition-colors">
                      {kw.name}
                    </h5>
                  </div>
                  <KeywordBadge keyword={kw.name} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                  {rule}
                </p>
              </div>

              {kw.aliases && kw.aliases.length > 0 && (
                <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-500 uppercase">Aliases / Related:</span>
                  {kw.aliases.slice(0, 4).map((alias, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {alias}
                    </span>
                  ))}
                  {kw.aliases.length > 4 && (
                    <span className="text-slate-500">+{kw.aliases.length - 4} more</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredKeywords.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-slate-400 space-y-2">
          <Tag className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
          <p className="text-sm font-bold text-slate-300">No keywords found matching "{searchQuery}"</p>
          <p className="text-xs text-slate-500">Try searching for a different keyword name or mechanic term.</p>
        </div>
      )}
    </div>
  );
};
