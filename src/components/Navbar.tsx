import React from 'react';
import { Gamepad2, Sparkles, MessageSquareHeart, Settings as SettingsIcon, PlusCircle, Wand2 } from 'lucide-react';
import type { AppSettings } from '../types/game';

interface NavbarProps {
  settings: AppSettings;
  onOpenAddModal: () => void;
  onOpenOptimizerModal: () => void;
  onOpenAdvisorDrawer: () => void;
  onOpenSettingsModal: () => void;
  activeGamesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenAddModal,
  onOpenOptimizerModal,
  onOpenAdvisorDrawer,
  onOpenSettingsModal,
  activeGamesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
            <Gamepad2 className="w-6 h-6" />
            <Sparkles className="w-3.5 h-3.5 absolute -top-1 -right-1 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                Play Plan AI
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                CheapShark + Gemini
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Intelligent Backlog Pacing & Steam Deal Advisor
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Daily Playtime Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Pace:</span>
            <strong className="text-cyan-400 font-semibold">{settings.hoursPerDay}h / day</strong>
          </div>

          {/* AI Optimize Queue Button */}
          <button
            onClick={onOpenOptimizerModal}
            disabled={activeGamesCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Reorder queue with Gemini to avoid burnout"
          >
            <Wand2 className="w-4 h-4 text-violet-200" />
            <span className="hidden sm:inline">AI Optimize</span>
            <span>Queue</span>
          </button>

          {/* Add Game Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-cyan-600/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Game</span>
          </button>

          {/* Advisor / Should I Buy? Button */}
          <button
            onClick={onOpenAdvisorDrawer}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs sm:text-sm font-medium transition-all"
            title="Ask AI Advisor about your queue or Steam sale deals"
          >
            <MessageSquareHeart className="w-4 h-4 text-pink-400" />
            <span className="hidden md:inline">Advisor</span>
            <span className="w-2 h-2 rounded-full bg-pink-500 absolute -top-0.5 -right-0.5" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all"
            title="Configure Gemini API Key & Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
