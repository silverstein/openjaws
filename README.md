# BEACH PANIC: Jaws Royale 🦈

A chaotic multiplayer survival party game where an AI-powered shark hunts beachgoers. Built by a dad and his 8-year-old for maximum fun and terrible shark puns.

**The shark has *personality*.** Choose from 6 shark AI types — methodical, theatrical, vengeful, philosophical, meta, or the dreaded **Dad Joke Shark** ("What do sharks eat for dinner? Fish and ships!"). The shark remembers you across games and holds grudges.

## Features

- **6 playable characters** — Influencer, Boomer Dad, Surfer Bro, Lifeguard, Marine Biologist, Spring Breaker — each with unique abilities
- **6 shark personalities** — each with distinct AI behavior, taunts, and inner monologue
- **AI-powered NPCs** — talk to beach vendors, lifeguards, and tourists with streaming chat
- **Real-time multiplayer** via Convex — create rooms, join games, sync positions
- **Shark memory system** — the shark remembers players across games and develops grudges
- **Death screen with personality taunts** — getting eaten is hilarious, not frustrating
- **Spectator mode** — watch the shark hunt after you die, with rolling AI commentary
- **Mobile touch controls** — virtual joystick and action buttons
- **Mock AI mode** — plays great without any API keys (perfect for open source contributors)

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Start Convex backend (separate terminal)
npx convex dev

# 4. Run the game
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — type your name, pick a character, and hit Play Now.

## AI Configuration (Optional)

The game works out of the box with **mock AI mode** — no API keys needed. Mock responses include full personality-driven shark behavior, NPC dialogue, and commentary.

To enable real AI responses:

| Method | Env vars | Notes |
|--------|----------|-------|
| **Vercel AI Gateway** (recommended) | `AI_GATEWAY_API_KEY` | Automatic failover, cost tracking |
| **Direct Anthropic** | `ANTHROPIC_API_KEY` | Shark brain uses Claude |
| **Direct Google** | `GOOGLE_GENERATIVE_AI_API_KEY` | NPCs use Gemini Flash |

Set `NEXT_PUBLIC_SHARK_MODEL` to override the shark's model (default: `claude-sonnet-4.5`).

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Game Engine:** Pixi.js v8 with custom water shaders
- **Backend:** Convex (real-time sync, game state, shark memory)
- **AI:** Vercel AI SDK with Anthropic/Google/OpenAI providers
- **Testing:** Vitest (85 unit tests) + Playwright (27 E2E tests)

## Game Controls

| Desktop | Mobile | Action |
|---------|--------|--------|
| WASD / Arrows | Virtual joystick | Move |
| Space | Ability button | Use character ability |
| F | Camera button | Take selfie (near shark) |
| E | Talk button | Talk to NPC |
| ESC | Exit button | Return to lobby |

## Shark Personalities

| Personality | Vibe | Sample taunt |
|-------------|------|-------------|
| Methodical | Calculating predator | "Predicted your trajectory 3.2 seconds ago." |
| Theatrical | Drama queen | "AND THE CROWD GOES WILD!" |
| Vengeful | Holds grudges | "I TOLD you I'd remember." |
| Philosophical | Existential hunter | "Am I the monster, or merely the ocean's truth?" |
| Meta | Knows it's a game | "Skill issue, honestly." |
| Dad Joke | Terrible puns | "What do you call someone eaten by a shark? LUNCH!" |

## Project Structure

```
app/                  # Next.js App Router pages
  api/                # AI endpoints (shark-brain, npc-chat, commentary)
  game/               # Game page
  lobby/              # Lobby page
components/
  game/               # Game components (GameCanvas, DeathScreen, etc.)
  ai/                 # AI UI (NPC dialogue, shark commentary)
lib/
  ai/                 # AI logic (shark brain, NPC dialogue, caching)
  game/               # Game entities, systems, effects
    entities/         # Player, Shark, NPC, items
    systems/          # Objectives, spawners, health bars
convex/               # Backend schema and functions
```

## Documentation

- [Concept & Style](./docs/01_concept_and_style.md)
- [Tech Stack](./docs/02_tech_stack.md)
- [Gameplay Features](./docs/03_gameplay_features.md)
- [AI Integration](./docs/04_ai_integration.md)
- [Backend Schema](./docs/05_backend_schema.md)
- [Development Plan](./docs/06_development_plan.md)

## Contributing

1. Fork the repo
2. `pnpm install` — no API keys needed (mock mode is the default)
3. `npx convex dev` in one terminal, `pnpm dev` in another
4. Make changes, run `pnpm test` and `pnpm typecheck`
5. Open a PR

## License

Open source. Built with love, bad puns, and an 8-year-old's sense of humor.
