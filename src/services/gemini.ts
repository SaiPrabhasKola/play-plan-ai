import { GoogleGenAI, Type } from '@google/genai';
import type {
  AIEnrichmentResult,
  Game,
  PacingMode,
  QueueOptimizationResult,
  AdvisorMessage,
} from '../types/game';

// Default model requested by user
export const DEFAULT_MODEL = 'gemini-4-hydrogen';

/**
 * Intelligent local heuristic database for instant zero-latency fallbacks
 * if Gemini API key is missing, invalid, or experiencing temporary 503 load.
 */
const CURATED_GAME_DATABASE: Record<string, AIEnrichmentResult> = {
  'days gone': {
    mainStoryHours: 36,
    mainPlusExtrasHours: 54,
    genre: 'Action-Adventure / Open World',
    vibeTag: 'Open-World Survival',
    pacingNote: 'Heavy open-world commitment; best paired with dedicated weekend gaming marathons.',
  },
  'metro 2033 redux': {
    mainStoryHours: 9,
    mainPlusExtrasHours: 13,
    genre: 'FPS / Survival Horror',
    vibeTag: 'Linear Story FPS',
    pacingNote: 'Tight, atmospheric thriller; perfect palate cleanser between open-world epics.',
  },
  'metro 2033': {
    mainStoryHours: 9,
    mainPlusExtrasHours: 13,
    genre: 'FPS / Survival Horror',
    vibeTag: 'Linear Story FPS',
    pacingNote: 'Tight, atmospheric thriller; perfect palate cleanser between open-world epics.',
  },
  'red dead redemption 2': {
    mainStoryHours: 50,
    mainPlusExtrasHours: 85,
    genre: 'Action-Adventure / Western',
    vibeTag: 'Narrative Western',
    pacingNote: 'Massive slow-burn masterpiece; space away from other large sandbox games to avoid burnout.',
  },
  'metro last light redux': {
    mainStoryHours: 10,
    mainPlusExtrasHours: 15,
    genre: 'FPS / Survival Horror',
    vibeTag: 'Linear Story FPS',
    pacingNote: 'Fast-paced narrative sequel; ideal for steady, rewarding weekday evening progress.',
  },
  'metro: last light redux': {
    mainStoryHours: 10,
    mainPlusExtrasHours: 15,
    genre: 'FPS / Survival Horror',
    vibeTag: 'Linear Story FPS',
    pacingNote: 'Fast-paced narrative sequel; ideal for steady, rewarding weekday evening progress.',
  },
  'metro exodus': {
    mainStoryHours: 15,
    mainPlusExtrasHours: 25,
    genre: 'FPS / Semi-Open World',
    vibeTag: 'Post-Apocalyptic Journey',
    pacingNote: 'Medium-length with expansive sandbox levels; concludes the Russian wasteland trilogy.',
  },
  'kingdom come deliverance': {
    mainStoryHours: 41,
    mainPlusExtrasHours: 80,
    genre: 'Historical Action RPG',
    vibeTag: 'Deep Medieval Sim',
    pacingNote: 'High-immersion RPG with steep learning curve; requires sustained mental focus.',
  },
  'kingdom come: deliverance': {
    mainStoryHours: 41,
    mainPlusExtrasHours: 80,
    genre: 'Historical Action RPG',
    vibeTag: 'Deep Medieval Sim',
    pacingNote: 'High-immersion RPG with steep learning curve; requires sustained mental focus.',
  },
  'cyberpunk 2077': {
    mainStoryHours: 25,
    mainPlusExtrasHours: 60,
    genre: 'Action RPG / Cyberpunk',
    vibeTag: 'Neon RPG Narrative',
    pacingNote: 'Engrossing urban RPG with rich side quests; give it uninterrupted play blocks.',
  },
  'elden ring': {
    mainStoryHours: 58,
    mainPlusExtrasHours: 100,
    genre: 'Action RPG / Souls-like',
    vibeTag: 'Dark Fantasy Epics',
    pacingNote: 'Vast, demanding open world; play as a primary focus to maintain combat muscle memory.',
  },
  'the witcher 3': {
    mainStoryHours: 52,
    mainPlusExtrasHours: 105,
    genre: 'Action RPG / High Fantasy',
    vibeTag: 'High Fantasy Epic',
    pacingNote: 'Enormous story RPG; alternate with bite-sized action games to prevent fatigue.',
  },
  'hades': {
    mainStoryHours: 22,
    mainPlusExtrasHours: 48,
    genre: 'Roguelike / Action',
    vibeTag: 'Fast-Paced Roguelite',
    pacingNote: 'Modular 25-minute runs; fantastic companion game between heavy story titles.',
  },
  'hollow knight': {
    mainStoryHours: 27,
    mainPlusExtrasHours: 42,
    genre: 'Metroidvania',
    vibeTag: 'Atmospheric Metroidvania',
    pacingNote: 'Exploration and precision combat; best when played consistently across consecutive days.',
  },
  'balatro': {
    mainStoryHours: 15,
    mainPlusExtrasHours: 45,
    genre: 'Deckbuilder Roguelike',
    vibeTag: 'Addictive Roguelike',
    pacingNote: 'Instant jump-in sessions; great as a casual break without narrative load.',
  },
  'portal': {
    mainStoryHours: 3,
    mainPlusExtrasHours: 5,
    genre: 'Puzzle Platformer',
    vibeTag: 'Linear Masterpiece',
    pacingNote: 'Ultra-lean afternoon triumph; best quick palate cleanser in gaming.',
  },
  'portal 2': {
    mainStoryHours: 8,
    mainPlusExtrasHours: 13,
    genre: 'Puzzle Platformer',
    vibeTag: 'Clever Comedy Puzzle',
    pacingNote: 'Brisk, hilarious campaign; slot between heavy narrative games for an easy win.',
  },
  'god of war': {
    mainStoryHours: 21,
    mainPlusExtrasHours: 33,
    genre: 'Action-Adventure',
    vibeTag: 'Cinematic Mythic Action',
    pacingNote: 'Balanced cinematic pacing; steady 2-hour daily sessions finish it in under two weeks.',
  },
};

/**
 * Clean heuristic generator when exact title is not in predefined table
 */
function generateHeuristicEstimate(title: string): AIEnrichmentResult {
  const lower = title.toLowerCase();

  if (lower.includes('rpg') || lower.includes('final fantasy') || lower.includes('persona') || lower.includes('scrolls')) {
    return {
      mainStoryHours: 45,
      mainPlusExtrasHours: 85,
      genre: 'Role-Playing Game (RPG)',
      vibeTag: 'Deep Story RPG',
      pacingNote: 'Substantial time investment; best experienced with dedicated, uninterrupted sessions.',
    };
  }

  if (lower.includes('doom') || lower.includes('wolfenstein') || lower.includes('halo') || lower.includes('call of duty')) {
    return {
      mainStoryHours: 10,
      mainPlusExtrasHours: 16,
      genre: 'First-Person Shooter',
      vibeTag: 'Adrenaline FPS',
      pacingNote: 'High intensity linear action; perfect for quick weeknight completions.',
    };
  }

  if (lower.includes('rogue') || lower.includes('slay') || lower.includes('binding') || lower.includes('risk of rain')) {
    return {
      mainStoryHours: 20,
      mainPlusExtrasHours: 50,
      genre: 'Roguelike / Roguelite',
      vibeTag: 'Quick Run Loop',
      pacingNote: 'Flexible bite-sized gameplay; slot alongside long narrative epics.',
    };
  }

  if (lower.includes('creed') || lower.includes('far cry') || lower.includes('horizon') || lower.includes('spider-man')) {
    return {
      mainStoryHours: 28,
      mainPlusExtrasHours: 50,
      genre: 'Open-World Action',
      vibeTag: 'Open-World Exploration',
      pacingNote: 'Sprawling map with collectible loops; balance with short games to avoid map fatigue.',
    };
  }

  return {
    mainStoryHours: 18,
    mainPlusExtrasHours: 32,
    genre: 'Action-Adventure',
    vibeTag: 'Story Driven Journey',
    pacingNote: 'Well-rounded length; provides great narrative momentum across a few weeks.',
  };
}

/**
 * Enrich game details using Gemini Structured Outputs (responseSchema)
 */
export async function enrichGameWithGemini(
  title: string,
  steamAppID: string | null,
  apiKey: string,
  modelName: string = DEFAULT_MODEL
): Promise<{ result: AIEnrichmentResult; source: 'gemini' | 'fallback'; warning?: string }> {
  const normTitle = title.trim().toLowerCase();

  // If no API key provided, fall back immediately without network delay
  if (!apiKey || apiKey.trim() === '') {
    const fallback = CURATED_GAME_DATABASE[normTitle] || generateHeuristicEstimate(title);
    return {
      result: fallback,
      source: 'fallback',
      warning: 'No Google AI Studio key configured. Used intelligent estimation fallback.',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const prompt = `You are a precision video game completion time and pacing analyst.
Analyze the following video game:
Title: "${title}"
Steam App ID: ${steamAppID || 'N/A'}

Provide:
1. mainStoryHours: realistic median hours to beat the main storyline (based on HowLongToBeat standards).
2. mainPlusExtrasHours: realistic median hours to finish main story plus primary side quests.
3. genre: accurate genre description (e.g. "Linear Story FPS", "Open-World Action RPG").
4. vibeTag: concise 2-3 word vibe badge (e.g. "Open-World Survival", "Linear Story FPS", "Narrative Western", "Cozy Puzzle").
5. pacingNote: exactly 1 clear sentence offering practical advice on how this game fits in a gamer's rolling queue (e.g. ideal palate cleanser, burnout risk, or marathon title).`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainStoryHours: { type: Type.NUMBER, description: 'Median hours to beat the main story' },
            mainPlusExtrasHours: { type: Type.NUMBER, description: 'Median hours for main story + side quests' },
            genre: { type: Type.STRING, description: 'Accurate game genre' },
            vibeTag: { type: Type.STRING, description: 'Concise 2-3 word vibe tag' },
            pacingNote: { type: Type.STRING, description: '1-sentence advice for rolling queue placement' },
          },
          required: ['mainStoryHours', 'mainPlusExtrasHours', 'genre', 'vibeTag', 'pacingNote'],
        },
      },
    });

    if (!response.text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed: AIEnrichmentResult = JSON.parse(response.text);

    // Validate parsed numbers
    const mainStoryHours = Math.max(1, Math.round(Number(parsed.mainStoryHours) || 15));
    const mainPlusExtrasHours = Math.max(mainStoryHours, Math.round(Number(parsed.mainPlusExtrasHours) || (mainStoryHours * 1.5)));

    return {
      result: {
        mainStoryHours,
        mainPlusExtrasHours,
        genre: parsed.genre || 'Action-Adventure',
        vibeTag: parsed.vibeTag || 'Story Experience',
        pacingNote: parsed.pacingNote || 'Solid title for regular evening play sessions.',
      },
      source: 'gemini',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[PlayPlanAI] Gemini enrichment failed, using fallback: ${errorMsg}`);

    const fallback = CURATED_GAME_DATABASE[normTitle] || generateHeuristicEstimate(title);
    return {
      result: fallback,
      source: 'fallback',
      warning: `Gemini API notice: ${errorMsg}. Switched to local estimation.`,
    };
  }
}

/**
 * Optimize Queue using Gemini Structured Outputs (responseSchema)
 */
export async function optimizeQueueWithGemini(
  games: Game[],
  hoursPerDay: number,
  pacingMode: PacingMode,
  apiKey: string,
  modelName: string = DEFAULT_MODEL
): Promise<{ result: QueueOptimizationResult; source: 'gemini' | 'fallback'; warning?: string }> {
  // Filter active (backlog & playing) games
  const activeGames = games.filter(g => g.status !== 'completed');

  if (activeGames.length === 0) {
    return {
      result: {
        optimizedOrder: [],
        strategySummary: 'Queue is currently empty or all games are completed.',
      },
      source: 'gemini',
    };
  }

  // Fallback algorithmic optimizer
  const generateFallbackOptimization = (): QueueOptimizationResult => {
    let sorted = [...activeGames];

    if (pacingMode === 'more_finishes') {
      // Sort ascending by remaining hours (quick wins first)
      sorted.sort((a, b) => {
        const remA = Math.max(0, (a.selectedHoursMode === 'mainStory' ? a.mainStoryHours : a.mainPlusExtrasHours) - a.playedHours);
        const remB = Math.max(0, (b.selectedHoursMode === 'mainStory' ? b.mainStoryHours : b.mainPlusExtrasHours) - b.playedHours);
        return remA - remB;
      });

      return {
        optimizedOrder: sorted.map((g, idx) => ({
          gameId: g.id,
          reason: `Positioned #${idx + 1} to maximize quick completions and maintain dopamine momentum.`,
        })),
        strategySummary: 'Prioritized shortest remaining games first to secure fast finishes and build backlog momentum.',
      };
    }

    if (pacingMode === 'longer_games') {
      // Sort descending by remaining hours (front-load massive epics)
      sorted.sort((a, b) => {
        const remA = Math.max(0, (a.selectedHoursMode === 'mainStory' ? a.mainStoryHours : a.mainPlusExtrasHours) - a.playedHours);
        const remB = Math.max(0, (b.selectedHoursMode === 'mainStory' ? b.mainStoryHours : b.mainPlusExtrasHours) - b.playedHours);
        return remB - remA;
      });

      return {
        optimizedOrder: sorted.map((g, idx) => ({
          gameId: g.id,
          reason: `Tackled #${idx + 1} to conquer major long-term epic milestones early.`,
        })),
        strategySummary: 'Front-loaded deep, extensive campaigns so major investments are conquered upfront.',
      };
    }

    // 'balanced': Sandwich large open-world epics (>20h) between shorter/linear games (<=20h)
    const longGames = sorted.filter(g => (g.selectedHoursMode === 'mainStory' ? g.mainStoryHours : g.mainPlusExtrasHours) > 20);
    const shortGames = sorted.filter(g => (g.selectedHoursMode === 'mainStory' ? g.mainStoryHours : g.mainPlusExtrasHours) <= 20);
    const balanced: Game[] = [];

    let lIdx = 0;
    let sIdx = 0;
    while (lIdx < longGames.length || sIdx < shortGames.length) {
      if (sIdx < shortGames.length) balanced.push(shortGames[sIdx++]);
      if (lIdx < longGames.length) balanced.push(longGames[lIdx++]);
    }

    return {
      optimizedOrder: balanced.map((g, idx) => {
        const hours = (g.selectedHoursMode === 'mainStory' ? g.mainStoryHours : g.mainPlusExtrasHours);
        const isShort = hours <= 20;
        return {
          gameId: g.id,
          reason: isShort
            ? `Positioned #${idx + 1} as a refreshing palate cleanser to avert RPG burnout.`
            : `Positioned #${idx + 1} as a flagship deep-dive campaign backed by proper pacing.`,
        };
      }),
      strategySummary: 'Alternated massive sandbox epics with concise linear games to completely avoid gamer fatigue.',
    };
  };

  // If no API key, use algorithmic fallback
  if (!apiKey || apiKey.trim() === '') {
    return {
      result: generateFallbackOptimization(),
      source: 'fallback',
      warning: 'No Gemini API key configured. Applied algorithmic pacing optimization.',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const queueDetails = activeGames.map((g, index) => {
      const targetHours = g.selectedHoursMode === 'mainStory' ? g.mainStoryHours : g.mainPlusExtrasHours;
      const remainingHours = Math.max(0, targetHours - g.playedHours);
      return {
        gameId: g.id,
        title: g.title,
        genre: g.genre,
        vibeTag: g.vibeTag,
        targetHours,
        remainingHours,
        currentPosition: index + 1,
      };
    });

    const prompt = `You are an elite video game backlog architect and pacing strategist.
Analyze this player's active queue:
${JSON.stringify(queueDetails, null, 2)}

User Profile:
- Daily playtime capacity: ${hoursPerDay} hours/day
- Target Pacing Mode: "${pacingMode}" (Options: 'balanced' = prevent burnout by sandwiching long games between short ones; 'more_finishes' = quick wins first; 'longer_games' = frontload massive commitments)

Instructions:
1. Reorder ALL provided gameIds into the optimal play sequence according to the requested pacing mode.
2. For every game in the reordered list, provide a punchy 1-line reason explaining why it belongs at that exact spot in the sequence.
3. Provide a 1-2 sentence overall strategySummary.
Every gameId in the input MUST be present in optimizedOrder.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimizedOrder: {
              type: Type.ARRAY,
              description: 'Reordered list of all games',
              items: {
                type: Type.OBJECT,
                properties: {
                  gameId: { type: Type.STRING, description: 'Matching gameId from input' },
                  reason: { type: Type.STRING, description: '1-line reason for this placement' },
                },
                required: ['gameId', 'reason'],
              },
            },
            strategySummary: { type: Type.STRING, description: '1-2 sentence high-level summary of the optimization strategy' },
          },
          required: ['optimizedOrder', 'strategySummary'],
        },
      },
    });

    if (!response.text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed: QueueOptimizationResult = JSON.parse(response.text);

    // Validate that returned gameIds match
    const returnedIds = new Set(parsed.optimizedOrder.map(item => item.gameId));
    const missing = activeGames.filter(g => !returnedIds.has(g.id));
    if (missing.length > 0) {
      // Append any missing items
      missing.forEach(g => {
        parsed.optimizedOrder.push({
          gameId: g.id,
          reason: 'Maintained in sequence to preserve full queue.',
        });
      });
    }

    return {
      result: parsed,
      source: 'gemini',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[PlayPlanAI] Gemini queue optimization failed, using fallback: ${errorMsg}`);

    return {
      result: generateFallbackOptimization(),
      source: 'fallback',
      warning: `Gemini notice: ${errorMsg}. Switched to algorithmic queue optimization.`,
    };
  }
}

/**
 * Ask AI Advisor ("Advisor / Should I Buy?" Drawer)
 */
export async function askAdvisorWithGemini(
  userQuery: string,
  _history: AdvisorMessage[],
  games: Game[],
  hoursPerDay: number,
  apiKey: string,
  modelName: string = DEFAULT_MODEL
): Promise<{ reply: string; source: 'gemini' | 'fallback'; warning?: string }> {
  // Compute queue context
  const activeGames = games.filter(g => g.status !== 'completed');
  const completedGames = games.filter(g => g.status === 'completed');
  const totalRemainingHours = activeGames.reduce((acc, g) => {
    const target = g.selectedHoursMode === 'mainStory' ? g.mainStoryHours : g.mainPlusExtrasHours;
    return acc + Math.max(0, target - g.playedHours);
  }, 0);

  const daysToFinish = hoursPerDay > 0 ? Math.ceil(totalRemainingHours / hoursPerDay) : 0;
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + daysToFinish);
  const formattedFinishDate = finishDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (!apiKey || apiKey.trim() === '') {
    // Helpful local advisor response
    const advice = `I can help you review your backlog!
Currently, your queue has **${activeGames.length} active games** totaling **${totalRemainingHours} remaining hours**.
At your daily rate of **${hoursPerDay} hrs/day**, your projected finish date is **${formattedFinishDate}** (~${daysToFinish} days).

If you are considering buying a game or deal on Steam sale:
- **Rule of thumb**: If your backlog exceeds 50+ hours, buying new games often triggers backlog debt unless you plan to play it immediately within 48 hours.
- To enable full deep-reasoning Steam sale deal evaluations and tailored personalized advice, enter your **Google AI Studio (Gemini) key** in Settings!`;

    return {
      reply: advice,
      source: 'fallback',
      warning: 'Enter your Google AI Studio API key in Settings to unlock live Gemini 4 reasoning.',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const queueSummary = activeGames.map(g => ({
      title: g.title,
      status: g.status,
      remainingHours: Math.max(0, (g.selectedHoursMode === 'mainStory' ? g.mainStoryHours : g.mainPlusExtrasHours) - g.playedHours),
      genre: g.genre,
      vibeTag: g.vibeTag,
    }));

    const systemPrompt = `You are "Play Plan AI Advisor", an empathetic, razor-sharp gaming backlog advisor and Steam sale consultant.
You help players finish games, eliminate backlog guilt, and make smart buying decisions (e.g. evaluating Steam sale deals).

Player's Current Context:
- Active games in queue: ${JSON.stringify(queueSummary)}
- Completed games count: ${completedGames.length}
- Daily gaming capacity: ${hoursPerDay} hours/day
- Total backlog hours remaining: ${totalRemainingHours} hours
- Projected queue completion date: ${formattedFinishDate} (in ${daysToFinish} days)

Behavior Guidelines:
1. Always evaluate questions with their current queue in mind.
2. If they ask about buying a game or paste a Steam deal:
   - Critically evaluate if the discount is worth adding to their current ${totalRemainingHours}h queue.
   - Tell them directly whether they should BUY NOW, WAIT, or SKIP based on whether they will realistically play it before the next seasonal Steam sale.
3. Keep answers concise, actionable, formatting with clean Markdown bullet points.`;

    const chatContents = [
      { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${userQuery}` }] },
    ];

    const response = await ai.models.generateContent({
      model: modelName,
      contents: chatContents,
    });

    const reply = response.text || 'I analyzed your queue, but could not generate a response. Please try again.';

    return {
      reply,
      source: 'gemini',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[PlayPlanAI] Gemini advisor chat failed: ${errorMsg}`);

    return {
      reply: `**Notice:** Gemini API request encountered an issue: ${errorMsg}.
Here is your current status:
- Active Games: **${activeGames.length}**
- Remaining Backlog Hours: **${totalRemainingHours} hrs**
- Projected Finish Date: **${formattedFinishDate}**`,
      source: 'fallback',
      warning: `Gemini notice: ${errorMsg}`,
    };
  }
}
