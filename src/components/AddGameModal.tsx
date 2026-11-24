import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Sparkles,
  Loader2,
  AlertCircle,
  Check,
  Gamepad,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CheapSharkGame, Game, HoursMode, AIEnrichmentResult } from '../types/game';
import { searchCheapSharkGames, getGameCoverArt, formatDealPrice } from '../services/cheapshark';
import { enrichGameWithGemini } from '../services/gemini';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGame: (game: Omit<Game, 'id' | 'order' | 'addedAt'>) => void;
  geminiApiKey: string;
  modelName: string;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onAddGame,
  geminiApiKey,
  modelName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CheapSharkGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Selected or manual game state
  const [selectedCheapSharkGame, setSelectedCheapSharkGame] = useState<CheapSharkGame | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customSteamAppId, setCustomSteamAppId] = useState('');

  // Enrichment state
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentResult, setEnrichmentResult] = useState<AIEnrichmentResult | null>(null);
  const [enrichmentNotice, setEnrichmentNotice] = useState<string | null>(null);
  const [selectedHoursMode, setSelectedHoursMode] = useState<HoursMode>('mainStory');
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [dealPrice, setDealPrice] = useState<string | null>(null);

  // Manual editable hours
  const [editableMainStory, setEditableMainStory] = useState(15);
  const [editableMainPlusExtras, setEditableMainPlusExtras] = useState(25);
  const [editableGenre, setEditableGenre] = useState('');
  const [editableVibeTag, setEditableVibeTag] = useState('');
  const [editablePacingNote, setEditablePacingNote] = useState('');

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      setIsRateLimited(false);
      setSelectedCheapSharkGame(null);
      setCustomTitle('');
      setCustomSteamAppId('');
      setIsEnriching(false);
      setEnrichmentResult(null);
      setEnrichmentNotice(null);
    }
  }, [isOpen]);

  // Debounced 350ms search on CheapShark
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const trimmed = searchQuery.trim();
    if (!trimmed || selectedCheapSharkGame) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setIsRateLimited(false);

    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await searchCheapSharkGames(trimmed, 6, controller.signal);
      setIsSearching(false);

      if (res.isRateLimited) {
        setIsRateLimited(true);
        setSearchError(res.error || 'CheapShark rate limit reached.');
        setSearchResults([]);
      } else if (res.error) {
        setSearchError(res.error);
        setSearchResults([]);
      } else {
        setSearchResults(res.games);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery, selectedCheapSharkGame]);

  // Handle selecting a game from CheapShark
  const handleSelectGame = async (game: CheapSharkGame) => {
    setSelectedCheapSharkGame(game);
    setCustomTitle(game.external);
    setCustomSteamAppId(game.steamAppID || '');
    setDealPrice(game.cheapest);

    const cover = getGameCoverArt(game);
    setCustomCoverUrl(cover);
    setSearchResults([]);

    // Trigger AI Enrichment
    await triggerEnrichment(game.external, game.steamAppID);
  };

  // Trigger Gemini enrichment
  const triggerEnrichment = async (title: string, steamAppId: string | null) => {
    setIsEnriching(true);
    setEnrichmentNotice(null);

    const { result, source, warning } = await enrichGameWithGemini(
      title,
      steamAppId,
      geminiApiKey,
      modelName
    );

    setIsEnriching(false);
    setEnrichmentResult(result);
    setEditableMainStory(result.mainStoryHours);
    setEditableMainPlusExtras(result.mainPlusExtrasHours);
    setEditableGenre(result.genre);
    setEditableVibeTag(result.vibeTag);
    setEditablePacingNote(result.pacingNote);

    if (warning) {
      setEnrichmentNotice(warning);
    } else if (source === 'gemini') {
      setEnrichmentNotice(`Enriched via ${modelName} Structured Outputs`);
    }
  };

  // Trigger manual title AI estimate
  const handleManualEstimate = async () => {
    if (!searchQuery.trim()) return;
    setCustomTitle(searchQuery.trim());
    setSelectedCheapSharkGame(null);
    setDealPrice(null);
    const steamId = customSteamAppId.trim() || null;
    if (steamId) {
      setCustomCoverUrl(`https://cdn.akamai.steamstatic.com/steam/apps/${steamId}/header.jpg`);
    } else {
      setCustomCoverUrl('');
    }
    await triggerEnrichment(searchQuery.trim(), steamId);
  };

  // Confirm and add to queue
  const handleConfirmAdd = () => {
    const title = customTitle || searchQuery.trim();
    if (!title) return;

    let cover = customCoverUrl;
    if (!cover && customSteamAppId.trim()) {
      cover = `https://cdn.akamai.steamstatic.com/steam/apps/${customSteamAppId.trim()}/header.jpg`;
    }

    onAddGame({
      title,
      steamAppID: customSteamAppId.trim() || (selectedCheapSharkGame?.steamAppID ?? null),
      coverUrl: cover || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      dealPrice: dealPrice || null,
      cheapestDealID: selectedCheapSharkGame?.cheapestDealID ?? null,
      mainStoryHours: Number(editableMainStory) || 15,
      mainPlusExtrasHours: Number(editableMainPlusExtras) || 25,
      selectedHoursMode,
      playedHours: 0,
      genre: editableGenre || 'Action-Adventure',
      vibeTag: editableVibeTag || 'Story Experience',
      pacingNote: editablePacingNote || 'Added to rolling queue.',
      status: 'backlog',
      aiOptimizationReason: undefined,
    });

    // Confetti pop!
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore if canvas not supported
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Gamepad className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Add Game to Backlog
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                  Zero-Key CheapShark
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Search via CheapShark or type any title for Gemini AI enrichment
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Search Box */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Game Title Search (CheapShark Autocomplete)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedCheapSharkGame) {
                    setSelectedCheapSharkGame(null);
                    setEnrichmentResult(null);
                  }
                }}
                placeholder="Type game title (e.g. Cyberpunk 2077, Elden Ring, Batman)..."
                className="w-full pl-10 pr-28 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                autoFocus
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin mr-1" />
                )}
                <button
                  type="button"
                  onClick={handleManualEstimate}
                  disabled={!searchQuery.trim() || isEnriching}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center gap-1 transition-all"
                  title="Directly estimate hours with Gemini without selecting CheapShark item"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>AI Estimate</span>
                </button>
              </div>
            </div>

            {/* Rate limit / Error Banner */}
            {searchError && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                {isRateLimited ? (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{searchError}</span>
              </div>
            )}

            {/* CheapShark Autocomplete Dropdown */}
            {searchResults.length > 0 && !selectedCheapSharkGame && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-800 max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5 bg-slate-900/90 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>CheapShark Results ({searchResults.length})</span>
                  <span>Select to auto-enrich</span>
                </div>
                {searchResults.map((game) => {
                  const cover = getGameCoverArt(game);
                  const priceStr = formatDealPrice(game.cheapest);

                  return (
                    <div
                      key={game.gameID}
                      onClick={() => handleSelectGame(game)}
                      className="px-3 py-2.5 flex items-center gap-3 hover:bg-slate-800/80 cursor-pointer transition-colors group"
                    >
                      {/* Thumbnail with Steam header upgrade */}
                      <div className="w-14 h-9 rounded bg-slate-800 overflow-hidden flex-shrink-0 relative border border-slate-700/60">
                        {cover ? (
                          <img
                            src={cover}
                            alt={game.external}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              // If steam header fails, fallback to game.thumb
                              if (game.thumb && e.currentTarget.src !== game.thumb) {
                                e.currentTarget.src = game.thumb;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Gamepad className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white group-hover:text-cyan-300 truncate">
                          {game.external}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          {game.steamAppID && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                              Steam: {game.steamAppID}
                            </span>
                          )}
                          <span className="text-[11px] font-medium text-emerald-400">
                            Best Deal: {priceStr}
                          </span>
                        </div>
                      </div>

                      {/* Select Action */}
                      <button className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 group-hover:bg-cyan-600 text-slate-300 group-hover:text-white transition-all">
                        Enrich & Add
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enriching Loader State */}
          {isEnriching && (
            <div className="p-8 rounded-xl bg-slate-950/60 border border-indigo-500/30 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
              <div className="relative">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Consulting Gemini ({modelName})...
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Synthesizing HowLongToBeat completion hours, genre vibes & pacing recommendations
                </p>
              </div>
            </div>
          )}

          {/* AI Enrichment Confirmation & Customization */}
          {enrichmentResult && !isEnriching && (
            <div className="space-y-4 rounded-xl bg-slate-950 border border-slate-800 p-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  {customCoverUrl && (
                    <img
                      src={customCoverUrl}
                      alt={customTitle}
                      className="w-16 h-10 rounded object-cover border border-slate-700 shadow"
                      onError={() => setCustomCoverUrl('')}
                    />
                  )}
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {customTitle}
                      {dealPrice && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {formatDealPrice(dealPrice)}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      {customSteamAppId && (
                        <span>Steam AppID: <code className="text-cyan-400">{customSteamAppId}</code></span>
                      )}
                      {enrichmentNotice && (
                        <span className="text-indigo-400 text-[11px] font-medium">
                          • {enrichmentNotice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirement: Let user toggle between Main Story and Main + Extras hours before confirming */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Target Playtime Mode for Your Queue:</span>
                  <span className="text-[11px] text-slate-400">Click to switch primary focus</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedHoursMode('mainStory')}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      selectedHoursMode === 'mainStory'
                        ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Main Story
                      </span>
                      {selectedHoursMode === 'mainStory' && (
                        <Check className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white">
                        {editableMainStory}
                      </span>
                      <span className="text-xs text-slate-400">hours</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Direct campaign playthrough
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedHoursMode('mainPlusExtras')}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      selectedHoursMode === 'mainPlusExtras'
                        ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Main + Extras
                      </span>
                      {selectedHoursMode === 'mainPlusExtras' && (
                        <Check className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white">
                        {editableMainPlusExtras}
                      </span>
                      <span className="text-xs text-slate-400">hours</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Story plus side quests & secrets
                    </p>
                  </button>
                </div>
              </div>

              {/* Editable hours, vibe & genre details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Genre
                  </label>
                  <input
                    type="text"
                    value={editableGenre}
                    onChange={(e) => setEditableGenre(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Vibe Tag
                  </label>
                  <input
                    type="text"
                    value={editableVibeTag}
                    onChange={(e) => setEditableVibeTag(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-cyan-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Pacing Recommendation
                  </label>
                  <input
                    type="text"
                    value={editablePacingNote}
                    onChange={(e) => setEditablePacingNote(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick manual entry helper if CheapShark is empty or offline */}
          {!enrichmentResult && !isEnriching && (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>Zero-Key CheapShark + Gemini Guide</span>
              </div>
              <p>
                • <strong>No RAWG key required:</strong> CheapShark handles live game search & Steam App IDs with zero setup and native browser CORS.
              </p>
              <p>
                • <strong>Gemini Structured Outputs:</strong> Google Gemini calculates precise completion hours, vibe tags, and pacing notes.
              </p>
              <p>
                • <strong>Manual Fallback:</strong> If searching an unreleased or obscure game, type its name in the box and click <strong>AI Estimate</strong>.
              </p>
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
            onClick={handleConfirmAdd}
            disabled={!enrichmentResult || isEnriching}
            className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Add to Queue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
