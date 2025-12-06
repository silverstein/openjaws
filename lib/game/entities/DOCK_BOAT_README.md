# Dock & Boat System - Implementation Summary

## Files Created

### `/lib/game/entities/Dock.ts` (5.9 KB)
A wooden pier extending from the beach into the water.

**Key Features:**
- Positioned at left side of screen (x: 100)
- Extends from beach/water boundary (y: screenHeight * 0.3) into water
- 10 wooden plank segments with realistic wood grain effect
- Support posts extending below water
- Walkable platform with collision detection
- Players on dock don't lose stamina (treated like beach, not water)
- Shark swims UNDER dock, cannot attack players on it

**Public Methods:**
- `isPointOnDock(x, y)` - Check if coordinates are on dock
- `getSegments()` - Get all walkable segments
- `getBounds()` - Get entire dock bounds
- `getEndPosition()` - Get position for boat placement
- `update(delta)` - Animation loop (currently no animations)
- `getPosition()` - Get dock position

**Factory Function:**
```typescript
createDock(screenWidth: number, screenHeight: number): Dock
```

---

### `/lib/game/entities/Boat.ts` (8.9 KB)
A small rowboat at the end of the dock providing temporary safety.

**Key Features:**
- Capacity: 2-3 players maximum
- Safety: Shark cannot damage players IN the boat
- Bobbing animation for realistic water effect
- Occupancy indicators (3 circles showing filled/empty slots)
- Oars appear when boat has occupants
- Water ripples around boat
- "FULL" indicator when at capacity
- Selfie restriction (game balance)

**Public Methods:**
- `board(playerId)` - Add player to boat (returns success boolean)
- `eject(playerId)` - Remove specific player from boat
- `bump()` - Shark attack mechanic, randomly ejects players (returns ejected IDs)
- `isPlayerInBoat(playerId)` - Check if player is aboard
- `getOccupantCount()` - Get current passenger count
- `isFull()` - Check if at capacity
- `getOccupants()` - Get all passenger IDs
- `isInBoardingRange(x, y, range)` - Check if player can board
- `clearOccupants()` - Reset boat (for game reset)
- `update(delta)` - Animation and status updates
- `getPosition()` - Get boat position
- `getBounds()` - Get collision bounds

**Factory Function:**
```typescript
createBoat(dockEndX: number, dockEndY: number): Boat
```

---

## Visual Design

### Dock
```
┌─────────────────┐
│  WOODEN PLANK   │  ← Brown rectangles (0x8b4513)
│  [wood grain]   │  ← Horizontal lines for texture
│  [nail details] │  ← 4 nails per plank corner
├─────────────────┤
│     PLANK 2     │
│                 │
├─────────────────┤
│       ...       │
└─────────────────┘
  |            |     ← Support posts underneath
  |            |
```

### Boat
```
        ○ ○ ○          ← Occupancy indicators
        BOAT FULL      ← Status text
    ┌─────────────┐
   ╱               ╲   ← Curved hull
  │   [seat plank]  │  ← Interior seats
  │   [seat plank]  │
   ╲_______________╱
~~~~~~~~~~~~~~~~~~~~~  ← Water ripples
```

## Game Mechanics

### Stamina System
- **On Beach**: No stamina drain
- **In Water**: Stamina drains continuously
- **On Dock**: No stamina drain (like beach!)
- **In Boat**: No stamina drain (safe haven)

### Shark Interaction
- **Beach**: Safe from shark
- **Water**: Shark can attack
- **Dock**: Safe (shark swims UNDER dock)
- **Boat**: Safe, but shark can BUMP boat

### Boat Bump Mechanic
When shark attacks boat:
1. 50% chance per player to be ejected
2. Ejected players splash into water nearby
3. Players can attempt to re-board if quick enough
4. Creates high-stakes moments and chaos

### Selfie Restriction
Players in boat **cannot** take selfies because:
- Game balance (too safe otherwise)
- Risk/reward mechanic
- Forces players to take risks for points

## Integration Pattern

```typescript
// 1. Create entities
const dock = createDock(screenWidth, screenHeight)
const dockEnd = dock.getEndPosition()
const boat = createBoat(dockEnd.x, dockEnd.y)

// 2. Add to stage
stage.addChild(dock.container)
stage.addChild(boat.container)

// 3. Update in game loop
dock.update(delta)
boat.update(delta)

// 4. Check player states
const onDock = dock.isPointOnDock(player.x, player.y)
const inBoat = boat.isPlayerInBoat(player.id)

// 5. Handle interactions
if (keyPressed === 'B' && boat.isInBoardingRange(player.x, player.y)) {
  boat.board(player.id)
}

// 6. Handle shark bumps
if (sharkAttacking && sharkNearBoat) {
  const ejected = boat.bump()
  // Handle ejected players
}
```

## TypeScript Types

Both entities follow the standard pattern:

```typescript
export class Dock {
  public container: Container  // Pixi container
  public x: number             // World X position
  public y: number             // World Y position
  // ... methods
}

export class Boat {
  public container: Container  // Pixi container
  public x: number             // World X position
  public y: number             // World Y position
  // ... methods
}
```

All methods are fully typed with JSDoc comments.

## Testing Recommendations

1. **Visual Test**: Verify dock and boat render correctly
2. **Collision Test**: Walk player onto dock, verify no stamina drain
3. **Boarding Test**: Press B near boat, verify player enters
4. **Capacity Test**: Try boarding 4 players, verify rejection
5. **Bump Test**: Shark attack on boat, verify ejection
6. **Selfie Test**: Try taking selfie in boat, verify blocked

## Performance Notes

- Dock is static (no animations currently)
- Boat has simple sine wave bobbing (minimal CPU)
- Both use Graphics API (no sprite loading needed)
- Collision detection is simple AABB (very fast)

## Future Enhancement Ideas

1. Multiple docks at different locations
2. Boat durability (breaks after X bumps)
3. Rowing animation when occupied
4. Creaking sound effects for dock
5. Splash particles when players ejected
6. Floating debris when boat breaks
7. Dock damage from shark attacks
8. Repair mechanic (mini-game)

---

**Status**: ✅ Ready for integration into GameCanvas.tsx
**Dependencies**: Pixi.js v8 (Graphics, Container, Text)
**TypeScript**: Strict mode compliant, 0 errors
