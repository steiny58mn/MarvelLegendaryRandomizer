import { GAME_KEYWORDS } from '../data/keywords';
import React, { useState } from 'react';
import { GameRulesSection } from './GameRulesSection';
import { BookOpen, Scroll } from 'lucide-react';

export const PresetsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'keywords'>('rules');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-800 pb-2 mb-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('rules')}
          className={`min-h-[42px] px-3.5 text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'rules' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <Scroll className="w-4 h-4" />
          <span>Game Rules & Turn Flow</span>
        </button>
        <button 
          onClick={() => setActiveTab('keywords')}
          className={`min-h-[42px] px-3.5 text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'keywords' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Keyword Dictionary</span>
        </button>
      </div>

      {activeTab === 'rules' && <GameRulesSection />}

      {activeTab === 'keywords' && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div className="border-b border-slate-800 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              Keyword Dictionary
            </h2>
            <p className="text-xs text-slate-400 mt-1">A complete reference of all standard Marvel Legendary mechanics.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
            {GAME_KEYWORDS.sort((a, b) => a.name.localeCompare(b.name)).map((kw, i) => (
              <div key={i} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                <h3 className="text-base font-extrabold text-amber-400 mb-1">{kw.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{kw.rule}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
