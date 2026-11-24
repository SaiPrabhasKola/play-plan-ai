export type PacingMode = 'balanced' | 'more_finishes' | 'longer_games';

export type GameStatus = 'backlog' | 'playing' | 'completed';

export type HoursMode = 'mainStory' | 'mainPlusExtras';

export interface Game {
  id: string;
  title: string;
  steamAppID: string | null;
  coverUrl: string;
  dealPrice: string | null;
  cheapestDealID?: string | null;
  mainStoryHours: number;
  mainPlusExtrasHours: number;
  selectedHoursMode: HoursMode;
  playedHours: number;
  genre: string;
  vibeTag: string;
  pacingNote: string;
  status: GameStatus;
  order: number;
  addedAt: number;
  aiOptimizationReason?: string;
}

export interface CheapSharkGame {
  gameID: string;
  steamAppID: string | null;
  cheapest: string;
  cheapestDealID: string | null;
  external: string;
  internalName: string;
  thumb: string;
}

export interface AIEnrichmentResult {
  mainStoryHours: number;
  mainPlusExtrasHours: number;
  genre: string;
  vibeTag: string;
  pacingNote: string;
}

export interface OptimizedQueueItem {
  gameId: string;
  reason: string;
}

export interface QueueOptimizationResult {
  optimizedOrder: OptimizedQueueItem[];
  strategySummary: string;
}

export interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AppSettings {
  geminiApiKey: string;
  model: string;
  hoursPerDay: number;
}
