import React from 'react';
import { Clock, Calendar, CheckCircle2, Flame, Layers } from 'lucide-react';
import type { Game } from '../types/game';

interface StatsBannerProps {
  games: Game[];
  hoursPerDay: number;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ games, hoursPerDay }) => {
  const activeGames = games.filter(g => g.status !== 'completed');
  const completedGames = games.filter(g => g.status === 'completed');

  const totalRemainingHours = activeGames.reduce((acc, g) => {
    const target = g.selectedHoursMode === 'mainStory' ? g.mainStoryHours : g.mainPlusExtrasHours;
    return acc + Math.max(0, target - g.playedHours);
  }, 0);

  const totalPlayedHours = games.reduce((acc, g) => acc + g.playedHours, 0);

  // Projected Finish Date
  const daysNeeded = hoursPerDay > 0 ? Math.ceil(totalRemainingHours / hoursPerDay) : 0;
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + daysNeeded);
  const formattedFinishDate = daysNeeded > 0
    ? finishDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Completed!';

  const completionPct = games.length > 0
    ? Math.round((completedGames.length / games.length) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 my-6">
      {/* Remaining Hours */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span>Backlog Hours</span>
          <Clock className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {totalRemainingHours}
          </span>
          <span className="text-xs text-slate-400">hours left</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          {totalPlayedHours}h logged so far
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 bg-cyan-500 w-full opacity-60" />
      </div>

      {/* Projected Finish Date */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span>Projected Finish</span>
          <Calendar className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
            {formattedFinishDate}
          </span>
        </div>
        <div className="text-[11px] text-indigo-400/90 mt-1">
          ~{daysNeeded} days at {hoursPerDay}h/day
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 w-full opacity-60" />
      </div>

      {/* Active Queue Size */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span>Active Queue</span>
          <Layers className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeGames.length}
          </span>
          <span className="text-xs text-slate-400">games in line</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          {games.filter(g => g.status === 'playing').length} currently playing
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 bg-violet-500 w-full opacity-60" />
      </div>

      {/* Completion Milestone */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span>Finished</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {completedGames.length}
          </span>
          <span className="text-xs text-slate-400">({completionPct}%)</span>
        </div>
        <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-400" />
          <span>Keep the streak going!</span>
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 w-full opacity-60" />
      </div>
    </div>
  );
};
