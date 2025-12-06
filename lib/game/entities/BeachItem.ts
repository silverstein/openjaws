import type { Container } from "pixi.js"

/**
 * Available beach item types
 */
export type BeachItemType =
  | "beach_ball"
  | "cooler"
  | "umbrella"
  | "surfboard"
  | "sunscreen"
  | "pool_noodle"

/**
 * Effect types that beach items can produce
 */
export type BeachItemEffectType =
  | "stun"
  | "damage"
  | "speed"
  | "invincibility"
  | "slippery"
  | "none"

/**
 * Effect data returned when a beach item is used
 */
export interface BeachItemEffect {
  /** Type of effect (stun, damage, etc.) */
  type: BeachItemEffectType

  /** Effect value - duration in ms for time-based effects, damage amount for attacks */
  value: number

  /** Human-readable description of the effect */
  description: string

  /** Optional secondary effects */
  secondary?: {
    type: BeachItemEffectType
    value: number
    duration?: number
  }
}

/**
 * Base interface for all beach items
 * Items can be picked up and used/thrown by players
 */
export interface BeachItem {
  /** Item type identifier */
  type: BeachItemType

  /** World X position */
  x: number

  /** World Y position */
  y: number

  /** Pixi.js container for rendering */
  container: Container

  /** Whether item is currently held by a player */
  isPickedUp: boolean

  /**
   * Called when a player picks up the item
   */
  pickup(): void

  /**
   * Use/throw the item toward a target position
   * @param targetX - X coordinate to throw/use toward
   * @param targetY - Y coordinate to throw/use toward
   * @returns Effect data for the item usage
   */
  use(targetX: number, targetY: number): BeachItemEffect

  /**
   * Update item state each frame
   * @param delta - Time delta multiplier (typically 1.0 at 60fps)
   */
  update(delta: number): void

  /**
   * Get current item position
   */
  getPosition(): { x: number; y: number }

  /**
   * Cleanup and destroy item
   */
  destroy(): void
}

/**
 * Item metadata for spawning and display
 */
export interface BeachItemMetadata {
  type: BeachItemType
  name: string
  description: string
  rarity: number // 0-1, affects spawn rate (lower = more rare)
  oneTimeUse: boolean // If true, item is destroyed after use
  requiresArchetype?: string // Optional: only certain player archetypes can use
}

/**
 * Catalog of all beach items with their metadata
 */
export const BEACH_ITEM_CATALOG: Record<BeachItemType, BeachItemMetadata> = {
  beach_ball: {
    type: "beach_ball",
    name: "Beach Ball",
    description: "Throw at shark to distract it briefly",
    rarity: 0.8, // Common
    oneTimeUse: false
  },
  cooler: {
    type: "cooler",
    name: "Cooler",
    description: "Heavy throw that stuns and creates ice slick",
    rarity: 0.5, // Uncommon
    oneTimeUse: false,
    requiresArchetype: "boomer_dad" // Only Boomer Dad can throw
  },
  umbrella: {
    type: "umbrella",
    name: "Beach Umbrella",
    description: "Throw like a javelin for heavy damage",
    rarity: 0.4, // Uncommon
    oneTimeUse: true // Breaks on impact
  },
  surfboard: {
    type: "surfboard",
    name: "Surfboard",
    description: "Ride for 3x speed burst, then breaks",
    rarity: 0.3, // Rare
    oneTimeUse: true
  },
  sunscreen: {
    type: "sunscreen",
    name: "Sunscreen",
    description: "Apply for temporary invulnerability",
    rarity: 0.4, // Uncommon
    oneTimeUse: false // But has cooldown
  },
  pool_noodle: {
    type: "pool_noodle",
    name: "Pool Noodle",
    description: "Infinite bonks for low damage",
    rarity: 0.7, // Common
    oneTimeUse: false
  }
}

/**
 * Get metadata for a beach item type
 */
export function getBeachItemMetadata(type: BeachItemType): BeachItemMetadata {
  return BEACH_ITEM_CATALOG[type]
}

/**
 * Get all beach item types
 */
export function getAllBeachItemTypes(): BeachItemType[] {
  return Object.keys(BEACH_ITEM_CATALOG) as BeachItemType[]
}

/**
 * Get a random beach item type based on rarity weights
 */
export function getRandomBeachItemType(): BeachItemType {
  const types = getAllBeachItemTypes()
  const weights = types.map(t => BEACH_ITEM_CATALOG[t].rarity)
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  let random = Math.random() * totalWeight
  for (let i = 0; i < types.length; i++) {
    random -= weights[i]!
    if (random <= 0) {
      return types[i]!
    }
  }

  return types[0]! // Fallback
}
