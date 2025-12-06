# Fish Market & Bait System Integration Guide

This document describes the Fish Market & Bait System (Track 8) and how to integrate it into GameCanvas.tsx.

## Overview

The Fish Market & Bait System adds a strategic economy layer to the game:
- Players can purchase different types of fish at a market stall on the beach
- Fish can be thrown into the water to create bait zones
- Bait zones attract sharks, making them prioritize eating over hunting players
- Sharks become vulnerable (2x damage) while eating bait

## Files Created

### 1. `/lib/game/entities/Fish.ts`
Defines fish types and their properties.

**Exports:**
- `FishType`: Type alias for fish types ("sardine" | "mackerel" | "tuna" | "chum")
- `Fish`: Interface with name, price, baitPower, duration, description
- `FISH_CATALOG`: Record mapping fish types to their properties
- `getFish(type)`: Helper to get fish by type
- `getAllFish()`: Helper to get all fish types

**Fish Properties:**
```typescript
sardine:  { price: 25,  baitPower: 1, duration: 3000ms  }
mackerel: { price: 50,  baitPower: 2, duration: 5000ms  }
tuna:     { price: 100, baitPower: 3, duration: 8000ms  }
chum:     { price: 200, baitPower: 4, duration: 12000ms }
```

### 2. `/lib/game/entities/BaitZone.ts`
Creates temporary bait zones when fish are thrown in water.

**Constructor:**
```typescript
new BaitZone(x: number, y: number, fish: Fish)
```

**Key Properties:**
- `attractionRadius: number` - How far sharks can detect (300px)
- `duration: number` - How long bait lasts (from fish)
- `baitPower: number` - Attraction strength (from fish)

**Key Methods:**
- `update(delta: number): void` - Updates animation and timer
- `isActive(): boolean` - Returns true if bait is still active
- `getPosition(): { x, y }` - Gets bait position
- `getAttractionStrength(sharkX, sharkY): number` - Returns 0-baitPower based on distance
- `getAttractionVector(sharkX, sharkY): { x, y }` - Returns normalized direction to bait
- `getTimeRemainingPercent(): number` - Returns 0-1 for UI display

**Visual Effects:**
- Animated expanding ripples
- Fish chunks floating in water
- Bubbles for powerful bait (tuna/chum)
- Fades out as duration expires

### 3. `/lib/game/entities/FishMarket.ts`
A market stall on the beach where players can shop for fish.

**Constructor:**
```typescript
new FishMarket(x: number, y: number)
```

**Factory Function:**
```typescript
createFishMarket(screenWidth, screenHeight): FishMarket
// Places market on right side of beach at y = screenHeight * 0.2
```

**Key Properties:**
- `interactionRadius: number` - Distance for interaction (80px)
- `x, y: number` - Position on beach
- `container: Container` - Pixi container

**Key Methods:**
- `update(delta, playerX, playerY): boolean` - Returns true if player nearby
- `canShop(): boolean` - Returns true if player can shop
- `openShop(): boolean` - Same as canShop (for consistency)
- `selectNextFish(): void` - Cycle to next fish type
- `selectPreviousFish(): void` - Cycle to previous fish type
- `purchaseFish(playerPoints): FishType | null` - Buy current fish, returns type or null
- `getCurrentFish(): FishType` - Get currently selected fish
- `getCurrentPrice(): number` - Get price of current fish
- `isNearPlayer(): boolean` - Check if player is in interaction range

**Visual Design:**
- Red/white striped awning
- Wooden counter and poles
- Display case with fish on ice
- Selected fish highlighted with glow
- Shows fish name, price, and description
- "Press E to shop" prompt when nearby

### 4. `/lib/game/entities/Shark.ts` (Modified)
Added bait behavior to shark AI.

**New State:**
- `"eating"` - Added to `SharkState` type

**New Methods:**
- `checkForBait(baitZones): void` - Checks for active bait and moves toward strongest
- `isVulnerable(): boolean` - Returns true when eating
- `getVulnerabilityMultiplier(): number` - Returns 2.0 when eating, 1.0 otherwise

**Modified Methods:**
- `takeDamage(amount)` - Now applies 2x damage when vulnerable, interrupts eating

**Behavior:**
- When bait is detected, shark prioritizes it over hunting players
- Moves toward strongest bait zone within radius
- When reaching bait (< 30px), enters "eating" state for 2 seconds
- While eating: vulnerable to 2x damage, stationary with chomping animation
- Eating reduces hunger by 20 points
- Being damaged while eating interrupts and stuns shark

## Integration into GameCanvas.tsx

Here's how to integrate this system:

### Step 1: Add State Variables

```typescript
// In GameCanvas component state
const [fishMarket, setFishMarket] = useState<FishMarket | null>(null)
const [baitZones, setBaitZones] = useState<BaitZone[]>([])
const [playerInventory, setPlayerInventory] = useState<FishType[]>([])
const [playerPoints, setPlayerPoints] = useState<number>(100) // Starting points
```

### Step 2: Initialize Fish Market

```typescript
// In useEffect after stage creation
import { createFishMarket } from "@/lib/game/entities/FishMarket"

const market = createFishMarket(window.innerWidth, window.innerHeight)
stage.addChild(market.container)
setFishMarket(market)
```

### Step 3: Add Keyboard Controls

```typescript
// Add to keyboard event handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // ... existing controls ...

    // Fish market interaction
    if (e.key === "e" || e.key === "E") {
      if (fishMarket?.canShop()) {
        const fishType = fishMarket.purchaseFish(playerPoints)
        if (fishType) {
          const fish = getFish(fishType)
          setPlayerPoints(prev => prev - fish.price)
          setPlayerInventory(prev => [...prev, fishType])
          console.log(`Purchased ${fish.name}!`)
        } else {
          console.log("Not enough points!")
        }
      }
    }

    // Cycle fish selection at market
    if (e.key === "ArrowLeft" && fishMarket?.isNearPlayer()) {
      fishMarket.selectPreviousFish()
    }
    if (e.key === "ArrowRight" && fishMarket?.isNearPlayer()) {
      fishMarket.selectNextFish()
    }

    // Throw fish as bait
    if (e.key === "b" || e.key === "B") {
      if (playerInventory.length > 0 && player && player.isInWater) {
        const fishType = playerInventory[0]! // Use first fish in inventory
        const fish = getFish(fishType)

        // Create bait zone at player's position
        const bait = new BaitZone(player.x, player.y, fish)
        stage.addChild(bait.container)
        setBaitZones(prev => [...prev, bait])

        // Remove from inventory
        setPlayerInventory(prev => prev.slice(1))
        console.log(`Threw ${fish.name}!`)
      }
    }
  }

  window.addEventListener("keydown", handleKeyDown)
  return () => window.removeEventListener("keydown", handleKeyDown)
}, [fishMarket, playerInventory, playerPoints, player])
```

### Step 4: Update Game Loop

```typescript
// In game loop (ticker callback)
const gameLoop = (delta: number) => {
  // ... existing player update ...

  // Update fish market
  if (fishMarket && player) {
    fishMarket.update(delta, player.x, player.y)
  }

  // Update bait zones
  setBaitZones(prevZones => {
    const activeZones: BaitZone[] = []

    prevZones.forEach(zone => {
      zone.update(delta)

      if (zone.isActive()) {
        activeZones.push(zone)
      } else {
        // Remove expired bait zone
        stage.removeChild(zone.container)
      }
    })

    return activeZones
  })

  // Update shark with bait zones
  if (shark) {
    shark.checkForBait(baitZones)
    shark.update(delta, player, gameState)
  }
}
```

### Step 5: Add UI Elements (Optional)

```tsx
// In JSX render
<div className="absolute top-4 left-4 text-white">
  <div>Points: {playerPoints}</div>
  <div>Fish: {playerInventory.length}</div>
  {playerInventory[0] && (
    <div className="text-yellow-400">
      Next: {getFish(playerInventory[0]).name} (Press B to throw)
    </div>
  )}
</div>

{fishMarket?.isNearPlayer() && (
  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white text-center">
    <div>Use ← → to browse fish</div>
    <div className="text-yellow-400">Press E to purchase</div>
  </div>
)}
```

### Step 6: Award Points System

```typescript
// When player earns points (e.g., killing shark, completing objectives)
const awardPoints = (amount: number) => {
  setPlayerPoints(prev => prev + amount)
}

// Example: Award 100 points when shark is defeated
if (shark.isDefeated()) {
  awardPoints(100)
}
```

## Testing the System

1. **Fish Market**:
   - Walk near the market (right side of beach)
   - Press E to purchase fish
   - Use arrow keys to browse different fish types
   - Verify points are deducted

2. **Bait System**:
   - Go into water with fish in inventory
   - Press B to throw fish
   - Watch shark move toward bait
   - Watch shark enter "eating" state with green text
   - Shark should be vulnerable (take 2x damage)

3. **Visual Verification**:
   - Bait zones should show rippling circles
   - Fish chunks visible in water
   - Bubbles for tuna/chum
   - Market shows current selection with glow
   - Shark shows "Eating!" text when eating

## Game Balance Notes

- **Starting Points**: 100 (enough for 4 sardines or 2 mackerel)
- **Shark Kill Reward**: Suggest 100-150 points
- **Objective Completion**: 50-100 points
- **Economy Loop**: Players must balance buying bait vs. saving points

## Future Enhancements

- Multiple fish markets at different locations
- Fish inventory limit (max 5 fish?)
- Different bait strategies (place bait strategically)
- Multiplayer: Players compete for fish/points
- Special fish types with unique effects
- Fish market restocking system
