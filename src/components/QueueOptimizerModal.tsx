import React, { useState } from 'react';
import {
  X,
  Wand2,
  Sparkles,
  Loader2,
  Check,
  Scale,
  Zap,
  Mountain,
  AlertCircle
} from 'lucide-react';
import type { Game, PacingMode, QueueOptimizationResult } from '../types/game';
import { optimizeQueueWithGemini } from '../services/gemini';

interface QueueOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  hoursPerDay: number;
  geminiApiKey: string;
  modelName: string;
  onApplyReorder: (newOrderGames: Game[]) => void;
}

export const QueueOptimizerModal: React.FC<QueueOptimizerModalProps> = ({
  isOpen,
  onClose,
  games,
  hoursPerDay,
  geminiApiKey,
  modelName,
  onApplyReorder,
}) => {
  const [pacingMode, setPacingMode] = useState<PacingMode>('balanced');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<QueueOptimizationResult | null>(null);
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const activeGames = games.filter(g => g.status !== 'completed');

  const handleRunOptimizer = async () => {
    setIsOptimizing(true);
    setSourceNotice(null);
    setErrorNotice(null);

    const { result, source, warning } = await optimizeQueueWithGemini(
      games,
      hoursPerDay,
      pacingMode,
      geminiApiKey,
      modelName
    );

    setIsOptimizing(false);
    setOptimizationResult(result);

    if (warning) {
      setErrorNotice(warning);
    } else if (source === 'gemini') {
      setSourceNotice(`Optimized via ${modelName} Structured Outputs`);
    }
  };

  const handleApply = () => {
    if (!optimizationResult) return;

    // Build map of gameId to reason
    const reasonMap = new Map<string, string>();
    optimizationResult.optimizedOrder.forEach(item => {
      reasonMap.set(item.gameId, item.reason);
    });

    // Reorder active games
    const activeMap = new Map(activeGames.map(g => [g.id, g]));
    const reorderedActive: Game[] = [];

    optimizationResult.optimizedOrder.forEach(item => {
      const g = activeMap.get(item.gameId);
      if (g) {
        reorderedActive.push({
          ...g,
          aiOptimizationReason: item.reason,
        });
        activeMap.delete(item.gameId);
      }
    });

    // Append any active games not in returned list
    activeMap.forEach(g => reorderedActive.push(g));

    // Keep completed games at the end
    const completed = games.filter(g => g.status === 'completed');
    const fullList = [...reorderedActive, ...completed].map((g, idx) => ({
      ...g,
      order: idx,
    }));

    onApplyReorder(fullList);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AI Queue Optimizer
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  {modelName}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pacing algorithms reorder games to eliminate burnout and maximize completion satisfaction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Pacing Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Pacing Strategy:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Balanced */}
              <button
                type="button"
                onClick={() => setPacingMode('balanced')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  pacingMode === 'balanced'
                    ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  {pacingMode === 'balanced' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="font-bold text-sm text-white">Balanced Pacing</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Sandwiches massive open worlds between short linear games to prevent fatigue.
                </p>
              </button>

              {/* More Finishes */}
              <button
                type="button"
                onClick={() => setPacingMode('more_finishes')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  pacingMode === 'more_finishes'
                    ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  {pacingMode === 'more_finishes' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <div className="font-bold text-sm text-white">More Finishes</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Quick wins first. Racks up completions fast to build momentum.
                </p>
              </button>

              {/* Longer Games */}
              <button
                type="button"
                onClick={() => setPacingMode('longer_games')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  pacingMode === 'longer_games'
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-md shadow-amber-950/40 ring-1 ring-amber-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <Mountain className="w-4 h-4" />
                  </div>
                  {pacingMode === 'longer_games' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="font-bold text-sm text-white">Longer Games</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Frontloads deep commitments upfront while willpower is at its highest.
                </p>
              </button>
            </div>
          </div>

          {/* Action trigger button */}
          <div className="flex justify-center">
            <button
              onClick={handleRunOptimizer}
              disabled={isOptimizing || activeGames.length < 2}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95 disabled:opacity-40 transition-all"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing Queue with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Analyze & Optimize Queue</span>
                </>
              )}
            </button>
          </div>

          {/* Error / Notice banner */}
          {errorNotice && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {sourceNotice && (
            <div className="text-center text-xs text-indigo-400 font-medium">
              ✨ {sourceNotice}
            </div>
          )}

          {/* Optimization Results Preview */}
          {optimizationResult && (
            <div className="space-y-4 rounded-xl bg-slate-950 border border-slate-800 p-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  AI Strategy Summary
                </span>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {optimizationResult.strategySummary}
                </p>
              </div>

              {/* Proposed Order List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Proposed Sequence ({optimizationResult.optimizedOrder.length} Games)
                </span>
                <div className="space-y-2">
                  {optimizationResult.optimizedOrder.map((item, idx) => {
                    const game = games.find(g => g.id === item.gameId);
                    if (!game) return null;
                    const hours = game.selectedHoursMode === 'mainStory' ? game.mainStoryHours : game.mainPlusExtrasHours;

                    return (
                      <div
                        key={item.gameId}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3 text-xs"
                      >
                        <span className="font-extrabold text-indigo-400 w-6">
                          #{idx + 1}
                        </span>
                        {game.coverUrl && (
                          <img
                            src={game.coverUrl}
                            alt={game.title}
                            className="w-12 h-7 rounded object-cover border border-slate-700 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <strong className="text-white truncate">{game.title}</strong>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {hours}h
                            </span>
                            <span className="text-[10px] text-cyan-400 font-medium truncate hidden sm:inline">
                              {game.vibeTag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 italic truncate">
                            "{item.reason}"
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!optimizationResult || isOptimizing}
            className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Apply Reordered Queue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
