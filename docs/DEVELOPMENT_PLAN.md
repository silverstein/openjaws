# Beach Panic Development Plan

*Last updated: December 2024*
*Plan managed by: Parallel subagents - UPDATE THIS DOC AS YOU WORK*

## Overview

This document tracks the parallel development of remaining features for Beach Panic. Each section is owned by a subagent who must update their status as they progress.

---

## Track 1: Multiplayer (Convex Real-time)

**Status**: 🟢 Complete
**Owner**: Subagent 1

### Objective
Implement real-time multiplayer using Convex subscriptions so multiple players can play together.

### Tasks
- [x] Review existing Convex schema in `convex/schema.ts`
- [x] Implement game room creation/joining in `convex/games.ts`
- [x] Add real-time player position sync
- [x] Sync shark state across clients
- [x] Handle player join/leave events
- [x] Add lobby UI for game selection
- [x] Build passes with 0 TypeScript errors

### Key Files
- `convex/schema.ts` - Database schema ✅
- `convex/games.ts` - Game mutations/queries ✅
- `convex/players.ts` - Player management ✅
- `convex/sharks.ts` - Shark state sync ✅ Created
- `hooks/useMultiplayerGame.ts` - Multiplayer networking hook ✅ Created
- `components/game/MultiplayerGameCanvas.tsx` - Multiplayer game component ✅ Created
- `app/lobby/page.tsx` - Lobby UI with game list ✅ Updated
- `app/game/page.tsx` - Game page with solo/multiplayer routing ✅ Updated

### Notes
- ✅ Uses `useQuery` for real-time subscriptions
- ✅ Position updates throttled to 20/sec (50ms) to reduce bandwidth
- ✅ First shark player is designated as "host" (controls AI)
- ✅ Non-host clients receive shark position via Convex sync
- ✅ Lobby shows active games with player counts
- ✅ Players can create or join existing games
- ✅ Game supports both solo practice mode and multiplayer
- ⚠️ Network latency interpolation not yet implemented
- ⚠️ Multiplayer tested in development only - needs multi-window testing

---

## Track 2: Game Assets & Sprites

**Status**: 🟢 Complete
**Owner**: Subagent 2

### Objective
Replace colored shapes with proper game sprites and visual assets.

### Tasks
- [x] Research/source beach-themed sprite assets (or create placeholders)
- [x] Create sprite loading system with Pixi.js Assets
- [x] Replace Player colored circle with character sprite
- [x] Replace Shark graphics with shark sprite (with animation)
- [x] Replace NPC graphics with character sprites
- [x] Add beach environment sprites (umbrella, towels, etc.)
- [x] Add water splash/effect sprites
- [x] Ensure sprites scale properly for viewport

### Key Files
- `lib/game/entities/Player.ts` - Player rendering ✅ Updated with Sprite support
- `lib/game/entities/Shark.ts` - Shark rendering ✅ Updated with Sprite support
- `lib/game/entities/NPC.ts` - NPC rendering ✅ Updated with Sprite support
- `public/assets/sprites/` - Asset storage ✅ Created with PNG sprites
- `lib/game/AssetLoader.ts` - Asset management ✅ Created with Pixi.js v8 Assets API
- `components/game/GameCanvas.tsx` - Added asset preloading ✅
- `scripts/generate-placeholder-sprites.ts` - Sprite generation ✅
- `scripts/convert-svg-to-png.ts` - SVG to PNG conversion ✅

### Notes
- ✅ Using Pixi.js v8 Assets API for loading
- ✅ Created 18 placeholder sprites (6 players, 2 shark, 7 NPCs, 3 beach items)
- ✅ Sprites are PNG format, optimized for web (<10KB each)
- ✅ Fallback to Graphics rendering if assets fail to load
- ✅ Added loading screen with progress bar
- ✅ Separated sprite rendering from visual effects (water ripples, ability glow)

---

## Track 3: E2E Tests (Playwright)

**Status**: 🟢 Complete
**Owner**: Subagent 3

### Objective
Add end-to-end tests using Playwright to verify game functionality.

### Tasks
- [x] Install and configure Playwright
- [x] Create test for lobby page load
- [x] Create test for game page load and canvas render
- [x] Create test for player movement (keyboard input)
- [x] Create test for NPC interaction (E key)
- [x] Create test for game navigation flow
- [x] Add CI workflow for E2E tests
- [x] Document test running in TESTING_SETUP.md

### Key Files
- `playwright.config.ts` - Playwright config ✅
- `e2e/` - E2E test directory ✅
  - `lobby.spec.ts` - Lobby page tests
  - `game-page.spec.ts` - Game page rendering tests
  - `game-controls.spec.ts` - Keyboard controls tests
  - `npc-interaction.spec.ts` - NPC interaction tests
  - `game-navigation.spec.ts` - Navigation flow tests
- `.github/workflows/test.yml` - CI workflow ✅
- `docs/TESTING_SETUP.md` - Documentation ✅
- `package.json` - Added E2E test scripts ✅

### Notes
- 27 E2E tests across 5 test files
- Tests run in Chromium, Firefox, and WebKit
- Auto-starts production server for testing
- Comprehensive keyboard input testing
- Build passes with 0 TypeScript errors
- All 85 unit tests still passing
- Vitest config updated to exclude E2E tests

---

## Track 4: Mobile Touch Controls

**Status**: 🟢 Complete
**Owner**: Subagent 4

### Objective
Add touch controls for mobile/tablet devices so the game is playable without keyboard.

### Tasks
- [x] Create virtual joystick component for movement
- [x] Add touch buttons for abilities (Space, F, E)
- [x] Detect touch device and show/hide controls
- [x] Handle touch events in GameCanvas
- [x] Test on various screen sizes
- [x] Add haptic feedback (if supported)
- [x] Update controls hint for touch devices

### Key Files
- `components/game/TouchControls.tsx` - Touch UI ✅ Created
- `components/game/VirtualJoystick.tsx` - Joystick ✅ Created
- `components/game/GameCanvas.tsx` - Integrate touch ✅ Updated
- `hooks/useIsTouchDevice.ts` - Detection hook ✅ Created

### Notes
- ✅ Uses pointer events for cross-platform support
- ✅ Joystick is semi-transparent with backdrop blur
- ✅ Positioned to avoid UI overlap (joystick bottom-left, buttons bottom-right)
- ✅ Includes haptic feedback via navigator.vibrate when available
- ✅ Shows/hides based on device detection (touch vs keyboard)
- ✅ Talk button appears conditionally when near NPC
- ✅ Controls hint updates for touch devices with instructional text

---

## Track 5: Sound Effects & Music

**Status**: 🟢 Complete
**Owner**: Subagent 5

### Objective
Add audio to enhance the game atmosphere.

### Tasks
- [x] Research/source sound effects (waves, shark, bite, etc.)
- [x] Create audio manager/hook
- [x] Add background ocean ambience
- [x] Add shark approach music (tension)
- [x] Add bite/damage sound effect
- [x] Add NPC interaction sounds
- [x] Add ability activation sounds
- [x] Add volume controls in UI
- [x] Handle browser autoplay restrictions

### Key Files
- `lib/game/AudioManager.ts` - Audio system ✅ Created
- `hooks/useGameAudio.ts` - React hook ✅ Created
- `public/audio/` - Audio files ✅ Created (directory with README)
- `components/game/GameCanvas.tsx` - Trigger sounds ✅ Updated
- `components/ui/VolumeControl.tsx` - Volume UI ✅ Created

### Notes
- ✅ Uses Web Audio API for maximum compatibility
- ✅ Preloads audio for instant playback
- ✅ Respects user mute preferences via localStorage
- ✅ Gracefully handles browser autoplay restrictions
- ✅ Volume control positioned in top-right corner
- ✅ Audio triggers for: bite, selfie, NPC interaction, ability activation, game over
- ✅ Dynamic tension music when shark is nearby (<250px)
- ✅ Ocean ambience loops in background
- ⚠️ Placeholder audio files - need to add actual MP3 files for production
- 📝 See `public/audio/README.md` for instructions on adding real audio files

---

## Completion Checklist

| Track | Feature | Status | Last Update |
|-------|---------|--------|-------------|
| 1 | Multiplayer | 🟢 Complete | Dec 5, 2024 |
| 2 | Assets/Sprites | 🟢 Complete | Dec 5, 2024 |
| 3 | E2E Tests | 🟢 Complete | Dec 5, 2024 |
| 4 | Touch Controls | 🟢 Complete | Dec 5, 2024 |
| 5 | Sound/Music | 🟢 Complete | Dec 5, 2024 |

### Status Legend
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔵 Blocked

---

## Instructions for Subagents

1. **Update this document** as you work - change status, check off tasks, add notes
2. **Run tests** after making changes: `npm test`
3. **Run build** before marking complete: `npm run build`
4. **Update STATUS.md** if you complete a major feature
5. **Coordinate** if your work affects another track (e.g., Touch Controls needs GameCanvas changes)

## Dependencies Between Tracks

```
Track 2 (Assets) ──────┐
                       ├──> Can proceed independently
Track 3 (E2E Tests) ───┤
                       │
Track 4 (Touch) ───────┼──> May need coordination with Track 1 for multiplayer touch
                       │
Track 5 (Audio) ───────┘

Track 1 (Multiplayer) ──> Most complex, may need updates to many files
```
