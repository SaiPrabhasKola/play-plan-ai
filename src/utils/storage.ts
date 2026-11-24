import type { AppSettings, Game, AdvisorMessage } from '../types/game';
import { DEFAULT_GAMES } from '../data/defaultGames';

const QUEUE_STORAGE_KEY = 'playplan_queue_v2';
const SETTINGS_STORAGE_KEY = 'playplan_settings_v2';
const ADVISOR_STORAGE_KEY = 'playplan_advisor_v2';

// Dynamic defaults from .env (VITE_GEMINI_API_KEY) or empty fallback
const ENV_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || '';
const ENV_MODEL = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) || 'gemini-4-hydrogen';

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: ENV_API_KEY,
  model: ENV_MODEL,
  hoursPerDay: 2,
};

export function loadStoredGames(): Game[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return DEFAULT_GAMES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_GAMES;
  } catch (err) {
    console.error('Failed to load games from localStorage:', err);
    return DEFAULT_GAMES;
  }
}

export function saveStoredGames(games: Game[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(games));
  } catch (err) {
    console.error('Failed to save games to localStorage:', err);
  }
}

export function loadStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      geminiApiKey: parsed.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey,
      model: parsed.model || DEFAULT_SETTINGS.model,
      hoursPerDay: Number(parsed.hoursPerDay) || DEFAULT_SETTINGS.hoursPerDay,
    };
  } catch (err) {
    console.error('Failed to load settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function loadStoredAdvisorMessages(): AdvisorMessage[] {
  try {
    const raw = localStorage.getItem(ADVISOR_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load advisor messages:', err);
    return [];
  }
}

export function saveStoredAdvisorMessages(messages: AdvisorMessage[]): void {
  try {
    localStorage.setItem(ADVISOR_STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save advisor messages:', err);
  }
}
