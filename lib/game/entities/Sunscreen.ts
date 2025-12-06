import { Container, Graphics } from "pixi.js"
import type { BeachItem, BeachItemEffect, BeachItemType } from "./BeachItem"

/**
 * Sunscreen - A protective item that provides temporary invulnerability
 * Apply for 2 seconds of invincibility
 * Has a 30 second cooldown between uses
 * Not one-time use but requires cooldown management
 */
export class Sunscreen implements BeachItem {
  public container: Container
  public type: BeachItemType = "sunscreen"
  public x: number
  public y: number
  public isPickedUp: boolean = false

  private graphics: Graphics
  private shimmerOffset: number = 0
  private lastUseTime: number = 0
  private cooldownDuration: number = 30000 // 30 seconds

  /**
   * Create a new sunscreen bottle
   * @param x - Initial X position
   * @param y - Initial Y position
   */
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.shimmerOffset = Math.random() * Math.PI * 2

    // Create container
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create graphics
    this.graphics = new Graphics()
    this.drawSunscreen()
    this.container.addChild(this.graphics)
  }

  /**
   * Draw the sunscreen bottle
   */
  private drawSunscreen(): void {
    this.graphics.clear()

    const bottleWidth = 18
    const bottleHeight = 35
    const capHeight = 8

    // Draw shadow when not picked up
    if (!this.isPickedUp) {
      this.graphics.ellipse(2, bottleHeight / 2 + 5, bottleWidth * 0.4, bottleHeight * 0.15)
      this.graphics.fill({ color: 0x000000, alpha: 0.2 })
    }

    // Draw bottle body (white/cream color)
    this.graphics.roundRect(
      -bottleWidth / 2,
      -bottleHeight / 2 + capHeight,
      bottleWidth,
      bottleHeight - capHeight,
      4
    )
    this.graphics.fill({ color: 0xf5f5dc }) // Beige/cream

    // Draw bottle outline
    this.graphics.roundRect(
      -bottleWidth / 2,
      -bottleHeight / 2 + capHeight,
      bottleWidth,
      bottleHeight - capHeight,
      4
    )
    this.graphics.stroke({ width: 2, color: 0xd4d4c8 })

    // Draw cap (orange)
    this.graphics.roundRect(-bottleWidth / 2 + 2, -bottleHeight / 2, bottleWidth - 4, capHeight, 2)
    this.graphics.fill({ color: 0xff8c00 }) // Dark orange

    // Draw cap ridges for grip
    for (let i = 0; i < 3; i++) {
      const y = -bottleHeight / 2 + 2 + i * 2
      this.graphics.moveTo(-bottleWidth / 2 + 3, y)
      this.graphics.lineTo(bottleWidth / 2 - 3, y)
      this.graphics.stroke({ width: 1, color: 0xff7700, alpha: 0.6 })
    }

    // Draw label area (middle section)
    const labelHeight = 15
    const labelY = -bottleHeight / 2 + capHeight + 8
    this.graphics.roundRect(-bottleWidth / 2 + 2, labelY, bottleWidth - 4, labelHeight, 2)
    this.graphics.fill({ color: 0xffa500, alpha: 0.7 }) // Light orange label

    // Draw SPF text
    this.graphics.rect(-6, labelY + 3, 12, 9)
    this.graphics.fill({ color: 0xffffff })

    // Draw text lines to simulate "SPF"
    const textX = -4
    const textY = labelY + 5
    this.graphics.rect(textX, textY, 8, 2)
    this.graphics.rect(textX, textY + 3, 8, 2)
    this.graphics.fill({ color: 0xff6600 })

    // Draw sun icon on label
    const sunX = 0
    const sunY = labelY + labelHeight - 5
    this.graphics.circle(sunX, sunY, 3)
    this.graphics.fill({ color: 0xffff00, alpha: 0.8 })

    // Add shimmer effect (animated)
    const shimmerX = -bottleWidth / 2 + 4 + Math.sin(this.shimmerOffset) * 2
    const shimmerY = -bottleHeight / 2 + capHeight + 5
    this.graphics.rect(shimmerX, shimmerY, 2, 10)
    this.graphics.fill({ color: 0xffffff, alpha: 0.5 })

    // Draw highlight on bottle
    this.graphics.rect(-bottleWidth / 2 + 3, -bottleHeight / 2 + capHeight + 2, 3, bottleHeight - capHeight - 4)
    this.graphics.fill({ color: 0xffffff, alpha: 0.3 })

    // Draw flip-top cap detail
    this.graphics.rect(-3, -bottleHeight / 2 - 2, 6, 2)
    this.graphics.fill({ color: 0xff7700 })

    // If on cooldown, add visual indicator
    if (this.isOnCooldown()) {
      const cooldownPercent = this.getCooldownPercent()
      const overlayAlpha = 0.5 * cooldownPercent

      this.graphics.roundRect(
        -bottleWidth / 2,
        -bottleHeight / 2,
        bottleWidth,
        bottleHeight,
        4
      )
      this.graphics.fill({ color: 0x000000, alpha: overlayAlpha })
    }
  }

  /**
   * Check if sunscreen is on cooldown
   */
  private isOnCooldown(): boolean {
    const timeSinceUse = Date.now() - this.lastUseTime
    return timeSinceUse < this.cooldownDuration
  }

  /**
   * Get cooldown percentage (0-1, where 1 is fully on cooldown)
   */
  private getCooldownPercent(): number {
    if (!this.isOnCooldown()) return 0
    const timeSinceUse = Date.now() - this.lastUseTime
    return 1 - timeSinceUse / this.cooldownDuration
  }

  /**
   * Pick up the sunscreen
   */
  public pickup(): void {
    this.isPickedUp = true
    this.drawSunscreen()
  }

  /**
   * Apply sunscreen for temporary invulnerability
   * @param _targetX - X coordinate (not used for sunscreen)
   * @param _targetY - Y coordinate (not used for sunscreen)
   * @returns Invulnerability effect for 2 seconds
   */
  public use(_targetX: number, _targetY: number): BeachItemEffect {
    // Update last use time for cooldown tracking
    this.lastUseTime = Date.now()

    // Sunscreen provides invincibility
    return {
      type: "invincibility",
      value: 2000, // 2 seconds of protection
      description: "SPF 1000 protection activated!"
    }
  }

  /**
   * Update sunscreen animation
   * @param delta - Frame delta multiplier
   */
  public update(delta: number): void {
    // Animate shimmer effect
    this.shimmerOffset += 0.05 * delta
    this.drawSunscreen()

    // Gentle bobbing when on beach
    if (!this.isPickedUp) {
      const bobY = Math.sin(this.shimmerOffset * 0.5) * 2
      this.container.y = this.y + bobY
    }
  }

  /**
   * Get current position
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  /**
   * Get remaining cooldown time in seconds
   */
  public getCooldownTimeRemaining(): number {
    if (!this.isOnCooldown()) return 0
    return Math.ceil((this.cooldownDuration - (Date.now() - this.lastUseTime)) / 1000)
  }

  /**
   * Clean up and destroy
   */
  public destroy(): void {
    this.container.destroy({ children: true })
  }
}
