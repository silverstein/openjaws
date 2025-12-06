import { Container, Graphics } from "pixi.js"
import type { BeachItem, BeachItemEffect, BeachItemType } from "./BeachItem"

/**
 * Surfboard - A rideable escape item
 * Provides 3x speed boost for 3 seconds, then breaks
 * Player cannot attack while riding
 * One-time use item
 */
export class Surfboard implements BeachItem {
  public container: Container
  public type: BeachItemType = "surfboard"
  public x: number
  public y: number
  public isPickedUp: boolean = false

  private graphics: Graphics
  private isBeingRidden: boolean = false
  private wobbleOffset: number = 0

  /**
   * Create a new surfboard
   * @param x - Initial X position
   * @param y - Initial Y position
   */
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.wobbleOffset = Math.random() * Math.PI * 2

    // Create container
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create graphics
    this.graphics = new Graphics()
    this.drawSurfboard()
    this.container.addChild(this.graphics)
  }

  /**
   * Draw the surfboard with gradient colors
   */
  private drawSurfboard(): void {
    this.graphics.clear()

    const length = 70
    const width = 25

    // Draw shadow when on beach
    if (!this.isPickedUp && !this.isBeingRidden) {
      this.graphics.ellipse(2, length / 2 + 8, width * 0.4, length * 0.5)
      this.graphics.fill({ color: 0x000000, alpha: 0.2 })
    }

    // Draw surfboard body (gradient effect using multiple layers)
    // Base layer - bright blue
    this.drawSurfboardShape(0, 0, length, width, 0x00d4ff)

    // Middle gradient layer - cyan
    this.drawSurfboardShape(0, 0, length * 0.8, width * 0.95, 0x00ffff, 0.7)

    // Top highlight layer - light cyan
    this.drawSurfboardShape(0, 0, length * 0.6, width * 0.9, 0xaaffff, 0.5)

    // Draw fin (bottom of board)
    this.graphics.moveTo(0, length / 2 - 10)
    this.graphics.lineTo(-6, length / 2)
    this.graphics.lineTo(6, length / 2)
    this.graphics.closePath()
    this.graphics.fill({ color: 0x333333 })

    // Draw deck pad (top section for grip)
    const padStartY = length / 2 - 25
    for (let i = 0; i < 3; i++) {
      const y = padStartY + i * 5
      this.graphics.rect(-8, y, 16, 3)
      this.graphics.fill({ color: 0x000000, alpha: 0.2 })
    }

    // Draw outline
    this.drawSurfboardOutline(0, 0, length, width)

    // Add wave decals
    this.drawWaveDecals()
  }

  /**
   * Draw surfboard shape (rounded edges)
   */
  private drawSurfboardShape(
    x: number,
    y: number,
    length: number,
    width: number,
    color: number,
    alpha: number = 1
  ): void {
    // Draw elongated rounded rectangle
    this.graphics.moveTo(x, y - length / 2 + width / 4)

    // Top curve (nose)
    this.graphics.quadraticCurveTo(x, y - length / 2, x, y - length / 2 + width / 3)

    // Right side
    this.graphics.lineTo(x + width / 2, y + length / 2 - width / 3)

    // Bottom curve (tail)
    this.graphics.quadraticCurveTo(x, y + length / 2, x - width / 2, y + length / 2 - width / 3)

    // Left side
    this.graphics.lineTo(x - width / 2, y - length / 2 + width / 3)

    this.graphics.closePath()
    this.graphics.fill({ color, alpha })
  }

  /**
   * Draw surfboard outline
   */
  private drawSurfboardOutline(x: number, y: number, length: number, width: number): void {
    this.graphics.moveTo(x, y - length / 2 + width / 4)
    this.graphics.quadraticCurveTo(x, y - length / 2, x, y - length / 2 + width / 3)
    this.graphics.lineTo(x + width / 2, y + length / 2 - width / 3)
    this.graphics.quadraticCurveTo(x, y + length / 2, x - width / 2, y + length / 2 - width / 3)
    this.graphics.lineTo(x - width / 2, y - length / 2 + width / 3)
    this.graphics.stroke({ width: 2, color: 0x0099cc, alpha: 0.8 })
  }

  /**
   * Draw decorative wave patterns
   */
  private drawWaveDecals(): void {
    // Small wave patterns on the board
    const waveY = -15
    this.graphics.moveTo(-10, waveY)
    this.graphics.quadraticCurveTo(-5, waveY - 3, 0, waveY)
    this.graphics.quadraticCurveTo(5, waveY + 3, 10, waveY)
    this.graphics.stroke({ width: 2, color: 0xffffff, alpha: 0.5 })

    // Add brand logo spot (circle)
    this.graphics.circle(0, -25, 6)
    this.graphics.fill({ color: 0xffffff, alpha: 0.7 })
  }

  /**
   * Pick up the surfboard
   */
  public pickup(): void {
    this.isPickedUp = true
    this.drawSurfboard()
  }

  /**
   * Use the surfboard (start riding it)
   * @param _targetX - X coordinate to ride toward
   * @param _targetY - Y coordinate to ride toward
   * @returns Speed boost effect for 3 seconds
   */
  public use(_targetX: number, _targetY: number): BeachItemEffect {
    this.isBeingRidden = true

    // Surfboard provides 3x speed for 3 seconds
    return {
      type: "speed",
      value: 3000, // 3 seconds duration
      description: "Surfing to safety!",
      secondary: {
        type: "invincibility",
        value: 3000 // Also invincible while riding
      }
    }
  }

  /**
   * Update surfboard animation
   * @param delta - Frame delta multiplier
   */
  public update(delta: number): void {
    if (!this.isPickedUp && !this.isBeingRidden) {
      // Wobble gently as if floating on water
      this.wobbleOffset += 0.03 * delta
      const wobbleAngle = Math.sin(this.wobbleOffset) * 0.08
      this.container.rotation = wobbleAngle
    }

    if (this.isBeingRidden) {
      // Tilt forward when being ridden
      this.container.rotation = Math.PI / 2 // 90 degrees
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
