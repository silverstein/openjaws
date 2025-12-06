import { Container, Graphics } from "pixi.js"
import type { BeachItemType, BeachItemEffect } from "./BeachItem"

/**
 * ThrownItem - Projectile version of beach items when thrown
 * Handles physics, trajectory, and collision detection for thrown items
 * Similar to Harpoon but for beach items
 */
export class ThrownItem {
  public container: Container
  public x: number
  public y: number

  private graphics: Graphics
  private itemType: BeachItemType
  private effect: BeachItemEffect
  private speed: number = 8
  private vx: number
  private vy: number
  private rotation: number = 0
  private alive: boolean = true
  private age: number = 0
  private lifetime: number = 3000 // 3 seconds max flight time

  // Trail effect for visual feedback
  private trailPoints: Array<{ x: number; y: number; alpha: number }> = []
  private maxTrailLength: number = 8

  /**
   * Create a thrown item projectile
   * @param startX - Starting X position
   * @param startY - Starting Y position
   * @param targetX - Target X position
   * @param targetY - Target Y position
   * @param itemType - Type of beach item being thrown
   * @param effect - Effect data for when item hits
   */
  constructor(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    itemType: BeachItemType,
    effect: BeachItemEffect
  ) {
    this.x = startX
    this.y = startY
    this.itemType = itemType
    this.effect = effect

    // Calculate velocity
    const dx = targetX - startX
    const dy = targetY - startY
    const dist = Math.sqrt(dx * dx + dy * dy)

    this.vx = (dx / dist) * this.speed
    this.vy = (dy / dist) * this.speed
    this.rotation = Math.atan2(dy, dx)

    // Create container
    this.container = new Container()
    this.container.x = startX
    this.container.y = startY
    this.container.rotation = this.rotation

    // Create graphics
    this.graphics = new Graphics()
    this.drawThrownItem()
    this.container.addChild(this.graphics)
  }

  /**
   * Draw the thrown item based on its type
   */
  private drawThrownItem(): void {
    this.graphics.clear()

    // Draw trail first (behind the item)
    this.drawTrail()

    // Draw item based on type
    switch (this.itemType) {
      case "beach_ball":
        this.drawBeachBall()
        break
      case "cooler":
        this.drawCooler()
        break
      case "umbrella":
        this.drawUmbrella()
        break
      case "pool_noodle":
        this.drawPoolNoodle()
        break
      default:
        this.drawGenericItem()
    }
  }

  /**
   * Draw motion trail
   */
  private drawTrail(): void {
    for (let i = 0; i < this.trailPoints.length; i++) {
      const point = this.trailPoints[i]
      if (point) {
        // Convert world coords to local coords
        const localX =
          (point.x - this.x) * Math.cos(-this.rotation) -
          (point.y - this.y) * Math.sin(-this.rotation)
        const localY =
          (point.x - this.x) * Math.sin(-this.rotation) +
          (point.y - this.y) * Math.cos(-this.rotation)

        this.graphics.circle(localX, localY, 3)
        this.graphics.fill({ color: 0xffffff, alpha: point.alpha * 0.3 })
      }
    }
  }

  /**
   * Draw beach ball in flight
   */
  private drawBeachBall(): void {
    // Simplified beach ball (spinning)
    const spinRotation = this.age * 0.1
    this.graphics.circle(0, 0, 12)
    this.graphics.fill({ color: 0xffffff })

    // Colored stripes
    const colors = [0xff0000, 0x0066ff, 0xffdd00]
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 + spinRotation
      this.graphics.moveTo(0, 0)
      this.graphics.arc(0, 0, 12, angle - 0.5, angle + 0.5)
      this.graphics.lineTo(0, 0)
      this.graphics.fill({ color: colors[i]!, alpha: 0.8 })
    }
  }

  /**
   * Draw cooler in flight
   */
  private drawCooler(): void {
    // Simplified spinning cooler
    this.graphics.rect(-15, -10, 30, 20)
    this.graphics.fill({ color: 0x4a90e2 })

    // White lid
    this.graphics.rect(-15, -10, 30, 6)
    this.graphics.fill({ color: 0xf0f0f0 })

    // Rotation spin effect
    this.graphics.rotation = this.age * 0.05
  }

  /**
   * Draw umbrella in javelin mode
   */
  private drawUmbrella(): void {
    // Closed umbrella flying like a spear
    this.graphics.rect(-25, -2, 50, 4)
    this.graphics.fill({ color: 0x8b4513 })

    // Sharp point
    this.graphics.moveTo(25, 0)
    this.graphics.lineTo(35, -5)
    this.graphics.lineTo(35, 5)
    this.graphics.closePath()
    this.graphics.fill({ color: 0xc0c0c0 })
  }

  /**
   * Draw pool noodle in flight
   */
  private drawPoolNoodle(): void {
    // Spinning noodle
    this.graphics.rotation = this.age * 0.08

    this.graphics.roundRect(-25, -4, 50, 8, 4)
    this.graphics.fill({ color: 0xff1493 })

    // Foam texture
    this.graphics.roundRect(-24, -3, 48, 6, 3)
    this.graphics.stroke({ width: 1, color: 0x000000, alpha: 0.2 })
  }

  /**
   * Draw generic item (fallback)
   */
  private drawGenericItem(): void {
    this.graphics.circle(0, 0, 10)
    this.graphics.fill({ color: 0xffaa00 })
  }

  /**
   * Update thrown item position and state
   * @param delta - Frame delta multiplier
   */
  public update(delta: number): void {
    if (!this.alive) return

    // Add current position to trail
    this.trailPoints.unshift({ x: this.x, y: this.y, alpha: 1 })

    // Update trail alphas and remove old points
    this.trailPoints = this.trailPoints
      .map((p, i) => ({ ...p, alpha: 1 - i / this.maxTrailLength }))
      .slice(0, this.maxTrailLength)

    // Update position
    this.x += this.vx * delta
    this.y += this.vy * delta

    // Update container
    this.container.x = this.x
    this.container.y = this.y

    // Update age
    this.age += delta * 16.67

    // Redraw with updated trail
    this.drawThrownItem()

    // Deactivate if too old
    if (this.age >= this.lifetime) {
      this.alive = false
    }
  }

  /**
   * Check collision with a circular target (like shark)
   * @param targetX - Target X position
   * @param targetY - Target Y position
   * @param targetRadius - Target collision radius
   * @returns True if collision detected
   */
  public checkCollision(targetX: number, targetY: number, targetRadius: number = 40): boolean {
    if (!this.alive) return false

    const dx = this.x - targetX
    const dy = this.y - targetY
    const dist = Math.sqrt(dx * dx + dy * dy)

    return dist < targetRadius + 15 // Item radius + target radius
  }

  /**
   * Get the effect this item will apply on hit
   */
  public getEffect(): BeachItemEffect {
    return this.effect
  }

  /**
   * Check if item is still active
   */
  public isAlive(): boolean {
    return this.alive
  }

  /**
   * Mark item as hit (deactivate)
   */
  public hit(): void {
    this.alive = false
  }

  /**
   * Get item position
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  /**
   * Clean up and destroy
   */
  public destroy(): void {
    this.alive = false
    this.container.destroy({ children: true })
  }
}
