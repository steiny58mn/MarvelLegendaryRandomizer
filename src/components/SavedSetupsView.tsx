import React, { useState } from 'react';
import { ActiveSetup } from '../types';
import {
  Bookmark,
  Play,
  Trash2,
  Share2,
  Check,
} from 'lucide-react';

interface SavedSetupsViewProps {
  savedSetups: ActiveSetup[];
  onLoadSetup: (setup: ActiveSetup) => void;
  onDeleteSavedSetup?: (id: string) => void;
  onDeleteSetup?: (id: string) => void;
}

export const SavedSetupsView: React.FC<SavedSetupsViewProps> = ({
  savedSetups,
  onLoadSetup,
  onDeleteSavedSetup,
  onDeleteSetup,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (onDeleteSavedSetup) onDeleteSavedSetup(id);
    else if (onDeleteSetup) onDeleteSetup(id);
  };

  const handleCopySetup = (setup: ActiveSetup) => {
    const text = `Marvel Legendary Setup:
Mastermind: ${setup.mastermind.name} (${setup.mastermind.attack} ATK)
Scheme: ${setup.scheme?.name || 'No Scheme'} (${setup.scheme?.twists || 0} Twists)
Heroes: ${setup.heroes.map((h) => h.name).join(', ')}
Villains: ${setup.villains.map((v) => v.name).join(', ')}
Henchmen: ${setup.henchmen.map((h) => h.name).join(', ')}`;

    navigator.clipboard.writeText(text);
    setCopiedId(setup.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-purple-400" />
            <span>Saved Game Setups</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Store and revisit your favorite villain encounters, challenging scheme combinations, or tournament setups.
          </p>
        </div>

        <span className="text-xs font-bold text-purple-200 bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 px-3 py-1.5 rounded-xl border border-purple-500/50 shadow-md ring-1 ring-white/10 backdrop-blur-md self-start sm:self-auto">
          {savedSetups.length} Setups Saved
        </span>
      </div>

      {savedSetups.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <Bookmark className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
          <p className="text-sm">You haven't saved any setups yet.</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click the "Save" button on any generated setup in the Randomizer to save it here for future game nights.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {savedSetups.map((setup) => {
            const dateStr = new Date(setup.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={setup.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-200 bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 px-2.5 py-1 rounded-lg border border-purple-500/50 ring-1 ring-white/10 backdrop-blur-xs shadow-sm">
                        {setup.playerCount}P
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {dateStr}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopySetup(setup)}
                        className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 text-slate-400 hover:text-white border border-slate-700/70 hover:border-purple-500/50 ring-1 ring-white/10 shadow-sm backdrop-blur-md transition-all active:scale-95 touch-manipulation cursor-pointer"
                        title="Copy setup summary"
                      >
                        {copiedId === setup.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(setup.id)}
                        className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 hover:from-slate-800 hover:to-slate-800 text-slate-500 hover:text-rose-400 border border-slate-700/70 hover:border-rose-500/50 ring-1 ring-white/10 shadow-sm backdrop-blur-md transition-all active:scale-95 touch-manipulation cursor-pointer"
                        title="Delete saved setup"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scheme & Mastermind */}
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] text-red-400 uppercase font-bold tracking-wider block">
                        Mastermind:
                      </span>
                      <div className="text-base font-extrabold text-slate-100 flex items-center justify-between">
                        <span>{setup.mastermind.name}</span>
                        <span className="text-xs text-purple-400 font-normal">
                          {setup.mastermind.attack}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">
                        Scheme:
                      </span>
                      <div className="text-sm font-semibold text-slate-200">
                        {setup.scheme?.name || 'No Scheme'}
                      </div>
                    </div>
                  </div>

                  {/* Heroes */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                      Heroes:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {setup.heroes.map((hero) => (
                        <span
                          key={hero.id}
                          className="text-xs bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700/70 text-slate-300 font-medium ring-1 ring-white/10 backdrop-blur-xs shadow-sm"
                        >
                          {hero.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Villains & Henchmen */}
                  <div className="text-xs text-slate-400 pt-1 flex items-center justify-between">
                    <span>
                      Villains:{' '}
                      <span className="text-slate-300">
                        {setup.villains.map((v) => v.name).join(', ')}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Deck: {setup.deckBreakdown.villainDeckTotal} Villain / {setup.deckBreakdown.heroDeckCount} Hero cards
                  </span>

                  <button
                    onClick={() => onLoadSetup(setup)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-gradient-to-r from-purple-950/90 via-indigo-950/95 to-purple-900/90 hover:from-purple-900 hover:via-indigo-900 hover:to-purple-800 text-purple-100 hover:text-white font-bold text-xs uppercase tracking-wider border border-purple-500/50 hover:border-purple-400/80 shadow-lg shadow-purple-950/60 ring-1 ring-white/15 backdrop-blur-md transition-all active:scale-95 touch-manipulation cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Load Setup</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
