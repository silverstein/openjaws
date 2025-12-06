/**
 * DeepWaterZone System - Manages dangerous deep water area with treasures
 *
 * Features:
 * - Deep water zone starts at y > screenHeight * 0.7
 * - "The Abyss" (ultra-deep) at y > screenHeight * 0.85
 * - Spawns collectible treasures with different point values
 * - Treasures respawn periodically
 * - Danger increases with depth
 *
 * Treasure Types:
 * - Pearl: 50 points (common)
 * - Bottle: 25 points (very common)
 * - Shark Tooth: 100 points (uncommon)
 * - Chest: 500 points (rare, abyss only)
 */

export type TreasureType = "pearl" | "chest" | "bottle" | "shark_tooth"

export interface Treasure {
  id: string // Unique identifier
  type: TreasureType
  x: number
  y: number
  points: number
  collected: boolean
  spawnTime: number // Timestamp when treasure spawned
}

interface TreasureConfig {
  type: TreasureType
  points: number
  spawnWeight: number // Higher = more common
  minDepth: number // Minimum y depth to spawn (0 = deep water, 1 = abyss)
}

export class DeepWaterZone {
  private treasures: Map<string, Treasure> = new Map()
  private treasureIdCounter: number = 0
  private lastSpawnTime: number = 0

  // Screen dimensions
  private screenWidth: number
  private screenHeight: number

  // Zone depths (as fraction of screen height)
  private readonly DEEP_WATER_THRESHOLD = 0.7 // 70% down screen
  private readonly ABYSS_THRESHOLD = 0.85 // 85% down screen

  // Treasure configuration
  private readonly TREASURE_CONFIGS: TreasureConfig[] = [
    { type: "bottle", points: 25, spawnWeight: 40, minDepth: 0 }, // Most common
    { type: "pearl", points: 50, spawnWeight: 30, minDepth: 0 }, // Common
    { type: "shark_tooth", points: 100, spawnWeight: 20, minDepth: 0 }, // Uncommon
    { type: "chest", points: 500, spawnWeight: 10, minDepth: 1 }, // Rare, abyss only
  ]

  // Spawning configuration
  private readonly SPAWN_INTERVAL = 10000 // Spawn new treasures every 10s
  private readonly MAX_TREASURES = 15 // Maximum treasures in the world
  private readonly TREASURE_LIFETIME = 120000 // Treasures despawn after 2 minutes if not collected
  private readonly COLLECTION_RADIUS = 30 // Distance to collect treasure

  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth
    this.screenHeight = screenHeight
    this.lastSpawnTime = Date.now()

    // Spawn initial treasures
    this.spawnTreasures()
  }

  /**
   * Update screen dimensions (call on window resize)
   */
  public resize(screenWidth: number, screenHeight: number): void {
    this.screenWidth = screenWidth
    this.screenHeight = screenHeight
  }

  /**
   * Check if position is in deep water zone
   */
  public isInDeepWater(y: number): boolean {
    return y > this.screenHeight * this.DEEP_WATER_THRESHOLD
  }

  /**
   * Check if position is in the abyss (ultra-deep zone)
   */
  public isInAbyss(y: number): boolean {
    return y > this.screenHeight * this.ABYSS_THRESHOLD
  }

  /**
   * Get depth level (0 = shallow, 1 = deep water, 2 = abyss)
   */
  public getDepthLevel(y: number): 0 | 1 | 2 {
    if (this.isInAbyss(y)) return 2
    if (this.isInDeepWater(y)) return 1
    return 0
  }

  /**
   * Get depth as fraction (0 = surface, 1 = bottom)
   */
  public getDepthFraction(y: number): number {
    return Math.max(0, Math.min(1, y / this.screenHeight))
  }

  /**
   * Spawn new treasures in the deep water zone
   */
  public spawnTreasures(): void {
    const now = Date.now()

    // Only spawn if we haven't reached max treasures
    if (this.treasures.size >= this.MAX_TREASURES) {
      return
    }

    // Spawn 2-4 treasures at a time
    const spawnCount = 2 + Math.floor(Math.random() * 3)

    for (let i = 0; i < spawnCount && this.treasures.size < this.MAX_TREASURES; i++) {
      const treasure = this.createRandomTreasure()
      if (treasure) {
        this.treasures.set(treasure.id, { ...treasure, spawnTime: now })
      }
    }
  }

  /**
   * Create a random treasure based on weighted probabilities
   */
  private createRandomTreasure(): Treasure | null {
    // Calculate total weight
    const totalWeight = this.TREASURE_CONFIGS.reduce((sum, config) => sum + config.spawnWeight, 0)

    // Pick random treasure type
    let random = Math.random() * totalWeight
    let selectedConfig: TreasureConfig | null = null

    for (const config of this.TREASURE_CONFIGS) {
      random -= config.spawnWeight
      if (random <= 0) {
        selectedConfig = config
        break
      }
    }

    if (!selectedConfig) {
      selectedConfig = this.TREASURE_CONFIGS[0]! // Fallback to bottle
    }

    // Determine spawn zone based on treasure's minimum depth requirement
    const deepWaterY = this.screenHeight * this.DEEP_WATER_THRESHOLD
    const abyssY = this.screenHeight * this.ABYSS_THRESHOLD

    let minY: number
    let maxY: number

    if (selectedConfig.minDepth >= 1) {
      // Abyss only
      minY = abyssY
      maxY = this.screenHeight - 50
    } else {
      // Deep water (including abyss)
      minY = deepWaterY
      maxY = this.screenHeight - 50
    }

    // Random position in zone
    const x = 50 + Math.random() * (this.screenWidth - 100)
    const y = minY + Math.random() * (maxY - minY)

    const id = `treasure_${this.treasureIdCounter++}`

    return {
      id,
      type: selectedConfig.type,
      x,
      y,
      points: selectedConfig.points,
      collected: false,
      spawnTime: Date.now(),
    }
  }

  /**
   * Check if player can collect a treasure at given position
   * Returns treasure if collectible, null otherwise
   */
  public collectTreasure(x: number, y: number, _playerId: string): Treasure | null {
    for (const treasure of Array.from(this.treasures.values())) {
      if (treasure.collected) continue

      const dist = Math.sqrt((x - treasure.x) ** 2 + (y - treasure.y) ** 2)

      if (dist <= this.COLLECTION_RADIUS) {
        treasure.collected = true
        return treasure
      }
    }

    return null
  }

  /**
   * Get all active treasures for rendering
   */
  public getTreasures(): Treasure[] {
    return Array.from(this.treasures.values())
  }

  /**
   * Get only uncollected treasures
   */
  public getUncollectedTreasures(): Treasure[] {
    return Array.from(this.treasures.values()).filter((t) => !t.collected)
  }

  /**
   * Get treasures near a position (for UI hints)
   */
  public getNearbyTreasures(x: number, y: number, radius: number): Treasure[] {
    const nearby: Treasure[] = []

    for (const treasure of Array.from(this.treasures.values())) {
      if (treasure.collected) continue

      const dist = Math.sqrt((x - treasure.x) ** 2 + (y - treasure.y) ** 2)
      if (dist <= radius) {
        nearby.push(treasure)
      }
    }

    return nearby
  }

  /**
   * Update treasure spawning and cleanup
   */
  public update(_delta: number): void {
    const now = Date.now()

    // Remove old collected treasures and expired uncollected treasures
    for (const [id, treasure] of Array.from(this.treasures.entries())) {
      const age = now - treasure.spawnTime

      // Remove if collected (after 1 second) or expired
      if ((treasure.collected && age > 1000) || age > this.TREASURE_LIFETIME) {
        this.treasures.delete(id)
      }
    }

    // Spawn new treasures periodically
    if (now - this.lastSpawnTime > this.SPAWN_INTERVAL) {
      this.spawnTreasures()
      this.lastSpawnTime = now
    }
  }

  /**
   * Get treasure by ID
   */
  public getTreasure(id: string): Treasure | null {
    return this.treasures.get(id) || null
  }

  /**
   * Get total treasure count
   */
  public getTreasureCount(): { total: number; collected: number; uncollected: number } {
    let collected = 0
    let uncollected = 0

    for (const treasure of Array.from(this.treasures.values())) {
      if (treasure.collected) {
        collected++
      } else {
        uncollected++
      }
    }

    return {
      total: this.treasures.size,
      collected,
      uncollected,
    }
  }

  /**
   * Get points value for a treasure type
   */
  public getTreasurePoints(type: TreasureType): number {
    const config = this.TREASURE_CONFIGS.find((c) => c.type === type)
    return config?.points || 0
  }

  /**
   * Clear all treasures (useful for game restart)
   */
  public clearAll(): void {
    this.treasures.clear()
    this.treasureIdCounter = 0
    this.lastSpawnTime = Date.now()
  }

  /**
   * Get zone boundaries
   */
  public getZoneBoundaries(): {
    deepWaterY: number
    abyssY: number
    screenHeight: number
  } {
    return {
      deepWaterY: this.screenHeight * this.DEEP_WATER_THRESHOLD,
      abyssY: this.screenHeight * this.ABYSS_THRESHOLD,
      screenHeight: this.screenHeight,
    }
  }

  /**
   * Get danger level at position (0-1, higher = more dangerous)
   * Useful for visual effects or gameplay
   */
  public getDangerLevel(y: number): number {
    const depthFraction = this.getDepthFraction(y)

    if (depthFraction < this.DEEP_WATER_THRESHOLD) {
      return 0 // Safe zone
    }

    if (depthFraction < this.ABYSS_THRESHOLD) {
      // Deep water: danger 0.3 to 0.7
      const deepProgress = (depthFraction - this.DEEP_WATER_THRESHOLD) / (this.ABYSS_THRESHOLD - this.DEEP_WATER_THRESHOLD)
      return 0.3 + deepProgress * 0.4
    }

    // Abyss: danger 0.7 to 1.0
    const abyssProgress = (depthFraction - this.ABYSS_THRESHOLD) / (1 - this.ABYSS_THRESHOLD)
    return 0.7 + abyssProgress * 0.3
  }

  /**
   * Get statistics for debugging/analytics
   */
  public getStats(): {
    totalTreasures: number
    uncollectedTreasures: number
    collectedTreasures: number
    treasuresByType: Record<TreasureType, number>
  } {
    const counts = this.getTreasureCount()
    const byType: Record<TreasureType, number> = {
      pearl: 0,
      chest: 0,
      bottle: 0,
      shark_tooth: 0,
    }

    for (const treasure of Array.from(this.treasures.values())) {
      if (!treasure.collected) {
        byType[treasure.type]++
      }
    }

    return {
      totalTreasures: counts.total,
      uncollectedTreasures: counts.uncollected,
      collectedTreasures: counts.collected,
      treasuresByType: byType,
    }
  }
}

/**
 * Factory function to create a deep water zone system
 */
export function createDeepWaterZone(screenWidth: number, screenHeight: number): DeepWaterZone {
  return new DeepWaterZone(screenWidth, screenHeight)
}
