import type { Doc, Id } from "./_generated/dataModel"

// Re-export common types for easier access
export type Game = Doc<"games">
export type Player = Doc<"players">
export type SharkMemory = Doc<"sharkMemories">
export type PlayerAction = Doc<"playerActions">
export type Objective = Doc<"objectives">
export type NPC = Doc<"npcs">
export type Event = Doc<"events">
export type Commentary = Doc<"commentary">

// Game status types
export type GameStatus = Game["status"]
export type PlayerStatus = Player["status"]
export type ObjectiveStatus = Objective["status"]

// Character archetypes
export type SwimmerArchetype = NonNullable<Player["archetype"]>
export type SharkPersonality = NonNullable<Player["sharkPersonality"]>

// Position type for easier manipulation
export interface Position {
  x: number
  y: number
  z: number
}

// Velocity type
export interface Velocity {
  x: number
  y: number
  z: number
}

// Action types for player actions
export type ActionType = "move" | "ability" | "objective" | "emote" | "item_use"

export interface PlayerActionData {
  type: ActionType
  data: any
  position: Position
}

// Objective types
export type ObjectiveType = Objective["type"]

// NPC types
export type NPCType = NPC["type"]

// Event effect types
export interface EventEffect {
  target: "all" | "swimmers" | "shark"
  type: string
  value: any
}

// Commentary styles
export type CommentaryStyle = Commentary["style"]

// Shark relationship types
export type SharkRelationship = SharkMemory["relationship"]

// Game settings
export interface GameSettings {
  aiDifficulty: string
  objectivesEnabled: boolean
  commentary: boolean
}

// Player stats
export interface PlayerStats {
  objectivesCompleted: number
  survivalTime: number
  closeCallsCount: number
}

// Shark stats
export interface SharkStats {
  hunger: number
  rage: number
  personality: SharkPersonality
}

// Helper type for creating new games
export interface CreateGameInput {
  beachName: string
  maxPlayers?: number
  aiDifficulty?: string
  objectivesEnabled?: boolean
  commentary?: boolean
}

// Helper type for joining games
export interface JoinGameInput {
  gameId: Id<"games">
  userId: string
  name: string
  role: "swimmer" | "shark"
  archetype?: SwimmerArchetype
}

// Helper type for player movement
export interface PlayerMovementInput {
  playerId: Id<"players">
  position: Position
  velocity: Velocity
}

// Helper type for shark AI decisions
export interface SharkDecisionInput {
  gameId: Id<"games">
  sharkId: Id<"players">
  targetPlayerId?: Id<"players">
  action: "hunt" | "patrol" | "ambush" | "retreat" | "taunt"
  reasoning?: string
}

// Helper type for objective completion
export interface ObjectiveCompletionInput {
  objectiveId: Id<"objectives">
  playerId: Id<"players">
  completionData?: any
}

// Memory pattern types
export interface MemoryPattern {
  type: "hiding_spot" | "escape_route" | "ability_timing" | "behavior_pattern"
  data: any
  confidence: number
}

// Memorable moment types
export interface MemorableMoment {
  gameId: Id<"games">
  description: string
  intensity: number
  timestamp: number
}

// Dynamic event configuration
export interface EventConfig {
  spawnNPCs?: number
  modifyEnvironment?: boolean
  affectPlayers?: boolean
  duration: number
  customData?: any
}

// Commentary trigger types
export interface CommentaryTrigger {
  type: "shark_attack" | "objective_complete" | "player_escape" | "special_ability" | "game_event"
  playerId?: Id<"players">
  data: any
}

// Beach environmental conditions
export type WaterLevel = "calm" | "choppy" | "dangerous"

// AI difficulty levels
export type AIDifficulty = "tourist" | "local" | "apex"

// Special items
export type SpecialItem = "sunscreen" | "camera" | "volleyball" | "floatie" | "megaphone"

// Ability cooldown times (in seconds)
export const ABILITY_COOLDOWNS: Record<SwimmerArchetype, number> = {
  influencer: 30,
  boomer_dad: 25,
  surfer_bro: 20,
  lifeguard: 35,
  marine_biologist: 40,
  spring_breaker: 15,
}

// Game constants
export const GAME_CONSTANTS = {
  MAX_PLAYERS: 12,
  MAX_SWIMMERS: 11,
  DEFAULT_ROUND_TIME: 300, // 5 minutes
  SHARK_RESPAWN_TIME: 10,
  OBJECTIVE_SPAWN_RATE: 30, // seconds
  NPC_MAX_COUNT: 10,
  COMMENTARY_INTERVAL: 15, // seconds
}

// Helper functions for type guards
export function isSwimmer(player: Player): boolean {
  return player.role === "swimmer"
}

export function isShark(player: Player): boolean {
  return player.role === "shark"
}

export function isAlive(player: Player): boolean {
  return player.status === "alive"
}

export function isGameActive(game: Game): boolean {
  return game.status === "active"
}
