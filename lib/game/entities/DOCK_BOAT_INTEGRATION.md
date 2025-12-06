# Dock & Boat Integration Guide

This document explains how to integrate the Dock and Boat entities into GameCanvas.tsx.

## Quick Start

```typescript
import { createDock, type Dock } from "@/lib/game/entities/Dock"
import { createBoat, type Boat } from "@/lib/game/entities/Boat"

// In GameCanvas component state:
const [dock, setDock] = useState<Dock | null>(null)
const [boat, setBoat] = useState<Boat | null>(null)

// In setupGame():
const newDock = createDock(app.screen.width, app.screen.height)
stage.addChild(newDock.container)
setDock(newDock)

const dockEnd = newDock.getEndPosition()
const newBoat = createBoat(dockEnd.x, dockEnd.y)
stage.addChild(newBoat.container)
setBoat(newBoat)
```

## Key Features

### Dock
- **Position**: Left side of screen at y = screenHeight * 0.3 (beach/water boundary)
- **Walking**: Players on dock don't lose stamina (like being on beach)
- **Shark Protection**: Shark swims UNDER dock, cannot attack players on it
- **Collision Detection**: Use `dock.isPointOnDock(x, y)` to check if player is on dock

### Boat
- **Capacity**: Max 3 players
- **Safety**: Shark cannot damage players IN the boat
- **Limitation**: Players in boat cannot take selfies (game balance)
- **Bump Mechanic**: Shark attacks have 50% chance to eject each player

## Game Loop Integration

```typescript
// In game loop update():
if (dock && boat) {
  // Update animations
  dock.update(delta)
  boat.update(delta)

  // Check if player is on dock (no stamina drain)
  if (player && dock.isPointOnDock(player.x, player.y)) {
    player.isOnDock = true // Add this property to Player
    // Don't drain stamina like in water
  }

  // Check if player is in boat (shark safety)
  if (player && boat.isPlayerInBoat(player.id)) {
    player.isInBoat = true // Add this property to Player
    // Player is safe from shark
    // Disable selfie ability
  }
}
```

## Player Interactions

### Boarding the Boat
```typescript
// Add to keyboard handler (B key):
if (e.key === 'b' && player && boat) {
  if (boat.isInBoardingRange(player.x, player.y)) {
    const success = boat.board(player.id)
    if (success) {
      console.log("Boarded boat!")
      // Optionally: Move player to boat position
      player.x = boat.x
      player.y = boat.y
    } else {
      console.log("Boat is full!")
    }
  }
}
```

### Exiting the Boat
```typescript
// Add to keyboard handler (X key or B again):
if (e.key === 'x' && player && boat) {
  if (boat.isPlayerInBoat(player.id)) {
    boat.eject(player.id)
    console.log("Exited boat")
    // Move player to water next to boat
    player.x = boat.x + 50
    player.y = boat.y
  }
}
```

### Shark Bump Mechanic
```typescript
// In shark collision detection:
if (shark && boat && shark.currentState === "attacking") {
  const sharkBoatDist = Math.sqrt(
    (shark.x - boat.x) ** 2 + (shark.y - boat.y) ** 2
  )

  if (sharkBoatDist < 60) {
    // Shark bumps boat
    const ejectedPlayers = boat.bump()

    ejectedPlayers.forEach(playerId => {
      // Handle ejected players (splash them into water)
      console.log(`Player ${playerId} ejected from boat!`)
      // Move them to random position around boat
    })
  }
}
```

## Collision & State Management

### Water vs Dock Detection
```typescript
// Enhanced water detection:
function isPlayerInWater(player: Player, dock: Dock): boolean {
  const waterLineY = screenHeight * 0.3

  // Player is below water line
  if (player.y > waterLineY) {
    // But check if they're on the dock
    if (dock.isPointOnDock(player.x, player.y)) {
      return false // On dock, not in water
    }
    return true // In water
  }

  return false // On beach
}
```

### Shark Behavior Around Dock
```typescript
// In shark hunting behavior:
if (shark && dock && player) {
  const playerOnDock = dock.isPointOnDock(player.x, player.y)

  if (playerOnDock) {
    // Shark can't attack player on dock
    // Shark should patrol underneath or around dock
    shark.setState("patrol")
  }
}
```

### Selfie Restriction in Boat
```typescript
// In selfie handler (F key):
if (e.key === 'f' && player) {
  if (boat?.isPlayerInBoat(player.id)) {
    console.log("Can't take selfies in the boat!")
    return
  }

  // Normal selfie logic...
}
```

## Visual Integration Tips

1. **Z-Index Ordering**:
   - Add dock first (back layer)
   - Add boat second
   - Add players and shark on top

2. **Responsive Positioning**:
   ```typescript
   // On window resize:
   window.addEventListener('resize', () => {
     if (dock && boat) {
       // Dock position is fixed to screen
       const beachLine = app.screen.height * 0.3
       dock.container.y = beachLine

       // Boat follows dock end
       const dockEnd = dock.getEndPosition()
       boat.container.x = dockEnd.x
       boat.container.y = dockEnd.y + 25
     }
   })
   ```

3. **Camera/Viewport**:
   - Dock and boat are static structures
   - Don't move them when player moves
   - They're world objects, not UI elements

## Multiplayer Considerations

For multiplayer integration:

```typescript
// Sync boat occupants via Convex:
const syncBoatState = useMutation(api.games.updateBoatState)

// When player boards:
boat.board(playerId)
await syncBoatState({
  gameId,
  occupants: boat.getOccupants()
})

// Listen for boat state changes:
const boatState = useQuery(api.games.getBoatState, { gameId })
useEffect(() => {
  if (boatState && boat) {
    // Update local boat state from server
    boatState.occupants.forEach(id => {
      if (!boat.isPlayerInBoat(id)) {
        boat.board(id)
      }
    })
  }
}, [boatState])
```

## Testing Checklist

- [ ] Dock renders on left side at correct position
- [ ] Boat renders at end of dock with bobbing animation
- [ ] Player can walk on dock without stamina drain
- [ ] Shark cannot attack player on dock
- [ ] Player can board boat (B key)
- [ ] Boat shows correct occupancy indicators
- [ ] Boat prevents selfie-taking
- [ ] Shark bump ejects players from boat
- [ ] Boat shows "FULL" indicator at capacity
- [ ] Player can exit boat (X key)

## Future Enhancements

- Add rowing animation when boat has occupants
- Add splash effects when players are ejected
- Add creaking sounds to dock
- Add boat rocking effect when shark bumps
- Add multiple boats at different docks
- Add boat durability (breaks after X bumps)
