import React, { useState, useMemo } from 'react';
import { GameScoreResult, ActiveSetup } from '../types';
import { calculateGameScore } from '../utils/setupGenerator';
import {
  Trophy,
  Award,
  Calendar,
  Trash2,
  Flame,
  CheckCircle,
  XCircle,
  Save,
} from 'lucide-react';

interface ScoreTrackerViewProps {
  currentSetup?: ActiveSetup | null;
  setup?: ActiveSetup | null;
  gameHistory: GameScoreResult[];
  onSaveGameResult: (result: GameScoreResult) => void;
  onDeleteGameResult: (id: string) => void;
}

export const ScoreTrackerView: React.FC<ScoreTrackerViewProps> = ({
  currentSetup,
  setup,
  gameHistory,
  onSaveGameResult,
  onDeleteGameResult,
}) => {
  const activeSetup = currentSetup || setup;

  // Form State
  const [outcome, setOutcome] = useState<'Victory' | 'Defeat'>('Victory');
  const [playerCount, setPlayerCount] = useState<number>(
    activeSetup?.playerCount || 2
  );
  const [mastermindName, setMastermindName] = useState<string>(
    activeSetup?.mastermind?.name || 'Red Skull'
  );
  const [schemeName, setSchemeName] = useState<string>(
    activeSetup?.scheme?.name || 'The Midtown Bank Robbery'
  );

  // Score breakdown inputs
  const [tacticsDefeated, setTacticsDefeated] = useState<number>(4);
  const [villainVP, setVillainVP] = useState<number>(24);
  const [rescuedBystanders, setRescuedBystanders] = useState<number>(6);
  const [escapedVillains, setEscapedVillains] = useState<number>(1);
  const [carriedOffBystanders, setCarriedOffBystanders] = useState<number>(0);
  const [twistsInEscape, setTwistsInEscape] = useState<number>(2);
  const [bonusPoints, setBonusPoints] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Live Score Calculation
  const finalScore = useMemo(() => {
    return calculateGameScore({
      mastermindTacticsDefeated: tacticsDefeated,
      villainCardsVPTotal: villainVP,
      rescuedBystandersCount: rescuedBystanders,
      escapedVillainsPenaltyCount: escapedVillains,
      carriedOffBystandersPenaltyCount: carriedOffBystanders,
      schemeTwistsInEscapePenaltyCount: twistsInEscape,
      bonusPoints,
    });
  }, [
    tacticsDefeated,
    villainVP,
    rescuedBystanders,
    escapedVillains,
    carriedOffBystanders,
    twistsInEscape,
    bonusPoints,
  ]);

  const handleSaveResult = (e: React.FormEvent) => {
    e.preventDefault();

    const newResult: GameScoreResult = {
      id: `game-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      setupId: activeSetup?.id,
      playerCount,
      outcome,
      mastermindName,
      schemeName,
      heroesList: activeSetup?.heroes?.map((h) => h.name) || [],
      mastermindTacticsDefeated: tacticsDefeated,
      villainCardsVPTotal: villainVP,
      rescuedBystandersCount: rescuedBystanders,
      escapedVillainsPenaltyCount: escapedVillains,
      carriedOffBystandersPenaltyCount: carriedOffBystanders,
      schemeTwistsInEscapePenaltyCount: twistsInEscape,
      bonusPoints,
      finalScore,
      notes,
    };

    onSaveGameResult(newResult);
    setNotes('');
  };

  // Stats calculation
  const stats = useMemo(() => {
    if (gameHistory.length === 0) {
      return { total: 0, wins: 0, winRate: 0, avgScore: 0, highScore: 0 };
    }
    const total = gameHistory.length;
    const wins = gameHistory.filter((g) => g.outcome === 'Victory').length;
    const winRate = Math.round((wins / total) * 100);
    const avgScore = Math.round(
      gameHistory.reduce((acc, g) => acc + g.finalScore, 0) / total
    );
    const highScore = Math.max(...gameHistory.map((g) => g.finalScore));

    return { total, wins, winRate, avgScore, highScore };
  }, [gameHistory]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">
              Games Played
            </span>
            <span className="text-xl font-extrabold text-slate-100">
              {stats.total}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">
              Win Rate
            </span>
            <span className="text-xl font-extrabold text-emerald-400">
              {stats.winRate}%
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">
              Avg Score
            </span>
            <span className="text-xl font-extrabold text-blue-300">
              {stats.avgScore} VP
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">
              High Score
            </span>
            <span className="text-xl font-extrabold text-purple-300">
              {stats.highScore} VP
            </span>
          </div>
        </div>
      </div>

      {/* Score Calculator Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <form onSubmit={handleSaveResult} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide font-['Cinzel'] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Score Calculator & Match Log</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculates total Victory Points using the official Marvel Legendary Rulebook formula.
              </p>
            </div>

            {/* Outcome Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setOutcome('Victory')}
                className={`flex-1 sm:flex-initial px-4 py-2 min-h-[42px] rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer ${
                  outcome === 'Victory'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Victory</span>
              </button>
              <button
                type="button"
                onClick={() => setOutcome('Defeat')}
                className={`flex-1 sm:flex-initial px-4 py-2 min-h-[42px] rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer ${
                  outcome === 'Defeat'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Defeat</span>
              </button>
            </div>
          </div>

          {/* Match Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Player Count
              </label>
              <select
                value={playerCount}
                onChange={(e) => setPlayerCount(Number(e.target.value))}
                className="w-full px-3 py-2.5 min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value={1}>1 Player (Solo)</option>
                <option value={2}>2 Players</option>
                <option value={3}>3 Players</option>
                <option value={4}>4 Players</option>
                <option value={5}>5 Players</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Mastermind
              </label>
              <input
                type="text"
                value={mastermindName}
                onChange={(e) => setMastermindName(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Scheme
              </label>
              <input
                type="text"
                value={schemeName}
                onChange={(e) => setSchemeName(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Score Calculation Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            {/* Positive Score Fields */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3.5">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <CheckCircle className="w-4 h-4" />
                <span>Earned Victory Points (+)</span>
              </h4>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">Mastermind Tactics Defeated:</span>
                  <span className="font-bold text-emerald-400">
                    +{tacticsDefeated * 5} VP ({tacticsDefeated} of 4)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={tacticsDefeated}
                  onChange={(e) => setTacticsDefeated(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-6 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">Defeated Villains & Henchmen VP:</span>
                  <span className="font-bold text-emerald-400">+{villainVP} VP</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={villainVP}
                  onChange={(e) => setVillainVP(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 min-h-[42px] bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">Bystanders Rescued (+1 VP each):</span>
                  <span className="font-bold text-emerald-400">
                    +{rescuedBystanders} VP
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={rescuedBystanders}
                  onChange={(e) =>
                    setRescuedBystanders(Math.max(0, Number(e.target.value)))
                  }
                  className="w-full px-3 py-2 min-h-[42px] bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">Bonus / Scheme Specific Points:</span>
                  <span className="font-bold text-emerald-400">+{bonusPoints} VP</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={bonusPoints}
                  onChange={(e) => setBonusPoints(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 min-h-[42px] bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Penalties */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3.5">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <XCircle className="w-4 h-4" />
                <span>Escaped Penalties (-)</span>
              </h4>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">Escaped Villains (-4 VP each):</span>
                  <span className="font-bold text-rose-400">
                    -{escapedVillains * 4} VP ({escapedVillains} villains)
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={escapedVillains}
                  onChange={(e) =>
                    setEscapedVillains(Math.max(0, Number(e.target.value)))
                  }
                  className="w-full px-3 py-2 min-h-[42px] bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">
                    Bystanders Carried Off (-1 VP each):
                  </span>
                  <span className="font-bold text-rose-400">
                    -{carriedOffBystanders} VP
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={carriedOffBystanders}
                  onChange={(e) =>
                    setCarriedOffBystanders(Math.max(0, Number(e.target.value)))
                  }
                  className="w-full px-3 py-2 min-h-[42px] bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">
                    Scheme Twists in Escaped (-3 VP each):
                  </span>
                  <span className="font-bold text-rose-400">
                    -{twistsInEscape * 3} VP ({twistsInEscape} twists)
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={twistsInEscape}
                  onChange={(e) =>
                    setTwistsInEscape(Math.max(0, Number(e.target.value)))
                  }
                  className="w-full px-3 py-2 min-h-[42px] bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Match Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Epic solo win, last turn optic blast!"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 min-h-[42px] bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Final Score Banner & Submit Button */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Final Score
                </span>
                <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                  {finalScore}{' '}
                  <span className="text-base font-semibold text-slate-400">VP</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm uppercase tracking-wider shadow-lg active:scale-95 touch-manipulation transition-all w-full sm:w-auto cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Record Match Result</span>
            </button>
          </div>
        </form>
      </div>

      {/* Match History Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h4 className="text-lg font-bold text-slate-100 uppercase tracking-wide font-['Cinzel'] mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>Match History Log</span>
          </span>
          <span className="text-xs text-slate-400 font-sans font-normal">
            {gameHistory.length} saved matches
          </span>
        </h4>

        {gameHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No game results recorded yet. Complete a game and record your score above!
          </div>
        ) : (
          <div className="space-y-3">
            {gameHistory.map((game) => (
              <div
                key={game.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        game.outcome === 'Victory'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {game.outcome}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {game.date}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      • {game.playerCount}P
                    </span>
                  </div>

                  <div className="text-base font-bold text-slate-100">
                    {game.mastermindName} —{' '}
                    <span className="text-slate-300 font-normal">
                      {game.schemeName}
                    </span>
                  </div>

                  {game.notes && (
                    <p className="text-xs text-slate-400 italic">{game.notes}</p>
                  )}

                  {game.heroesList && game.heroesList.length > 0 && (
                    <div className="text-[11px] text-slate-500 pt-0.5">
                      Heroes: {game.heroesList.join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Score</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {game.finalScore} VP
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteGameResult(game.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                    title="Delete log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
