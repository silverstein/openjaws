import { Container, Graphics } from "pixi.js"
import type { BeachItem, BeachItemEffect, BeachItemType } from "./BeachItem"

/**
 * Pool Noodle - A melee bonk weapon
 * Infinite uses but deals low damage (5 damage per bonk)
 * Fun, bouncy weapon that players can swing repeatedly
 */
export class PoolNoodle implements BeachItem {
  public container: Container
  public type: BeachItemType = "pool_noodle"
  public x: number
  public y: number
  public isPickedUp: boolean = false

  private graphics: Graphics
  private floatOffset: number = 0
  private swingAnimation: number = 0
  private isSwinging: boolean = false

  /**
   * Create a new pool noodle
   * @param x - Initial X position
   * @param y - Initial Y position
   */
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.floatOffset = Math.random() * Math.PI * 2

    // Create container
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create graphics
    this.graphics = new Graphics()
    this.drawPoolNoodle()
    this.container.addChild(this.graphics)
  }

  /**
   * Draw the pool noodle (bright colored foam cylinder)
   */
  private drawPoolNoodle(): void {
    this.graphics.clear()

    const length = 60
    const thickness = 8
    const noodleColor = 0xff1493 // Hot pink (can randomize: pink, green, blue, yellow)

    // Draw shadow when not picked up
    if (!this.isPickedUp) {
      this.graphics.ellipse(2, length / 2 + 6, thickness * 0.5, length * 0.5)
      this.graphics.fill({ color: 0x000000, alpha: 0.2 })
    }

    // Rotation for swing animation
    if (this.isSwinging) {
      this.graphics.rotation = Math.sin(this.swingAnimation) * 0.5
    }

    // Draw noodle body (cylinder with foam texture)
    this.graphics.roundRect(-thickness / 2, -length / 2, thickness, length, thickness / 2)
    this.graphics.fill({ color: noodleColor })

    // Add foam texture (horizontal lines)
    const segmentCount = 8
    for (let i = 1; i < segmentCount; i++) {
      const y = -length / 2 + (length / segmentCount) * i
      this.graphics.moveTo(-thickness / 2, y)
      this.graphics.lineTo(thickness / 2, y)
      this.graphics.stroke({ width: 1, color: 0x000000, alpha: 0.1 })
    }

    // Add highlight on left side
    this.graphics.roundRect(
      -thickness / 2 + 1,
      -length / 2 + 2,
      2,
      length - 4,
      1
    )
    this.graphics.fill({ color: 0xffffff, alpha: 0.4 })

    // Add shadow on right side
    this.graphics.roundRect(
      thickness / 2 - 2,
      -length / 2 + 2,
      2,
      length - 4,
      1
    )
    this.graphics.fill({ color: 0x000000, alpha: 0.2 })

    // Draw holes in foam (like real pool noodles)
    const holePositions = [-20, 0, 20]
    for (const y of holePositions) {
      this.graphics.circle(0, y, 2)
      this.graphics.fill({ color: 0x000000, alpha: 0.3 })

      // Highlight on hole edge
      this.graphics.circle(-1, y - 1, 1)
      this.graphics.fill({ color: 0xffffff, alpha: 0.5 })
    }

    // Add end caps (darker color)
    this.graphics.ellipse(0, -length / 2, thickness / 2, 3)
    this.graphics.fill({ color: noodleColor, alpha: 0.8 })

    this.graphics.ellipse(0, length / 2, thickness / 2, 3)
    this.graphics.fill({ color: noodleColor, alpha: 0.8 })

    // Draw outline
    this.graphics.roundRect(-thickness / 2, -length / 2, thickness, length, thickness / 2)
    this.graphics.stroke({ width: 1, color: 0x000000, alpha: 0.3 })
  }

  /**
   * Pick up the pool noodle
   */
  public pickup(): void {
    this.isPickedUp = true
    this.drawPoolNoodle()
  }

  /**
   * Use the pool noodle to bonk something
   * @param _targetX - X coordinate to bonk toward
   * @param _targetY - Y coordinate to bonk toward
   * @returns Damage effect (5 damage per bonk)
   */
  public use(_targetX: number, _targetY: number): BeachItemEffect {
    // Trigger swing animation
    this.isSwinging = true
    this.swingAnimation = 0

    // Pool noodle deals low damage but is reusable
    return {
      type: "damage",
      value: 5, // 5 damage per bonk
      description: "Pool noodle bonk!"
    }
  }

  /**
   * Update pool noodle animation
   * @param delta - Frame delta multiplier
   */
  public update(delta: number): void {
    // Float/bob animation when on beach
    if (!this.isPickedUp) {
      this.floatOffset += 0.04 * delta
      const floatY = Math.sin(this.floatOffset) * 4
      this.container.y = this.y + floatY

      // Gentle rotation as if floating
      this.container.rotation = Math.sin(this.floatOffset * 0.5) * 0.1
    }

    // Swing animation
    if (this.isSwinging) {
      this.swingAnimation += 0.2 * delta

      // End swing after complete cycle
      if (this.swingAnimation >= Math.PI * 2) {
        this.isSwinging = false
        this.swingAnimation = 0
      }

      this.drawPoolNoodle()
    }
  }

  /**
   * Get current position
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  /**
   * Clean up and destroy
   */
  public destroy(): void {
    this.container.destroy({ children: true })
  }
}
