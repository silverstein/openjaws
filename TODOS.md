# Beach Panic: Jaws Royale — TODO

## Priority 1: Multiplayer Polish

The multiplayer infrastructure exists (Convex schema, hooks, MultiplayerGameCanvas) but needs testing and fixes.

### What needs fixing:
- **Position interpolation**: Other players teleport between updates (50ms throttle). Add lerp between position updates so movement looks smooth.
  - File: `components/game/MultiplayerGameCanvas.tsx` — where `otherPlayers` positions are rendered
  - Approach: Store previous + current position per player, lerp between them each frame
- **Host migration**: If the host (shark AI controller) disconnects, the game freezes. Need to detect host disconnect and either migrate or end gracefully.
  - File: `hooks/useMultiplayerGame.ts`
  - Approach: Add a heartbeat check — if host hasn't updated in 10s, show "Host disconnected" message
- **Connection status indicator**: Show "Connected / Reconnecting / Disconnected" somewhere in the HUD
  - Convex handles reconnection automatically, but the UI should reflect connection state
- **Test on two devices**: Open two browser tabs with different player names, create a game in one, join from the other

### What already works:
- Game creation and joining (Convex mutations)
- Real-time position sync via subscriptions
- Shark state sync (host broadcasts)
- Player eaten events
- Tab-close cleanup (beforeunload handler)

## Priority 2: Mobile Polish

Touch controls exist but haven't been tested on real devices.

### What needs checking:
- **Touch target sizes**: Ensure all interactive buttons are 44px minimum (Apple HIG)
  - Check: lobby character selection buttons, game action buttons, HUD buttons
- **Viewport scaling**: The game canvas should fill the viewport without scroll. Test `100dvh` on Safari iOS.
- **Safe area insets**: Notch/Dynamic Island devices need `env(safe-area-inset-*)` padding
  - File: `app/layout.tsx` — add `viewport-fit=cover` meta tag
  - File: `app/game/page.tsx` — add safe area padding
- **Joystick responsiveness**: The virtual joystick should feel snappy, not laggy. Test touch event vs pointer event performance.
- **Orientation**: Force landscape in game? Or adapt to portrait with adjusted layout?
  - The landscape tip already shows in lobby (good)
  - Game should still be playable in portrait, just cramped

### Quick wins:
- Add `viewport-fit=cover` to the HTML meta viewport tag
- Add `pb-safe` / `pt-safe` Tailwind classes to game page
- Test in Chrome DevTools mobile emulator first

## Priority 3: Future Enhancements (defer)

- **GameCanvas refactor**: Break the remaining 2400 lines into game loop hook, entity manager, and AI overlay components. Biggest tech debt.
- **Real audio files**: Replace synth sounds with real MP3s (chomp, splash, music). The synth fallback works but real audio would be much more immersive.
- **Convex `v.any()` cleanup**: Replace 7 uses of `v.any()` in schema.ts with proper typed validators.
- **Better sprite art**: The programmatic fallbacks are charming but proper pixel art would look much better.
- **Leaderboard**: Track high scores across games via Convex. "Most times escaped", "Most selfies taken", etc.
- **New shark personality: "Baby Shark"**: Plays the song while hunting. Your kid would either love or hate this.
