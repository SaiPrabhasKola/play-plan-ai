# Play Plan AI 🎮✨

> **AI-Powered Video Game Backlog Pacing Optimizer & Steam Sale Advisor**  
> Powered by a zero-key **CheapShark API** + **Google Gemini API (`@google/genai`)** pipeline.

---

## 🌟 Key Highlights

- **Zero-Key CheapShark Integration**: Live game search, Steam App IDs, and lowest tracked deal prices with **zero API key** and native browser CORS support.
- **RAWG Completely Removed**: No RAWG API key field, no `api.rawg.io` calls, and zero rate-limit hassles from third-party catalog keys. The only key needed is your Google AI Studio key!
- **High-Res Steam Header Art**: Automatically resolves and upgrades cover art to Steam's official CDN headers (`https://cdn.akamai.steamstatic.com/steam/apps/${steamAppID}/header.jpg`).
- **Pre-Populated Backlog**: Comes with 6 pre-populated backlog games with their official Steam header URLs:
  1. *Days Gone* (`1259420`)
  2. *Metro 2033 Redux* (`286690`)
  3. *Red Dead Redemption 2* (`1174180`)
  4. *Metro: Last Light Redux* (`287390`)
  5. *Metro Exodus* (`412020`)
  6. *Kingdom Come: Deliverance* (`379430`)
- **Gemini Hybrid Enrichment (`gemini-4-hydrogen`)**:
  - Leverages Structured Outputs (`responseSchema` via `@google/genai`) to generate:
    - `mainStoryHours` (number)
    - `mainPlusExtrasHours` (number)
    - `genre` (string)
    - `vibeTag` (e.g. "Open-World Survival", "Linear Story FPS", "Narrative Western")
    - `pacingNote` (1-sentence tip on rolling queue fit)
  - Toggle between **Main Story** and **Main + Extras** hours before confirming, or edit hours directly on any queue card!
- **AI Queue Optimizer**:
  - Reorders your queue to eliminate gamer burnout and decision paralysis.
  - Three pacing modes:
    - **Balanced**: Sandwiches large open-world epics (>20h) between short linear games (≤20h).
    - **More Finishes**: Prioritizes quick wins to build dopamine momentum.
    - **Longer Games**: Frontloads massive epic commitments.
  - Generates a punchy 1-line reason per game and a high-level strategy summary.
  - One-click apply and undo support.
- **Advisor / "Should I Buy?" Drawer**:
  - Slide-over assistant with full context of your current queue, remaining hours, and projected completion date.
  - Evaluates Steam sale deals you paste in, advising whether to **Buy Now**, **Wait**, or **Skip** based on backlog debt.
- **Resilient Fallback Engine**:
  - CheapShark 429 rate limit detection and manual fallback entry.
  - Offline / no-key / 503 high-demand state gracefully falls back to intelligent curated estimation without crashing or console errors.

---

## 🛠️ Architecture

```
[User Input]
     │
     ├── 350ms Debounced GET ──► CheapShark API (Zero-Key, Native CORS)
     │                                │
     │                                ├── Game Title ('external')
     │                                ├── Steam App ID ('steamAppID')
     │                                ├── Deal Price ('cheapest')
     │                                └── Steam Header Art Upgrade (cdn.akamai.steamstatic.com)
     │
     └── "AI Estimate & Add" ──► Google Gemini API (@google/genai)
                                      │
                                      ├── Model: gemini-4-hydrogen
                                      ├── Structured Outputs (responseSchema)
                                      └── Outputs: mainStoryHours, mainPlusExtrasHours,
                                                   genre, vibeTag, pacingNote
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (tested on v22)
- pnpm / npm

### Installation

```bash
# Clone the repository
git clone https://github.com/SaiPrabhasKola/play-plan-ai.git
cd play-plan-ai

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Production Build

```bash
pnpm build
pnpm preview
```

---

## 🔑 Configuration

1. Click the **Settings** gear icon in the top right.
2. Enter your **Google AI Studio (Gemini) API Key**.
3. Select your model (default: `gemini-4-hydrogen`).
4. Set your daily gaming pace (e.g. `2 hours / day`).

---

## 📄 License

MIT License. Crafted for gamers who want to conquer their backlogs guilt-free.
