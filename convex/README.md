# Beach Panic: Jaws Royale - Convex Backend

## Overview

This directory contains the Convex backend implementation for Beach Panic: Jaws Royale, supporting asymmetric gameplay between 11 swimmers and 1 shark player.

## Schema Structure

### Core Tables

1. **games** - Beach session management
   - Tracks game state, players, events, and settings
   - Supports lobby, active, finished, and abandoned states

2. **players** - Player data for both swimmers and shark
   - Includes position, health, abilities, and character archetypes
   - Tracks shark-specific stats (hunger, rage, personality)

3. **sharkMemories** - Persistent AI memory system
   - Remembers players across games
   - Tracks patterns, relationships, and memorable moments
   - Enables advanced shark AI behavior

4. **playerActions** - Action logging for AI learning
   - Records all player movements and decisions
   - Used for pattern recognition and AI improvement

5. **objectives** - Content creator challenges
   - Dynamic objective spawning
   - Tracks completion and points

6. **npcs** - Beach NPCs (vendors, lifeguards, tourists)
   - AI-controlled characters that are oblivious to danger
   - Adds chaos and comedy to gameplay

7. **events** - Dynamic game events
   - "Influencer Invasion", "Documentary Crew", etc.
   - Modifies gameplay temporarily

8. **commentary** - AI-generated documentary narration
   - Multiple styles (nature doc, sports, true crime)
   - Reacts to game events in real-time

## Key Features

### Asymmetric Gameplay
- 11 swimmers with unique abilities vs 1 intelligent shark
- Character archetypes with special abilities
- Objective-based gameplay for swimmers

### AI Memory System
- Sharks remember players across games
- Pattern recognition and learning
- Relationship development (rival, nemesis, favorite snack)

### Dynamic Content
- Auto-spawning objectives
- Random events that change gameplay
- AI-generated commentary

## Usage

1. Initialize Convex:
   ```bash
   pnpm convex dev
   ```

2. The schema will be automatically deployed when you run the dev server.

3. Use the provided mutation and query functions to interact with the database.

## Available Functions

### Game Management
- `createGame` - Create a new beach session
- `joinGame` - Join an existing game
- `startGame` - Start a game from lobby
- `leaveGame` - Leave a game
- `getActiveGames` - List available games
- `getGameDetails` - Get full game info

### Player Actions
- `updatePlayerMovement` - Update position/velocity
- `useAbility` - Activate character ability
- `updatePlayerStats` - Update health/stamina
- `playerEaten` - Handle shark catching swimmer
- `updateCooldowns` - Update ability cooldowns

### Shark AI
- `makeSharkDecision` - Record AI decisions
- `updateSharkMemory` - Update memory about players
- `getSharkMemories` - Retrieve memories for decision making
- `updateSharkPersonality` - Change shark behavior type

### Objectives
- `claimObjective` - Claim an available objective
- `completeObjective` - Complete and get points
- `abandonObjective` - Give up on objective
- `getAvailableObjectives` - List available objectives

## Development Notes

- All timestamps are stored as milliseconds since epoch
- Positions use 3D coordinates (x, y, z) where z is depth
- AI decisions should be made on the client and recorded via mutations
- The schema supports real-time multiplayer with Convex's reactive queries