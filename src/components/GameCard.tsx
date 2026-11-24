import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Play,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Trash2,
  Sparkles,
  Gamepad2,
  ExternalLink,
  Edit2,
  Check
} from 'lucide-react';
import type { Game, HoursMode, GameStatus } from '../types/game';
import { formatDealPrice } from '../services/cheapshark';

interface GameCardProps {
  game: Game;
  index: number;
  totalGames: number;
  dailyHours: number;
  onUpdateGame: (updated: Game) => void;
  onDeleteGame: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  index,
  totalGames,
  dailyHours,
  onUpdateGame,
  onDeleteGame,
  onMoveUp,
  onMoveDown,
}) => {
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [tempHours, setTempHours] = useState(
    game.selectedHoursMode === 'mainStory' ? game.mainStoryHours : game.mainPlusExtrasHours
  );

  const targetHours = game.selectedHoursMode === 'mainStory' ? game.mainStoryHours : game.mainPlusExtrasHours;
  const remainingHours = Math.max(0, targetHours - game.playedHours);
  const progressPct = targetHours > 0 ? Math.min(100, Math.round((game.playedHours / targetHours) * 100)) : 0;
  const daysToFinish = dailyHours > 0 ? Math.ceil(remainingHours / dailyHours) : 0;

  // Toggle hours mode (Main Story vs Main + Extras)
  const handleToggleHoursMode = (mode: HoursMode) => {
    onUpdateGame({
      ...game,
      selectedHoursMode: mode,
    });
  };

  // Save inline edited hours
  const handleSaveHours = () => {
    const val = Math.max(1, Number(tempHours) || 10);
    if (game.selectedHoursMode === 'mainStory') {
      onUpdateGame({
        ...game,
        mainStoryHours: val,
      });
    } else {
      onUpdateGame({
        ...game,
        mainPlusExtrasHours: val,
      });
    }
    setIsEditingHours(false);
  };

  // Status transitions
  const handleNextStatus = () => {
    let nextStatus: GameStatus = 'backlog';
    if (game.status === 'backlog') nextStatus = 'playing';
    else if (game.status === 'playing') nextStatus = 'completed';
    else if (game.status === 'completed') nextStatus = 'backlog';

    let played = game.playedHours;
    if (nextStatus === 'completed') played = targetHours;
    if (nextStatus === 'backlog' && game.status === 'completed') played = 0;

    onUpdateGame({
      ...game,
      status: nextStatus,
      playedHours: played,
    });
  };

  const isCompleted = game.status === 'completed';
  const isPlaying = game.status === 'playing';

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col md:flex-row bg-slate-900/90 ${
        isCompleted
          ? 'border-emerald-800/50 opacity-75'
          : isPlaying
          ? 'border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Reorder strip on the left */}
      <div className="hidden sm:flex flex-col items-center justify-center bg-slate-950/60 px-2 py-3 border-r border-slate-800/80 gap-1 text-slate-500">
        <span className="text-[11px] font-bold text-slate-400">#{index + 1}</span>
        <button
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
          title="Move up in queue"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => onMoveDown(index)}
          disabled={index === totalGames - 1}
          className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
          title="Move down in queue"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Cover Artwork */}
      <div className="relative md:w-56 h-36 md:h-auto flex-shrink-0 bg-slate-950 overflow-hidden">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.title}
            className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
              isCompleted ? 'grayscale contrast-75' : ''
            }`}
            onError={(e) => {
              // fallback image if remote fails
              e.currentTarget.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
            <Gamepad2 className="w-8 h-8" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950/80 via-transparent to-transparent md:hidden" />

        {/* Badges on cover */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 z-10">
          {game.status === 'playing' && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md">
              <Play className="w-2.5 h-2.5 fill-current" />
              Playing Now
            </span>
          )}
          {game.status === 'completed' && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Beaten
            </span>
          )}
          {game.dealPrice && (
            <span className="px-2 py-0.5 rounded-full bg-slate-900/90 backdrop-blur-sm text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
              {formatDealPrice(game.dealPrice)}
            </span>
          )}
        </div>

        {game.steamAppID && (
          <a
            href={`https://store.steampowered.com/app/${game.steamAppID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] text-slate-300 border border-slate-700/60 flex items-center gap-1 hover:text-white hover:border-slate-500 transition-colors"
          >
            <span>Steam</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>

      {/* Main Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
        {/* Header line: Title, Genre, Vibe */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="sm:hidden text-xs font-bold text-slate-400">#{index + 1}</span>
                <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                  {game.title}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60">
                  {game.genre}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 text-xs font-semibold border border-cyan-800/40">
                  {game.vibeTag}
                </span>
              </div>

              {/* Pacing note tip */}
              {game.pacingNote && (
                <p className="text-xs text-slate-400 mt-1.5 flex items-baseline gap-1.5 leading-relaxed">
                  <span className="text-amber-400 font-semibold text-[11px] uppercase tracking-wide">Pacing:</span>
                  <span>{game.pacingNote}</span>
                </p>
              )}

              {/* AI Optimization Reason badge */}
              {game.aiOptimizationReason && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-700/50 text-indigo-300 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                  <span>{game.aiOptimizationReason}</span>
                </div>
              )}
            </div>

            {/* Actions: Delete */}
            <button
              onClick={() => onDeleteGame(game.id)}
              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
              title="Remove from queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Playtime & Mode Controls */}
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Toggle between Main Story and Main + Extras directly on card */}
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => handleToggleHoursMode('mainStory')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all ${
                  game.selectedHoursMode === 'mainStory'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Main Story ({game.mainStoryHours}h)
              </button>
              <button
                type="button"
                onClick={() => handleToggleHoursMode('mainPlusExtras')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all ${
                  game.selectedHoursMode === 'mainPlusExtras'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Main + Extras ({game.mainPlusExtrasHours}h)
              </button>
            </div>

            {/* Requirement: Edit hours directly on the queue card */}
            <div className="flex items-center gap-2">
              {isEditingHours ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={tempHours}
                    onChange={(e) => setTempHours(Number(e.target.value))}
                    className="w-16 px-2 py-0.5 rounded bg-slate-900 border border-cyan-500 text-white text-xs font-bold"
                    autoFocus
                  />
                  <span className="text-slate-400 text-xs">hrs</span>
                  <button
                    onClick={handleSaveHours}
                    className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTempHours(targetHours);
                    setIsEditingHours(true);
                  }}
                  className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors group/edit"
                  title="Click to edit target hours"
                >
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Target: <strong className="text-white">{targetHours}h</strong></span>
                  <Edit2 className="w-3 h-3 text-slate-500 group-hover/edit:text-cyan-400 ml-0.5" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <span>Progress:</span>
                <strong className="text-white">{game.playedHours}h</strong>
                <span>/ {targetHours}h</span>
                <span className="text-[11px] text-cyan-400 font-semibold ml-1">({progressPct}%)</span>
              </div>
              <div>
                {!isCompleted && daysToFinish > 0 && (
                  <span className="text-indigo-400 font-medium">
                    ~{daysToFinish} days left ({dailyHours}h/day)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max={targetHours}
                value={game.playedHours}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  let status = game.status;
                  if (val === targetHours && status !== 'completed') status = 'completed';
                  if (val > 0 && val < targetHours && status === 'backlog') status = 'playing';
                  onUpdateGame({
                    ...game,
                    playedHours: val,
                    status,
                  });
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Footer controls: Status switcher */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
          <button
            onClick={handleNextStatus}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              isCompleted
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900'
                : isPlaying
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 hover:bg-cyan-900'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Status: Completed</span>
              </>
            ) : isPlaying ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                <span>Status: In Progress</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Status: In Backlog</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newPlayed = Math.max(0, game.playedHours - 1);
                onUpdateGame({
                  ...game,
                  playedHours: newPlayed,
                  status: newPlayed === targetHours ? 'completed' : newPlayed > 0 ? 'playing' : 'backlog',
                });
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              title="Minus 1 hour played"
            >
              -1h
            </button>
            <button
              onClick={() => {
                const newPlayed = Math.min(targetHours, game.playedHours + 1);
                onUpdateGame({
                  ...game,
                  playedHours: newPlayed,
                  status: newPlayed === targetHours ? 'completed' : 'playing',
                });
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              title="Plus 1 hour played"
            >
              +1h
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
