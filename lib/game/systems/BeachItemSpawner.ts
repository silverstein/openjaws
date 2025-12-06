import type { BeachItem } from "../entities/BeachItem"
import { getRandomBeachItemType, type BeachItemType } from "../entities/BeachItem"
import { BeachBall } from "../entities/BeachBall"
import { Cooler } from "../entities/Cooler"
import { Umbrella } from "../entities/Umbrella"
import { Surfboard } from "../entities/Surfboard"
import { Sunscreen } from "../entities/Sunscreen"
import { PoolNoodle } from "../entities/PoolNoodle"

/**
 * Spawn point location on the beach
 */
interface SpawnPoint {
  x: number
  y: number
  occupied: boolean
  lastSpawnTime: number
}

/**
 * BeachItemSpawner - Manages spawning of beach items on the beach
 * Spawns items at the start and respawns them periodically
 * Items spawn on the beach (upper portion of the screen)
 */
export class BeachItemSpawner {
  private items: BeachItem[] = []
  private spawnPoints: SpawnPoint[] = []
  private screenWidth: number
  private beachHeight: number // y < beachHeight is considered "beach"

  // Spawning configuration
  private initialItemCount: number = 5 // Start with 5 items
  private maxItems: number = 8 // Max items on beach at once
  private respawnInterval: number = 15000 // Respawn every 15 seconds
  private lastRespawnCheck: number = 0

  /**
   * Create a new beach item spawner
   * @param screenWidth - Width of the game screen
   * @param screenHeight - Height of the game screen
   */
  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth
    this.beachHeight = screenHeight * 0.3 // Top 30% is beach

    this.createSpawnPoints()
    this.lastRespawnCheck = Date.now()
  }

  /**
   * Create spawn points distributed across the beach
   */
  private createSpawnPoints(): void {
    const pointCount = 12 // 12 potential spawn locations
    const marginX = 50 // Keep items away from edges
    const marginY = 20

    for (let i = 0; i < pointCount; i++) {
      // Create spawn points in a grid-like pattern with some randomness
      const row = Math.floor(i / 4)
      const col = i % 4

      const x = marginX + (col + 0.5) * ((this.screenWidth - marginX * 2) / 4) +
                (Math.random() - 0.5) * 40 // Add some randomness

      const y = marginY + (row + 0.5) * ((this.beachHeight - marginY * 2) / 3) +
                (Math.random() - 0.5) * 20

      this.spawnPoints.push({
        x,
        y,
        occupied: false,
        lastSpawnTime: 0
      })
    }
  }

  /**
   * Spawn initial items at game start
   */
  public spawnInitialItems(): void {
    const itemsToSpawn = Math.min(this.initialItemCount, this.spawnPoints.length)

    for (let i = 0; i < itemsToSpawn; i++) {
      // Pick a random unoccupied spawn point
      const availablePoints = this.spawnPoints.filter(p => !p.occupied)
      if (availablePoints.length === 0) break

      const point = availablePoints[Math.floor(Math.random() * availablePoints.length)]
      if (point) {
        this.spawnItem(point)
      }
    }
  }

  /**
   * Spawn a single item at a spawn point
   * @param point - Spawn point to spawn at
   */
  private spawnItem(point: SpawnPoint): void {
    const itemType = getRandomBeachItemType()
    const item = this.createItemOfType(itemType, point.x, point.y)

    if (item) {
      this.items.push(item)
      point.occupied = true
      point.lastSpawnTime = Date.now()
    }
  }

  /**
   * Create an item instance of a specific type
   * @param type - Beach item type to create
   * @param x - X position
   * @param y - Y position
   */
  private createItemOfType(type: BeachItemType, x: number, y: number): BeachItem | null {
    switch (type) {
      case "beach_ball":
        return new BeachBall(x, y)
      case "cooler":
        return new Cooler(x, y)
      case "umbrella":
        return new Umbrella(x, y)
      case "surfboard":
        return new Surfboard(x, y)
      case "sunscreen":
        return new Sunscreen(x, y)
      case "pool_noodle":
        return new PoolNoodle(x, y)
      default:
        console.warn(`Unknown beach item type: ${type}`)
        return null
    }
  }

  /**
   * Update spawner - handles respawning items periodically
   * @param delta - Frame delta multiplier
   */
  public update(delta: number): void {
    const now = Date.now()

    // Update all items
    for (const item of this.items) {
      item.update(delta)
    }

    // Check if it's time to respawn
    if (now - this.lastRespawnCheck >= this.respawnInterval) {
      this.lastRespawnCheck = now
      this.tryRespawn()
    }
  }

  /**
   * Try to respawn items if under max count
   */
  private tryRespawn(): void {
    const currentCount = this.items.filter(item => !item.isPickedUp).length

    if (currentCount < this.maxItems) {
      const itemsToSpawn = Math.min(2, this.maxItems - currentCount) // Spawn up to 2 at a time

      for (let i = 0; i < itemsToSpawn; i++) {
        const availablePoints = this.spawnPoints.filter(p => !p.occupied)
        if (availablePoints.length === 0) break

        const point = availablePoints[Math.floor(Math.random() * availablePoints.length)]
        if (point) {
          this.spawnItem(point)
        }
      }
    }
  }

  /**
   * Get all spawned items (for rendering)
   */
  public getItems(): BeachItem[] {
    return this.items
  }

  /**
   * Get items that are available to pick up (not picked up)
   */
  public getAvailableItems(): BeachItem[] {
    return this.items.filter(item => !item.isPickedUp)
  }

  /**
   * Attempt to pick up an item at a position
   * @param x - X position to check
   * @param y - Y position to check
   * @param pickupRadius - Radius for pickup detection (default 30)
   * @returns Picked up item or null if none found
   */
  public pickupItem(x: number, y: number, pickupRadius: number = 30): BeachItem | null {
    for (const item of this.items) {
      if (item.isPickedUp) continue

      const pos = item.getPosition()
      const dx = pos.x - x
      const dy = pos.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= pickupRadius) {
        item.pickup()

        // Mark spawn point as unoccupied
        const point = this.findSpawnPointForItem(item)
        if (point) {
          point.occupied = false
        }

        return item
      }
    }

    return null
  }

  /**
   * Find the spawn point associated with an item
   * @param item - Item to find spawn point for
   */
  private findSpawnPointForItem(item: BeachItem): SpawnPoint | null {
    const pos = item.getPosition()

    // Find closest spawn point
    let closestPoint: SpawnPoint | null = null
    let closestDist = Infinity

    for (const point of this.spawnPoints) {
      const dx = point.x - pos.x
      const dy = point.y - pos.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < closestDist) {
        closestDist = dist
        closestPoint = point
      }
    }

    return closestPoint
  }

  /**
   * Remove an item from the spawner (for one-time use items)
   * @param item - Item to remove
   */
  public removeItem(item: BeachItem): void {
    const index = this.items.indexOf(item)
    if (index !== -1) {
      this.items.splice(index, 1)

      // Mark spawn point as unoccupied
      const point = this.findSpawnPointForItem(item)
      if (point) {
        point.occupied = false
      }

      // Clean up item
      item.destroy()
    }
  }

  /**
   * Get item count statistics
   */
  public getStats(): {
    total: number
    available: number
    pickedUp: number
  } {
    const available = this.items.filter(item => !item.isPickedUp).length
    const pickedUp = this.items.filter(item => item.isPickedUp).length

    return {
      total: this.items.length,
      available,
      pickedUp
    }
  }

  /**
   * Update screen size (for responsive layouts)
   * @param width - New screen width
   * @param height - New screen height
   */
  public resize(width: number, height: number): void {
    this.screenWidth = width
    this.beachHeight = height * 0.3

    // Recreate spawn points with new dimensions
    this.spawnPoints = []
    this.createSpawnPoints()
  }

  /**
   * Clean up all items
   */
  public destroy(): void {
    for (const item of this.items) {
      item.destroy()
    }
    this.items = []
    this.spawnPoints = []
  }
}
