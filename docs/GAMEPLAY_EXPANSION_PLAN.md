# Beach Panic: Gameplay Expansion Plan

*Created: December 2024*
*Status: Planning*

## Overview

This document captures planned gameplay expansions to make Beach Panic more complete and fun. These features add combat mechanics, social features, environmental elements, and win conditions.

---

## Current State Assessment

### What Works
- Player movement and stamina system
- Shark AI with personality and memory
- Selfie objectives and scoring
- 7 NPC types with dialogue
- Multiplayer infrastructure (Convex)
- Touch controls and audio system

### What's Missing
- No way to defeat/damage the shark
- Character abilities are placeholder only (just console.log)
- No healing mechanic
- No environmental interactions (boat, dock, stations)
- No voice chat for multiplayer
- No win condition beyond high score

---

## Track 1: Character Abilities (Flesh Out)

**Priority**: High (code scaffolding exists)
**Complexity**: Medium
**Status**: ✅ COMPLETED (Dec 2024)

### Current State
All 6 abilities exist in code but only log messages - no actual game effects.

### Implementation Plan

| Character | Ability | Current | New Effect |
|-----------|---------|---------|------------|
| **Influencer** | Going Live | `console.log` only | Creates **Viewer Shield** - blocks 1 shark attack, 30sec cooldown |
| **Boomer Dad** | Dad Reflexes | `console.log` only | **Throw Items** - throw nearby beach items at shark, stuns 1sec |
| **Surfer Bro** | Surf Wake | `console.log` only | **Speed Boost** - 2x speed for 3sec when shark within 200px |
| **Lifeguard** | Baywatch Run | Speed reduction | **Invincibility** during slow-mo (3sec), can rescue other players |
| **Marine Biologist** | Bore with Facts | `console.log` only | **Stun Shark** 2-3sec with random shark fact popup |
| **Spring Breaker** | YOLO Mode | Speed increase | **Invincible but Drunk** - 3sec invincibility, controls reversed/wobbly |

### Key Files to Modify
- `lib/game/entities/Player.ts` - Implement actual ability effects
- `lib/game/effects/ViewerShield.ts` - Already imported, needs implementation
- `lib/game/entities/Shark.ts` - Add `takeDamageFrom(player)` integration
- `components/game/GameCanvas.tsx` - Wire up ability → shark interactions

### Tasks
- [ ] Implement Viewer Shield effect (Influencer)
- [ ] Implement item throwing system (Boomer Dad)
- [ ] Implement proximity speed boost (Surfer Bro)
- [ ] Implement invincibility frames (Lifeguard)
- [ ] Implement shark stun + fact popup (Marine Biologist)
- [ ] Implement drunk controls (Spring Breaker)
- [ ] Add cooldown system to prevent spam
- [ ] Add visual/audio feedback for each ability
- [ ] Write tests for each ability

---

## Track 2: Harpoon Gun Station

**Priority**: High
**Complexity**: Medium
**Status**: ✅ COMPLETED (Dec 2024)

### Concept
A lifeguard tower or beach station where players can grab a harpoon gun to fight back against the shark. Fits the Jaws theme perfectly.

### Design
- **Location**: Fixed station on beach (near water line)
- **Pickup**: Walk up to station, press E to grab
- **Ammo**: 3 shots per pickup
- **Reload**: Return to station for more ammo
- **Effect**:
  - Direct hit: 25 damage + 3sec stun
  - Miss: Harpoon visible in water briefly
- **Risk/Reward**: Must aim while shark approaches

### Implementation
```
HarpoonStation (new entity)
├── position: fixed on beach
├── hasHarpoon: boolean (respawns after 10sec)
├── interact(): gives player harpoon
└── render(): lifeguard tower sprite

Player additions
├── hasHarpoon: boolean
├── harpoonAmmo: number (0-3)
├── aimHarpoon(): show aim indicator
├── fireHarpoon(): projectile toward cursor/touch
└── Harpoon projectile entity
```

### Key Files
- `lib/game/entities/HarpoonStation.ts` - New file
- `lib/game/entities/Harpoon.ts` - New projectile entity
- `lib/game/entities/Player.ts` - Add harpoon inventory
- `components/game/GameCanvas.tsx` - Add station, handle firing

### Tasks
- [ ] Create HarpoonStation entity with sprite
- [ ] Create Harpoon projectile entity
- [ ] Add harpoon pickup interaction (E key)
- [ ] Add aim indicator (mouse/touch direction)
- [ ] Add fire mechanic (click/tap)
- [ ] Add collision detection harpoon → shark
- [ ] Add shark damage/stun on hit
- [ ] Add ammo UI indicator
- [ ] Add sound effects (pickup, fire, hit, miss)
- [ ] Add respawn timer for station

---

## Track 3: Ice Cream Stand (Healing)

**Priority**: High
**Complexity**: Low
**Status**: ✅ COMPLETED (Dec 2024)

### Concept
A colorful ice cream stand on the beach where players can heal. Creates risk/reward - safe zone but you have to get there.

### Design
- **Location**: Fixed position on beach (opposite side from harpoon)
- **Interaction**: Walk up, press E to heal
- **Effect**: Restores 50 HP instantly
- **Cooldown**: 30 seconds per player (prevents camping)
- **Visual**: Ice cream cone particles, jingle sound
- **Bonus idea**: Different flavors = different buffs?

### Implementation
```
IceCreamStand (new entity)
├── position: fixed on beach
├── playerCooldowns: Map<playerId, timestamp>
├── canHeal(playerId): boolean
├── heal(player): restore HP, start cooldown
└── render(): colorful stand sprite + "OPEN" sign
```

### Key Files
- `lib/game/entities/IceCreamStand.ts` - New file
- `lib/game/entities/Player.ts` - Ensure health can increase
- `components/game/GameCanvas.tsx` - Add stand, handle interaction

### Tasks
- [ ] Create IceCreamStand entity with sprite
- [ ] Add interaction radius and E key prompt
- [ ] Implement healing logic with cooldown
- [ ] Add visual feedback (ice cream particle effect)
- [ ] Add sound effect (happy jingle)
- [ ] Add cooldown timer UI near stand
- [ ] Consider flavor/buff system (optional)

---

## Track 4: Boat & Dock System

**Priority**: Medium
**Complexity**: Medium
**Status**: ✅ COMPLETED (Dec 2024)

### Concept
A dock extending into the water with a boat at the end. Provides:
1. **Dock**: Pathway into water (safer than swimming from beach)
2. **Boat**: Temporary safe zone in the water (shark can't reach)
3. **Strategic element**: Limited capacity, can be knocked off

### Design

#### Dock
- Wooden pier extending from beach into water
- Players can walk on it (not swimming, no stamina drain)
- Shark can swim UNDER it but not attack through it
- Provides elevated vantage point

#### Boat
- Small rowboat at end of dock
- **Capacity**: 2-3 players max
- **Safety**: Shark cannot damage players in boat
- **Limitation**: Can't score points while in boat (no selfies)
- **Risk**: Shark can BUMP the boat - players might fall out
- **Movement**: Slight bobbing animation

### Implementation
```
Dock (new entity)
├── segments: array of walkable platforms
├── isPlayerOnDock(player): boolean
├── render(): wooden plank sprites
└── collision: solid for players, pass-through for shark

Boat (new entity)
├── position: end of dock, in water
├── capacity: 3
├── occupants: Player[]
├── board(player): add to boat if room
├── eject(player): remove from boat
├── bump(): shark attack, chance to eject players
└── render(): rowboat sprite with bobbing animation
```

### Key Files
- `lib/game/entities/Dock.ts` - New file
- `lib/game/entities/Boat.ts` - New file
- `lib/game/entities/Shark.ts` - Add boat bump behavior
- `components/game/GameCanvas.tsx` - Add dock/boat, handle boarding

### Tasks
- [ ] Design dock layout (length, width, position)
- [ ] Create Dock entity with walkable collision
- [ ] Create Boat entity with boarding logic
- [ ] Add dock/boat sprites
- [ ] Implement "board boat" interaction
- [ ] Implement boat capacity limit
- [ ] Implement shark bump mechanic
- [ ] Add boat bobbing animation
- [ ] Add "can't selfie from boat" restriction
- [ ] Add sound effects (creaking wood, splash)

---

## Track 5: Voice Chat

**Priority**: Medium
**Complexity**: High
**Status**: 🔴 Not Started

### Concept
Live voice chat so players can communicate, scream, and coordinate during gameplay. Essential for the party game experience.

### Options Evaluated

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **LiveKit** | Open source, self-hostable, good React SDK | Need to run server | Free (self-host) or $0.004/min |
| **Agora** | Easy SDK, reliable | Vendor lock-in | 10k free min/month |
| **Daily.co** | Simple API, good docs | Less customizable | 2k free min/month |
| **Liveblocks** | Already similar to Convex | Voice is beta | Varies |
| **WebRTC (raw)** | Free, no vendor | Complex, need TURN server | Free + server cost |

### Recommended: LiveKit
- Open source
- Excellent React SDK (`@livekit/components-react`)
- Can self-host or use cloud
- Supports spatial audio (voice louder when players near each other!)

### Design
- **Auto-join**: Voice chat starts when joining game room
- **Spatial audio**: Volume based on player distance (optional)
- **Mute button**: In UI, keyboard shortcut (M)
- **Push-to-talk**: Optional mode (hold V to talk)
- **Visual indicator**: Speaker icon near player when talking

### Implementation
```
VoiceChat system
├── LiveKit room connection (tied to game room ID)
├── useVoiceChat hook
│   ├── connect(roomId)
│   ├── disconnect()
│   ├── mute/unmute
│   ├── isSpeaking: boolean per participant
│   └── audioTracks: for spatial positioning
├── VoiceChatUI component
│   ├── Mute button
│   ├── Speaking indicators
│   └── Settings (input device, PTT toggle)
└── Spatial audio processor (optional)
```

### Key Files
- `lib/voice/LiveKitProvider.tsx` - New file
- `hooks/useVoiceChat.ts` - New hook
- `components/ui/VoiceChatUI.tsx` - New component
- `components/game/GameCanvas.tsx` - Speaking indicators

### Tasks
- [ ] Evaluate LiveKit vs alternatives (final decision)
- [ ] Set up LiveKit server (cloud or self-host)
- [ ] Install `@livekit/components-react`
- [ ] Create voice chat hook
- [ ] Create mute/unmute UI
- [ ] Add speaking indicator above players
- [ ] Implement spatial audio (volume by distance)
- [ ] Add push-to-talk option
- [ ] Handle browser microphone permissions
- [ ] Test with multiple players

### Environment Variables Needed
```
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=
```

---

## Track 6: Win Condition & Shark Defeat

**Priority**: High
**Complexity**: Low
**Status**: ✅ COMPLETED (Dec 2024)

### Concept
Give the game a proper ending beyond just dying or getting high score.

### Design Options

#### Option A: Shark Health Pool (Recommended)
- Shark has **100 HP** (already in AIShark code!)
- Players can damage shark via:
  - Harpoon gun: 25 damage
  - Character abilities: 5-15 damage
  - Environmental hazards: 10-20 damage
- When shark HP = 0: **Shark retreats, players win!**
- Victory screen shows stats, MVP, etc.

#### Option B: Escape Objective
- Helicopter arrives after 5 minutes
- Players must reach extraction zone
- Shark gets more aggressive as timer runs down
- Winners = whoever escapes

#### Option C: Score Threshold
- First player to 1000 points wins
- Dying loses 50% of points
- Creates competitive dynamic

### Recommended: Option A (Shark Defeat)
Fits the Jaws theme - you're fighting back, not just surviving.

### Implementation
```
Win condition system
├── Shark health tracking (exists in AIShark)
├── Damage sources registration
├── Health bar UI for shark
├── Defeat animation/sequence
├── Victory screen
│   ├── Stats (damage dealt, selfies taken, deaths)
│   ├── MVP calculation
│   └── Play again button
└── Return to lobby after victory
```

### Key Files
- `lib/game/entities/AIShark.ts` - Already has `health` and `takeDamage`
- `lib/game/systems/WinConditionSystem.ts` - New file
- `components/game/VictoryScreen.tsx` - New component
- `components/game/SharkHealthBar.tsx` - New component
- `components/game/GameCanvas.tsx` - Integrate win condition

### Tasks
- [ ] Expose shark health in game state
- [ ] Create shark health bar UI
- [ ] Wire up all damage sources to shark health
- [ ] Create defeat animation (shark swims away)
- [ ] Create victory screen component
- [ ] Add stats tracking (damage, selfies, deaths)
- [ ] Add MVP calculation
- [ ] Handle multiplayer win (all players see victory)
- [ ] Add victory sound/music

---

## Track 7: Beach House & Rest System

**Priority**: Medium
**Complexity**: Medium
**Status**: ✅ COMPLETED (Dec 2024)

### Concept
A tiny beach house where players can rest, store items, and recover. Adds a "home base" feel to the game.

### Design

#### Beach House
- Small colorful beach cottage on the sand
- **Enter**: Walk up and press E to go inside
- **Interior**: Simple room with furniture
- **Safety**: Shark cannot attack players inside

#### Furniture & Storage
- **Bed**: Sleep to fully restore HP and stamina (takes 3 sec, vulnerable animation)
- **Drawer/Chest**: Store items for later (fish, harpoons, food)
- **Table**: See your inventory laid out

#### Gameplay Purpose
- Safe zone alternative to boat
- Storage for strategic item hoarding
- Rest mechanic for full recovery (but takes time = risk)

### Implementation
```
BeachHouse (new entity)
├── exterior: sprite with door
├── interior: separate scene/overlay
├── isPlayerInside(player): boolean
├── enter(player): transition to interior
├── exit(player): transition to beach
└── furniture: Bed, Drawer, Table

Bed
├── interact(): start sleep animation
├── sleepDuration: 3 seconds
├── onComplete(): restore 100% HP + stamina
└── canBeInterrupted: false (committed once started)

Drawer (storage)
├── items: Item[]
├── store(item): add to drawer
├── retrieve(itemType): remove from drawer
└── capacity: 6 slots
```

### Key Files
- `lib/game/entities/BeachHouse.ts` - New file
- `lib/game/entities/Furniture.ts` - Bed, Drawer, Table
- `lib/game/systems/InventorySystem.ts` - New file
- `components/game/BeachHouseInterior.tsx` - Interior UI overlay

### Tasks
- [ ] Design beach house exterior sprite
- [ ] Create enter/exit transition
- [ ] Design interior layout
- [ ] Implement Bed sleep mechanic
- [ ] Implement Drawer storage system
- [ ] Create inventory UI
- [ ] Add sound effects (door, sleep, drawer)

---

## Track 8: Fish Market & Bait System

**Priority**: High
**Complexity**: Medium
**Status**: ✅ COMPLETED (Dec 2024)

### Concept
A food/fish market on the beach where players can buy fish to use as BAIT. Throw fish in the water to lure the shark to a specific spot, then hit it with the harpoon. Creates a strategic hunting loop!

### Gameplay Loop
```
1. Visit Fish Market → Get fish
2. Store fish in drawer (optional) or carry
3. Go to water's edge
4. Throw fish in water → Creates BAIT ZONE
5. Shark is attracted to bait zone
6. While shark is distracted eating → AIM HARPOON
7. FIRE! Hit the shark for big damage
```

### Design

#### Fish Market Stand
- **Location**: On beach, colorful market stall with awning
- **Vendor NPC**: Friendly fish seller (can have dialogue!)
- **Interaction**: Press E to open shop
- **Currency**: Points/score (spend your selfie points!)

#### Fish Types & Prices
| Fish | Price | Bait Power | Duration |
|------|-------|------------|----------|
| Sardine | 25 pts | Low | 3 sec |
| Mackerel | 50 pts | Medium | 5 sec |
| Tuna | 100 pts | High | 8 sec |
| Chum Bucket | 200 pts | EXTREME | 12 sec (guaranteed attraction) |

#### Bait Mechanics
- **Throw**: Select fish, click/tap on water to throw
- **Bait Zone**: Visible ripple effect where fish lands
- **Shark Attraction**: Shark prioritizes bait over players
- **Distraction Window**: While shark eats, it's vulnerable
- **Combo Bonus**: Hit shark while eating bait = 2x damage!

### Implementation
```
FishMarket (new entity)
├── position: fixed on beach
├── vendorNPC: NPC with shop dialogue
├── openShop(player): show shop UI
├── buyFish(type, player): deduct points, give fish
└── render(): market stall sprite

Fish (item)
├── type: sardine | mackerel | tuna | chum
├── baitPower: number
├── duration: number
└── sprite: fish icon

BaitZone (temporary entity)
├── position: where fish was thrown
├── duration: based on fish type
├── attractionRadius: 300px
├── isActive: boolean
├── render(): ripple effect in water
└── onExpire(): remove zone

Shark additions
├── checkForBait(): scan for active bait zones
├── prioritizeBait(): move toward bait instead of players
├── isEating: boolean
├── eatingVulnerability: 2x damage multiplier
└── onBaitConsumed(): resume normal hunting
```

### Key Files
- `lib/game/entities/FishMarket.ts` - New file
- `lib/game/entities/Fish.ts` - New item type
- `lib/game/entities/BaitZone.ts` - New temporary entity
- `lib/game/entities/Shark.ts` - Add bait attraction logic
- `components/game/ShopUI.tsx` - New shop interface
- `lib/game/systems/InventorySystem.ts` - Fish storage

### Tasks
- [x] Create FishMarket entity with sprite
- [ ] Create vendor NPC with shop dialogue (optional enhancement)
- [x] Design shop UI (fish types, prices, buy button) - Q/R keys cycle, E to buy
- [x] Implement fish purchase with points
- [x] Create fish throwing mechanic (T key in water)
- [x] Create BaitZone entity with ripple effect
- [x] Add shark bait attraction AI
- [x] Add "eating" state to shark
- [ ] Implement 2x damage combo when shark is eating (optional enhancement)
- [ ] Add sound effects (splash, eating, purchase) (uses existing sounds)
- [x] Add visual feedback (fish arc, water splash)

### Strategic Depth
This creates interesting decisions:
- Spend points on fish (offense) vs keep for high score?
- Coordinate with teammates: one baits, one shoots
- Save chum bucket for when shark is at low HP
- Bait shark away from teammate in danger

---

## Track 8B: Secret Room & Deep Water Objectives

**Priority**: Medium (unlocks after Track 8)
**Complexity**: Medium
**Status**: ✅ COMPLETED (Dec 2024)

### Concept
A secret room hidden in the Fish Market that unlocks after you've proven yourself as a shark hunter. Inside: power-ups that let you venture into deep water for special rewards.

### Secret Room Unlock

#### Requirements
- **Shoot the shark 5 times** with harpoon
- Counter tracks hits per player
- After 5th hit: Fish Market vendor says *"You've got guts, kid. Follow me..."*
- Secret door appears behind the fish counter

#### Secret Room Contents
- Hidden back room with mysterious vibes
- Crates of **Oranges** (Vitamin C power-up)
- Maybe other rare items (see below)

### Oranges - Vitamin C Power-Up 🍊

| Property | Value |
|----------|-------|
| Effect | **2x swim speed** |
| Duration | 15-20 seconds |
| Stack | No (refresh timer only) |
| Cost | Free (reward for unlocking) |
| Respawn | 60 seconds after taken |

#### Why It Matters
- Normal swim speed: 2.0
- Shark base speed: 1.5, max: 3.0
- With orange: Player speed = 4.0 → **FASTER THAN SHARK**
- Creates a window to venture into deep water safely

### Deep Water Objectives

#### Why Go Deep?
The orange buff lets you swim fast enough to escape the shark. But why risk it? **Treasure in the deep!**

#### Deep Water Zones
```
Beach ←→ Shallow Water ←→ Deep Water ←→ The Abyss
(safe)    (shark hunts)   (dangerous)   (treasure!)
```

#### Deep Water Rewards

| Reward | Location | Value | Risk |
|--------|----------|-------|------|
| **Pearl Oysters** | Deep Water | 50 pts each | Medium |
| **Sunken Treasure Chest** | The Abyss | 500 pts + rare item | High |
| **Message in Bottle** | Random deep | Lore/hints | Low |
| **Golden Harpoon** | The Abyss | Permanent 2x damage | Very High |
| **Shark Tooth** | Near shark | 100 pts (trophy) | Extreme |

#### Treasure Chest Contents (Random)
- Extra harpoon ammo (5 shots)
- Chum bucket (free)
- Rare cosmetic item
- "Shark Repellent Spray" (30 sec shark avoidance)

### Implementation

```
SecretRoom (sub-area of FishMarket)
├── isUnlocked: boolean
├── unlockRequirement: 5 shark hits
├── checkUnlock(player): if hits >= 5, unlock
├── enter(): transition to secret room scene
└── contents: [OrangeCrate, RareItems]

OrangeCrate (entity in secret room)
├── orangesAvailable: number
├── take(player): give orange buff
├── respawnTimer: 60 sec
└── render(): crate of oranges sprite

OrangeBuff (player buff)
├── active: boolean
├── duration: 15-20 sec
├── speedMultiplier: 2.0
├── render(): orange glow effect on player
└── onExpire(): return to normal speed

DeepWaterZone (map area)
├── bounds: { minY: screenHeight * 0.7 }
├── treasureSpawns: [positions]
├── spawnTreasure(): create collectible
└── dangerLevel: "high"

TreasureChest (collectible entity)
├── position: deep water
├── isCollected: boolean
├── contents: randomized loot
├── collect(player): give rewards
└── render(): glowing chest underwater
```

### Key Files
- `lib/game/entities/FishMarket.ts` - Add secret room
- `lib/game/entities/SecretRoom.ts` - New file
- `lib/game/entities/OrangeCrate.ts` - New file
- `lib/game/effects/OrangeBuff.ts` - Speed buff
- `lib/game/entities/TreasureChest.ts` - Deep water reward
- `lib/game/entities/PearlOyster.ts` - Collectible
- `lib/game/systems/DeepWaterSystem.ts` - Manage deep zones

### Tasks
- [ ] Add shark hit counter per player
- [ ] Create secret room unlock trigger (5 hits)
- [ ] Design secret room interior
- [ ] Create OrangeCrate entity
- [ ] Implement Vitamin C speed buff (2x)
- [ ] Add buff visual effect (orange glow)
- [ ] Create deep water zone boundaries
- [ ] Add pearl oyster spawns
- [ ] Create treasure chest entity
- [ ] Randomize chest loot
- [ ] Add "Golden Harpoon" as rare reward
- [ ] Add sound effects (unlock, buff activate, treasure)
- [ ] Add UI indicator for buff duration

### Gameplay Loop Created
```
1. Fight shark with harpoon (5 hits)
        ↓
2. Unlock secret room in Fish Market
        ↓
3. Grab oranges (2x swim speed)
        ↓
4. Swim to deep water (shark can't catch you!)
        ↓
5. Collect treasure / pearls / rare items
        ↓
6. Buff expires → ESCAPE back to shore!
        ↓
7. Repeat for more loot
```

### Risk/Reward Balance
- Orange buff is LIMITED TIME
- Deep water is FAR from shore
- If buff expires in deep water → you're slow → shark catches you
- Creates tension: "Do I have enough time to reach that chest?"

---

## Track 9: Additional Beach Items

**Priority**: Low
**Complexity**: Low
**Status**: ✅ COMPLETED (Dec 2024)

### Concept
Throwable/interactive beach items that Dad can throw or anyone can use.

### Items
- **Beach Ball**: Throw at shark, minor distraction (0.5sec stun)
- **Cooler**: Dad can throw, 1sec stun + creates slippery ice on water
- **Umbrella**: Throwable javelin, 10 damage
- **Surfboard**: Can ride away quickly, breaks after 1 use
- **Sunscreen**: Apply for 2sec invulnerability (from original design)
- **Pool Noodle**: Bonk shark, 5 damage, infinite use

### Implementation
- Items spawn at random beach locations
- Walk over to pick up (auto-pickup or E key)
- Use with ability key or dedicated throw key
- Each item has unique effect

---

## Track 10: UI/UX Polish (Pre-Voice Chat)

**Priority**: High
**Complexity**: Low-Medium
**Status**: ✅ COMPLETED (Dec 2024)

### Concept
Essential visual feedback, UI elements, and polish features that improve the game experience before adding voice chat complexity.

### 10A: Shark Health Bar UI

**Status**: ✅ COMPLETED

A persistent health bar showing the shark's current HP. Creates tension and lets players know how close they are to winning.

#### Design
- **Position**: Top-center of screen (like a boss health bar)
- **Style**: Red bar with shark icon, shows HP/Max HP
- **Effects**:
  - Pulses when shark takes damage
  - Changes color at low HP (red → flashing red)
  - Shows damage numbers floating up

#### Implementation
```
SharkHealthBar (React component)
├── currentHP: number
├── maxHP: number
├── render(): health bar with animations
├── onDamage(): flash effect, damage number
└── positioning: fixed top-center
```

#### Tasks
- [ ] Create SharkHealthBar component
- [ ] Wire up shark HP state to component
- [ ] Add damage flash animation
- [ ] Add floating damage numbers
- [ ] Add low HP warning effect
- [ ] Add shark icon/name

---

### 10B: Victory Screen

**Status**: ✅ COMPLETED

A celebratory screen when the shark is defeated. Shows stats and allows restart.

#### Design
- **Trigger**: Shark HP reaches 0
- **Content**:
  - "VICTORY!" title with animation
  - Player stats (damage dealt, selfies taken, deaths)
  - MVP calculation (most damage dealt)
  - "Play Again" button
- **Animation**: Confetti, shark swimming away

#### Implementation
```
VictoryScreen (React component)
├── stats: { damageDealt, selfiesTaken, deaths }
├── mvpPlayer: string
├── visible: boolean
├── onPlayAgain(): restart game
└── animations: confetti, fade-in
```

#### Tasks
- [ ] Create VictoryScreen component
- [ ] Track damage stats per player
- [ ] Calculate MVP
- [ ] Add victory animation/confetti
- [ ] Add "Play Again" functionality
- [ ] Add victory sound effect

---

### 10C: Touch Controls for New Features

**Status**: ✅ COMPLETED

Mobile-friendly touch controls for the new game mechanics (pickup, throw).

#### Design
- **Pickup Button**: Tap to pick up nearby items (replaces G key)
- **Throw Button**: Tap to throw held item at target (replaces C key)
- **Action Context**: Buttons only appear when relevant action is available
- **Position**: Bottom-right, near existing touch controls

#### Implementation
```
TouchActionButtons (React component)
├── showPickup: boolean (item nearby)
├── showThrow: boolean (holding item)
├── onPickup(): trigger item pickup
├── onThrow(): trigger item throw at shark
└── positioning: responsive, thumb-friendly
```

#### Tasks
- [ ] Create pickup touch button
- [ ] Create throw touch button
- [ ] Add contextual visibility (only show when relevant)
- [ ] Position for thumb accessibility
- [ ] Add haptic feedback (if supported)
- [ ] Test on mobile devices

---

### 10D: Sound Effects Polish

**Status**: 🟡 Partial (uses existing sounds)

Audio feedback for new game actions to improve feel and feedback.

#### Sounds Needed
| Action | Sound Type | Priority |
|--------|------------|----------|
| Item pickup | Whoosh/grab | High |
| Item throw | Throwing swoosh | High |
| Combo hit (2x damage) | Power-up chime | High |
| Orange buff activate | Citrus pop/sparkle | Medium |
| Orange buff expire | Deflate/fade | Medium |
| Secret room unlock | Discovery fanfare | Medium |
| Treasure collect | Coin/gem sound | Medium |

#### Implementation
- Use existing `SoundEffects.ts` system
- Load new audio files
- Trigger sounds from game events

#### Tasks
- [ ] Add item pickup sound
- [ ] Add item throw sound
- [ ] Add combo hit sound
- [ ] Add orange buff sounds
- [ ] Add secret room unlock sound
- [ ] Add treasure collect sound

---

### 10E: Deep Water Visual Indicator

**Status**: ✅ COMPLETED

Visual cues showing water depth zones so players know where danger increases.

#### Design
- **Shallow Water**: Light blue, safe-ish
- **Deep Water**: Darker blue, gradient transition
- **The Abyss**: Dark blue/purple, subtle glow for treasures
- **Zone Lines**: Subtle dotted line showing depth boundaries

#### Implementation
```
WaterDepthIndicator (Pixi.js Graphics)
├── shallowZone: y < screenHeight * 0.5
├── deepZone: y >= screenHeight * 0.5 && y < screenHeight * 0.7
├── abyssZone: y >= screenHeight * 0.7
├── render(): gradient overlays, zone lines
└── update(): show danger level UI
```

#### Tasks
- [ ] Create gradient water depth overlay
- [ ] Add subtle zone boundary lines
- [ ] Add depth indicator in UI (current zone name)
- [ ] Add treasure glow effect in abyss
- [ ] Adjust colors for visibility

---

### 10F: Minimap

**Status**: ✅ COMPLETED

A small radar-style map showing player position, shark, and key locations.

#### Design
- **Position**: Top-right corner
- **Size**: 120x120px
- **Shows**:
  - Player (blue dot)
  - Shark (red triangle)
  - Harpoon stations (green squares)
  - Treasures (yellow dots)
  - Deep water zone (shaded area)
- **Style**: Semi-transparent, rounded

#### Implementation
```
Minimap (React/Canvas component)
├── playerPos: {x, y}
├── sharkPos: {x, y}
├── stations: [{x, y}]
├── treasures: [{x, y}]
├── scale: worldSize → minimapSize
└── render(): radar-style display
```

#### Tasks
- [ ] Create Minimap component
- [ ] Add player position dot
- [ ] Add shark position (blinking when hunting)
- [ ] Add station markers
- [ ] Add treasure markers (when visible)
- [ ] Add water depth zones
- [ ] Add toggle button (M key / tap to hide)

---

## Implementation Priority

### Phase 1: Core Combat ✅ COMPLETED
1. ✅ Character abilities (Track 1) - all 6 abilities functional
2. ✅ Win condition (Track 6) - shark health bar + victory screen
3. ✅ Harpoon station (Track 2) - 3 stations, projectiles, damage

### Phase 2: Bait & Hunt Loop ✅ COMPLETED
4. ✅ Fish Market & Bait System (Track 8) - strategic hunting (buy fish, throw bait, shark attraction)
5. ✅ Ice cream stand (Track 3) - healing (+50 HP, 30s cooldown)

### Phase 3: Environment & Safety ✅ COMPLETED
6. ✅ Boat & dock (Track 4) - water safe zone (dock walking, boat boarding, bump mechanic)
7. ✅ Beach House (Track 7) - rest, storage, home base (sleep for full recovery, 60s cooldown)

### Phase 4: Social & Polish
8. ✅ Additional items (Track 9) - throwables (Beach Ball, Cooler, Umbrella, Surfboard, Sunscreen, Pool Noodle)
9. ✅ Balance tuning (Shark 150 HP, Harpoon 30 dmg, Umbrella 20 dmg)
10. ✅ More audio/visual feedback (combo hits, orange buff indicator, held item display)
11. ✅ Fish Vendor NPC ("Captain Bill") with dialogue at Fish Market

### Phase 5: UI/UX Polish (Track 10) - Pre-Voice Chat ✅ COMPLETED
12. ✅ Shark Health Bar UI (10A) - boss-style health bar at top of screen
13. ✅ Victory Screen (10B) - celebration when shark defeated with stats
14. ✅ Touch Controls (10C) - mobile pickup/throw buttons
15. 🟡 Sound Effects Polish (10D) - uses existing sounds for now
16. ✅ Deep Water Visual (10E) - gradient depth zones
17. ✅ Minimap (10F) - radar showing positions

### Phase 6: Multiplayer Communication
18. 🔴 Voice chat (Track 5) - multiplayer communication

### Recommended Build Order
```
Phase 1 creates: "I can fight the shark!"
Phase 2 creates: "I can hunt the shark strategically!"
Phase 3 creates: "I have places to hide and rest!"
Phase 4 creates: "I have all the tools to win!"
Phase 5 creates: "I can see everything clearly!"
Phase 6 creates: "I can coordinate with friends!"
```

---

## Open Questions

1. **Shark difficulty scaling**: Should shark get harder as it takes damage (enraged)?
2. **Respawn system**: Do players respawn or is it permadeath per round?
3. **Round length**: How long should a game last? 5min? Until shark defeated?
4. **Multiplayer balance**: How to balance 1 shark vs many players all attacking?
5. **Voice chat moderation**: Any concerns with open voice chat?

---

## Notes

- All new entities should follow existing patterns in `lib/game/entities/`
- Use Pixi.js v8 APIs (Graphics, Sprite, Container)
- Add tests for new game logic
- Update STATUS.md when features complete
- Coordinate with multiplayer system for sync

