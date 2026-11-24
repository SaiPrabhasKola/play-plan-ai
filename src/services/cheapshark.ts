import type { CheapSharkGame } from '../types/game';

export interface CheapSharkSearchResponse {
  games: CheapSharkGame[];
  error?: string;
  isRateLimited?: boolean;
}

/**
 * CheapShark API service
 * Fully zero-key, natively CORS-compliant in modern browsers.
 */
export async function searchCheapSharkGames(
  query: string,
  limit: number = 6,
  signal?: AbortSignal
): Promise<CheapSharkSearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { games: [] };
  }

  try {
    const url = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(trimmed)}&limit=${limit}`;
    const response = await fetch(url, {
      signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status === 429) {
      return {
        games: [],
        error: 'CheapShark rate limit reached (429). Please wait a moment or enter game details manually.',
        isRateLimited: true,
      };
    }

    if (!response.ok) {
      return {
        games: [],
        error: `CheapShark API returned error status ${response.status}: ${response.statusText}`,
      };
    }

    const data: CheapSharkGame[] = await response.json();

    if (!Array.isArray(data)) {
      return { games: [] };
    }

    return { games: data };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { games: [] };
    }

    const message = err instanceof Error ? err.message : 'Unknown network error';
    return {
      games: [],
      error: `Could not reach CheapShark: ${message}`,
    };
  }
}

/**
 * Returns high-resolution Steam header art if steamAppID is present,
 * otherwise falls back to CheapShark's thumbnail.
 */
export function getGameCoverArt(game: { steamAppID?: string | null; thumb?: string }): string {
  if (game.steamAppID && game.steamAppID.trim() !== '') {
    return `https://cdn.akamai.steamstatic.com/steam/apps/${game.steamAppID}/header.jpg`;
  }
  return game.thumb || '';
}

/**
 * Formats deal price cleanly ($0.00 -> Free, $XX.XX)
 */
export function formatDealPrice(cheapest: string | null | undefined): string {
  if (!cheapest) return 'N/A';
  const val = parseFloat(cheapest);
  if (isNaN(val)) return `$${cheapest}`;
  if (val === 0) return 'Free';
  return `$${val.toFixed(2)}`;
}
