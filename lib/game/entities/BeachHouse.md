# Beach House Entity

## Overview
The Beach House is a safe haven on the beach where players can rest and recover. It provides a sanctuary from the shark and features furniture for sleeping and storage.

## Visual Design

```
                 🏠
            🔺 (Chimney)
         /-----------\
        /  Red Roof   \
       /_______________\
      |  [👁️]   [👁️]  |  <- Windows
      |      🚪       |  <- Door
      |_______________|
      |_Beach_Cottage_|  <- Foundation
```

## Features

### 1. Safe Zone
- **Players inside are hidden from shark AI**
- Shark cannot detect or attack players while inside
- Perfect for recovery or strategic planning

### 2. Sleep/Bed System
- **Full Recovery**: Restores 100% HP + 100% Stamina
- **Duration**: 3 seconds (player is vulnerable during sleep)
- **Cooldown**: 60 seconds per player
- **Animation**: "Zzz" text animation during sleep
- **Feedback**: "+100% HP +100% Stamina" message on completion

### 3. Drawer Storage
- **Capacity**: 6 item slots
- **Items**: Stores FishType items (sardine, mackerel, tuna, chum)
- **Use Case**: Store bait for later use
- **UI**: Shows "Drawer X/6" count

## Controls

| Key | Action | Condition |
|-----|--------|-----------|
| E | Enter house | Near door, outside |
| E | Exit house | Inside |
| B | Sleep (recover) | Inside, not on cooldown |

## Position
- **Default Location**: Upper-left beach area (x: 120, y: screenHeight * 0.15)
- **Interaction Radius**: 80px from door
- **Door Position**: Offset +20px right, +30px down from house center

## API Reference

### Core Methods

#### `update(delta, playerX, playerY, playerId)`
Update house state, check proximity, update animations
- **Parameters**: delta (frame time), player position, player ID
- **Returns**: void

#### `enter(playerId)` / `exit(playerId)`
Mark player as inside or outside the house
- **Parameters**: playerId (string)
- **Returns**: void

#### `isPlayerInside(playerId)`
Check if player is currently inside
- **Parameters**: playerId (string)
- **Returns**: boolean

#### `useBed(playerId)`
Start sleep sequence for recovery
- **Parameters**: playerId (string)
- **Returns**: Promise<{ success: boolean, hp: number, stamina: number }>
- **Resolves**: After 3 seconds with recovery values

#### `canEnter(playerId)`
Check if player can enter (near door and not already inside)
- **Parameters**: playerId (string)
- **Returns**: boolean

### Sleep Management

#### `isSleeping(playerId)`
Check if player is currently sleeping
- **Parameters**: playerId (string)
- **Returns**: boolean

#### `getSleepProgress(playerId)`
Get sleep animation progress (0-1)
- **Parameters**: playerId (string)
- **Returns**: number (0 = just started, 1 = complete)

#### `getRemainingCooldown(playerId)`
Get remaining sleep cooldown in milliseconds
- **Parameters**: playerId (string)
- **Returns**: number (ms remaining, 0 if ready)

### Storage Management

#### `storeItem(item)`
Store a fish item in the drawer
- **Parameters**: item (FishType)
- **Returns**: boolean (true if stored, false if drawer full)

#### `retrieveItem(index)`
Retrieve item from drawer by index
- **Parameters**: index (number, 0-5)
- **Returns**: FishType | null

#### `getStoredItems()`
Get copy of all stored items
- **Returns**: FishType[] (array copy)

#### `hasDrawerSpace()`
Check if drawer has available slots
- **Returns**: boolean

### Position Helpers

#### `getPosition()`
Get house center position
- **Returns**: { x: number, y: number }

#### `getDoorPosition()`
Get door position in world coordinates
- **Returns**: { x: number, y: number }

#### `isNearDoor()`
Check if any player is near the door
- **Returns**: boolean

#### `getPlayersInside()`
Get list of all player IDs currently inside
- **Returns**: string[]

## Integration Example

```typescript
// Create beach house
const beachHouse = createBeachHouse(screenWidth, screenHeight)
stage.addChild(beachHouse.container)

// Game loop
beachHouse.update(delta, player.x, player.y, player.id)

// Input handling
if (keyPressed('E')) {
  if (beachHouse.isPlayerInside(player.id)) {
    beachHouse.exit(player.id)
  } else if (beachHouse.canEnter(player.id)) {
    beachHouse.enter(player.id)
  }
}

if (keyPressed('B') && beachHouse.isPlayerInside(player.id)) {
  beachHouse.useBed(player.id).then(result => {
    if (result.success) {
      player.health = result.hp
      player.stamina = result.stamina
    }
  })
}

// Shark AI integration
if (beachHouse.isPlayerInside(player.id)) {
  // Skip this player - they're safe inside!
  continue
}
```

## Visual Components

### Exterior (Always Visible)
- Coral/peach colored walls (0xffd8a8)
- Red shingled roof (0xff6b6b)
- Two blue windows with white crosses
- Brown wooden door with gold knob
- Brick chimney with animated smoke
- Sandy beige foundation

### Interior (Visible When Player Inside)
- Semi-transparent dark overlay (indicates interior view)
- Pink bed with white pillow
- Brown wooden drawer with gold handles
- Text labels for furniture
- Storage counter display

### UI Prompts
- "Press E to enter" / "Press E to exit" (near door)
- "Press B to sleep (Full recovery)" (inside, when ready)
- "Sleep cooldown: Xs" (inside, on cooldown)
- "Zzz" animation (during sleep)
- "+100% HP +100% Stamina" (on completion)

## Design Rationale

### Why a Beach House?
- **Thematic**: Fits beach setting naturally
- **Gameplay**: Creates strategic safe zones on map
- **Risk/Reward**: Sleep is powerful but leaves player vulnerable
- **Social**: Multiple players can shelter together

### Balance Considerations
- **60s cooldown**: Prevents spam, encourages strategic use
- **3s sleep time**: Long enough to be risky, short enough to be viable
- **Vulnerability during sleep**: Player can't cancel, adds tension
- **Safe from shark**: Provides counterplay to aggressive shark AI

### Future Enhancements
- Window peek system (see outside while inside)
- Furniture upgrades (faster sleep, more storage)
- Barricade door (prevent shark entry entirely)
- Shared storage between players
- Crafting station furniture
