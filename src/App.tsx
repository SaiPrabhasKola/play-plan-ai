import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  PlusCircle,
  Search,
  RotateCcw
} from 'lucide-react';
import type { Game, AppSettings, GameStatus } from './types/game';
import { DEFAULT_GAMES } from './data/defaultGames';
import {
  loadStoredGames,
  saveStoredGames,
  loadStoredSettings,
  saveStoredSettings,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { StatsBanner } from './components/StatsBanner';
import { GameCard } from './components/GameCard';
import { AddGameModal } from './components/AddGameModal';
import { QueueOptimizerModal } from './components/QueueOptimizerModal';
import { AdvisorDrawer } from './components/AdvisorDrawer';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const [games, setGames] = useState<Game[]>(() => loadStoredGames());
  const [settings, setSettings] = useState<AppSettings>(() => loadStoredSettings());

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<'all' | GameStatus>('all');
  const [filterSearch, setFilterSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOptimizerModalOpen, setIsOptimizerModalOpen] = useState(false);
  const [isAdvisorDrawerOpen, setIsAdvisorDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Undo history for reorder
  const [previousGamesOrder, setPreviousGamesOrder] = useState<Game[] | null>(null);

  // Persist games
  useEffect(() => {
    saveStoredGames(games);
  }, [games]);

  // Persist settings
  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  // Handlers for game items
  const handleAddGame = (newGameData: Omit<Game, 'id' | 'order' | 'addedAt'>) => {
    const newGame: Game = {
      ...newGameData,
      id: `game-${Date.now()}`,
      order: games.length,
      addedAt: Date.now(),
    };
    setGames(prev => [newGame, ...prev]);
  };

  const handleUpdateGame = (updated: Game) => {
    setGames(prev => prev.map(g => (g.id === updated.id ? updated : g)));
  };

  const handleDeleteGame = (id: string) => {
    setGames(prev => prev.filter(g => g.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setGames(prev => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next.map((g, i) => ({ ...g, order: i }));
    });
  };

  const handleMoveDown = (index: number) => {
    setGames(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next.map((g, i) => ({ ...g, order: i }));
    });
  };

  const handleApplyReorder = (newOrderGames: Game[]) => {
    setPreviousGamesOrder([...games]);
    setGames(newOrderGames);
  };

  const handleUndoReorder = () => {
    if (previousGamesOrder) {
      setGames(previousGamesOrder);
      setPreviousGamesOrder(null);
    }
  };

  const handleResetToDefaults = () => {
    setGames(DEFAULT_GAMES);
    setPreviousGamesOrder(null);
  };

  // Filtered games
  const filteredGames = games.filter(g => {
    if (statusFilter !== 'all' && g.status !== statusFilter) return false;
    if (filterSearch.trim()) {
      const query = filterSearch.toLowerCase();
      return (
        g.title.toLowerCase().includes(query) ||
        g.genre.toLowerCase().includes(query) ||
        g.vibeTag.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const activeGamesCount = games.filter(g => g.status !== 'completed').length;

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenOptimizerModal={() => setIsOptimizerModalOpen(true)}
        onOpenAdvisorDrawer={() => setIsAdvisorDrawerOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        activeGamesCount={activeGamesCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Metric Cards Banner */}
        <StatsBanner games={games} hoursPerDay={settings.hoursPerDay} />

        {/* Queue Control Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({games.length})
            </button>
            <button
              onClick={() => setStatusFilter('playing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'playing'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Playing ({games.filter(g => g.status === 'playing').length})
            </button>
            <button
              onClick={() => setStatusFilter('backlog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'backlog'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Backlog ({games.filter(g => g.status === 'backlog').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed ({games.filter(g => g.status === 'completed').length})
            </button>
          </div>

          {/* Search within queue & Undo button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Filter by title, genre, vibe..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {previousGamesOrder && (
              <button
                onClick={handleUndoReorder}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Undo last AI optimization reorder"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Undo Reorder</span>
              </button>
            )}
          </div>
        </div>

        {/* Game List */}
        {filteredGames.length > 0 ? (
          <div className="space-y-4">
            {filteredGames.map((game, idx) => (
              <GameCard
                key={game.id}
                game={game}
                index={idx}
                totalGames={filteredGames.length}
                dailyHours={settings.hoursPerDay}
                onUpdateGame={handleUpdateGame}
                onDeleteGame={handleDeleteGame}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No games found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                {filterSearch
                  ? `No games match "${filterSearch}". Try clearing your search filter.`
                  : 'Your queue is empty. Add a game via CheapShark or restore the default backlog.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Game</span>
              </button>
              <button
                onClick={handleResetToDefaults}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore 6 Backlog Games</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Play Plan AI</span>
            <span>•</span>
            <span>Zero-Key CheapShark API + Google Gemini API ({settings.model})</span>
          </div>
          <div>
            Built with React 19, TypeScript, Tailwind CSS & @google/genai
          </div>
        </div>
      </footer>

      {/* Modals & Slide-overs */}
      <AddGameModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddGame={handleAddGame}
        geminiApiKey={settings.geminiApiKey}
        modelName={settings.model}
      />

      <QueueOptimizerModal
        isOpen={isOptimizerModalOpen}
        onClose={() => setIsOptimizerModalOpen(false)}
        games={games}
        hoursPerDay={settings.hoursPerDay}
        geminiApiKey={settings.geminiApiKey}
        modelName={settings.model}
        onApplyReorder={handleApplyReorder}
      />

      <AdvisorDrawer
        isOpen={isAdvisorDrawerOpen}
        onClose={() => setIsAdvisorDrawerOpen(false)}
        games={games}
        hoursPerDay={settings.hoursPerDay}
        geminiApiKey={settings.geminiApiKey}
        modelName={settings.model}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onResetToDefaults={handleResetToDefaults}
      />
    </div>
  );
};

export default App;
