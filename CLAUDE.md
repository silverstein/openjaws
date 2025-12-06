# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BEACH PANIC: Jaws Royale - A chaotic multiplayer survival party game built with Next.js, Pixi.js, and Convex for real-time synchronization. The game features AI-driven sharks, multiple player archetypes, and dynamic beach-themed objectives.

## Current Status

- **Build**: ✅ Passing (0 TypeScript errors)
- **Tests**: ✅ 85/85 passing with Vitest 4.x
- **Game**: Playable single-player with AI shark, 7 NPCs, and dialogue system

See `STATUS.md` for detailed current state and `docs/DEVELOPMENT_PLAN.md` for active work.

## Essential Commands

```bash
# Development
npm run dev              # Start development server with Turbopack on http://localhost:3000
npx convex dev          # Start Convex backend in development mode (run in separate terminal)

# Build & Production
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run Next.js linter
npm run lint:fix        # Auto-fix linting issues
npm run typecheck       # Run TypeScript type checking

# Testing
npm run test            # Run tests with Vitest
npm run test:ui         # Run tests with UI
npm run test:coverage   # Run tests with coverage report
```

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 16.x (App Router), React 19, TypeScript (strict mode)
- **Game Engine**: Pixi.js v8 with custom water shaders
- **Backend**: Convex for real-time data sync and game state
- **AI**: Vercel AI SDK with Anthropic/Google/OpenAI providers
- **Styling**: Tailwind CSS v4
- **State**: Zustand for client state management
- **Testing**: Vitest 4.x with class-based mocks

### Key Architectural Patterns

1. **Real-time Multiplayer** (partially implemented):
   - Game state schema in `convex/games.ts`
   - Player management in `convex/players.ts`
   - Real-time updates via Convex subscriptions

2. **Entity Component System**: Game entities in `/lib/game/entities/`
   - `Player.ts` - Player with abilities, stamina, archetypes
   - `Shark.ts` - Shark with AI state machine
   - `AIShark.ts` - Extended shark with full AI integration
   - `NPC.ts` - Beach NPCs with dialogue support

3. **AI Integration**: Multiple AI systems
   - Shark AI (`/lib/ai/sharkBrain.ts`) - Decision making
   - NPC dialogue (`/lib/ai/npcDialogue.ts`) - Streaming chat
   - Commentary (`/lib/ai/commentaryAI.ts`) - Dynamic narration
   - Response cache (`/lib/ai/responseCache.ts`) - Quality-weighted caching

4. **Game Systems**: Modular systems in `/lib/game/systems/`
   - Collision detection
   - Movement system
   - Ability system
   - Objective management

5. **Shaders**: Custom Pixi.js v8 shaders
   - Water shader (`/lib/game/shaders/WaterShader.ts`)
   - Chromatic aberration (`/lib/game/filters/ChromaticAberration.ts`)

### Critical Files

| File | Role |
|------|------|
| `components/game/GameCanvas.tsx` | Core game rendering, game loop, input handling |
| `lib/game/entities/Player.ts` | Player entity with movement, abilities, stamina |
| `lib/game/entities/Shark.ts` | Shark AI state machine |
| `lib/game/entities/NPC.ts` | Beach NPCs with interaction system |
| `components/ai/NPCDialogue.tsx` | NPC chat UI with streaming |
| `convex/schema.ts` | Database schema definitions |
| `convex/_generated/` | Auto-generated Convex code (DO NOT EDIT) |

### Game Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Move player |
| Space | Activate ability |
| F | Take selfie (near shark) |
| E | Talk to NPC (when nearby) |
| ESC | Return to lobby |

## Development Workflow

1. Always run `npx convex dev` in a separate terminal for backend
2. Use `npm run dev` for frontend development
3. Check `/docs/` directory for detailed feature documentation
4. Test AI features in isolation using `/app/ai-demo/` routes
5. Run `npm test` before committing changes
6. Check `docs/DEVELOPMENT_PLAN.md` for current sprint tasks

## Environment Variables Required

```
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
```

## Code Style

- TypeScript strict mode enabled - no implicit any
- 2-space indentation, 100-character line width
- Biome for formatting and linting
- Functional components with hooks
- Server components by default in App Router
- Class-based mocks for Vitest 4.x (see `docs/TESTING_SETUP.md`)

## Viewport Considerations

The game is designed to be responsive:
- NPCs reposition on window resize
- UI elements use responsive Tailwind classes (`sm:`, `md:`)
- Entities are kept within screen bounds on resize
- Controls hint adapts to screen size
