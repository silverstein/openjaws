# Contributing to Beach Panic: Jaws Royale

Thanks for wanting to help make the shark funnier! Here's how to get started.

## Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/openjaws.git
cd openjaws

# Install dependencies
pnpm install

# Start Convex backend (separate terminal)
npx convex dev

# Start the game
pnpm dev
```

No API keys needed — the game runs in **mock AI mode** by default with full shark personality support.

## Making Changes

1. Create a branch: `git checkout -b my-feature`
2. Make your changes
3. Run checks:
   ```bash
   pnpm typecheck    # TypeScript
   pnpm test         # Unit tests
   pnpm lint         # Linting
   ```
4. Commit with a clear message
5. Open a PR

## What We'd Love Help With

- **New shark personalities** — add to `lib/ai/sharkBrain.ts` and `lib/ai/mockResponses.ts`
- **New character archetypes** — add to `lib/game/entities/Player.ts`
- **Better sprites/art** — replace placeholders in `public/assets/sprites/`
- **Sound effects** — add audio files to `public/audio/`
- **Bug fixes** — especially multiplayer edge cases
- **Mobile improvements** — touch controls and responsive UI

## Code Style

- TypeScript strict mode — no `any` unless truly unavoidable
- Functional React components with hooks
- 2-space indentation
- Biome for formatting (`pnpm lint:fix`)

## Project Structure

| Directory | What's there |
|-----------|-------------|
| `app/` | Next.js pages and API routes |
| `components/game/` | Game UI components |
| `lib/game/entities/` | Player, Shark, NPC classes |
| `lib/ai/` | AI logic, prompts, caching |
| `convex/` | Backend schema and functions |
| `public/assets/` | Sprites and audio |

## Adding a Shark Personality

The easiest fun contribution — here's how:

1. Add the personality name to `convex/schema.ts` (in the `sharkPersonality` union)
2. Add the personality type to `lib/ai/sharkBrain.ts` (`SharkPersonality` type + `personalityPrompts`)
3. Add mock responses to `lib/ai/mockResponses.ts` (`personalityResponses` + `personalityTaunts`)
4. Add death screen taunts to `components/game/DeathScreen.tsx`
5. Add spectator commentary to `components/game/SpectatorOverlay.tsx`
6. Add to the API validation schema in `app/api/shark-brain/route.ts`

## Questions?

Open an issue — we're friendly and the shark only bites in-game.
