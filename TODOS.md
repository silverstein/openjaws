# Beach Panic: Jaws Royale — TODO

## What's Been Done (this session)

- [x] Fix model IDs and AI SDK v6 upgrade
- [x] Mock mode default (safe for open source)
- [x] Fix GET endpoint validation
- [x] ErrorBoundary with funny shark messages
- [x] Replace alert() with inline errors
- [x] Dad Joke Shark personality
- [x] Death screen with personality taunts
- [x] Spectator mode with AI commentary
- [x] Shark grudge/memory system wired up
- [x] Synthetic sound effects (Web Audio API)
- [x] MIT License + CONTRIBUTING.md
- [x] GameHUD component extraction
- [x] Improved character sprites (accessories per archetype)
- [x] Improved shark sprite (torpedo body, mood-reactive eyes, difficulty glow)
- [x] Fix all tests: 124/124 passing
- [x] Fix CI (pnpm, typecheck)
- [x] Screen shake, close-call detection, tension vignette
- [x] Round-based objective progression (3 scripted + escalation)
- [x] Discovery tutorial hints
- [x] Round transition banner
- [x] Shark difficulty scaling per round
- [x] High scores (localStorage)
- [x] Shark personality picker in lobby
- [x] Reactive tension audio
- [x] Camera flash on selfie
- [x] Particle system (splash, bubbles, chomp, hit, sparkle)
- [x] Floating damage/score numbers
- [x] Shark fin surface effect + wake trail
- [x] Score/round in HUD
- [x] NPC dialogue hints about current objective
- [x] NEW HIGH SCORE detection on victory
- [x] Proper metadata (title, description, OpenGraph)
- [x] Mobile viewport (viewport-fit, no-zoom, overscroll-behavior)
- [x] Multiplayer position interpolation

## Remaining

### Priority 1: Multiplayer Testing
- **Test on two actual devices** — the code has interpolation and cleanup, but needs real-world testing
- **Host disconnect handling** — detect when host goes offline, show message
- **Latency compensation** — the lerp is basic, may need dead reckoning for fast movement

### Priority 2: Audio
- **Replace synth sounds with real audio** — the synth fallback works but real MP3s for chomp, splash, music would be much more immersive
- **Dynamic music system** — calm beach music that transitions to tense Jaws-like theme based on tension level (currently just plays/stops tension sound)

### Priority 3: Visual
- **Sprite animations** — currently static shapes, could add walking/swimming frame animations via programmatic Graphics
- **Beach environment details** — sandcastles, umbrellas, seagulls as decorative elements
- **Water shader polish** — the shader exists but could be more dynamic

### Future Ideas
- **Leaderboard** — global scores via Convex (not just localStorage)
- **New shark personality: "Baby Shark"** — plays the song while hunting
- **New character: "The Mayor"** — refuses to close the beach (Jaws reference)
- **Replay system** — record and share best moments
- **Custom beach maps** — different layouts, obstacles
- **Weather events** — fog (reduces visibility), storm (bigger waves)
