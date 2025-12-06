import { Container, Graphics } from "pixi.js"
import type { BeachItem, BeachItemEffect, BeachItemType } from "./BeachItem"

/**
 * Cooler - A heavy throwable that stuns and creates ice slick
 * Only Boomer Dad has the strength to throw it effectively
 * Others can carry it but can't throw it
 */
export class Cooler implements BeachItem {
  public container: Container
  public type: BeachItemType = "cooler"
  public x: number
  public y: number
  public isPickedUp: boolean = false

  private graphics: Graphics
  private handleGraphics: Graphics

  /**
   * Create a new cooler
   * @param x - Initial X position
   * @param y - Initial Y position
   */
  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    // Create container
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create graphics
    this.graphics = new Graphics()
    this.handleGraphics = new Graphics()

    this.drawCooler()
    this.container.addChild(this.graphics)
    this.container.addChild(this.handleGraphics)
  }

  /**
   * Draw the cooler with ice chest appearance
   */
  private drawCooler(): void {
    this.graphics.clear()
    this.handleGraphics.clear()

    const width = 40
    const height = 30

    // Draw shadow when not picked up
    if (!this.isPickedUp) {
      this.graphics.ellipse(2, height / 2 + 8, width * 0.5, height * 0.2)
      this.graphics.fill({ color: 0x000000, alpha: 0.3 })
    }

    // Draw cooler body (blue ice chest)
    this.graphics.roundRect(-width / 2, -height / 2, width, height, 3)
    this.graphics.fill({ color: 0x4a90e2 }) // Nice blue

    // Draw lid line
    this.graphics.moveTo(-width / 2, -height / 2 + 12)
    this.graphics.lineTo(width / 2, -height / 2 + 12)
    this.graphics.stroke({ width: 2, color: 0x2c5aa0 })

    // Draw white lid top
    this.graphics.roundRect(-width / 2, -height / 2, width, 12, 3)
    this.graphics.fill({ color: 0xf0f0f0 })

    // Draw drain plug
    this.graphics.circle(width / 2 - 6, height / 2 - 6, 3)
    this.graphics.fill({ color: 0x333333 })

    // Draw ice cube decals on side
    const icePositions = [
      { x: -10, y: 2 },
      { x: 5, y: 4 },
      { x: -2, y: 8 }
    ]

    for (const pos of icePositions) {
      this.graphics.rect(pos.x - 3, pos.y - 3, 6, 6)
      this.graphics.fill({ color: 0x87ceeb, alpha: 0.6 })
      this.graphics.rect(pos.x - 2, pos.y - 2, 4, 4)
      this.graphics.stroke({ width: 1, color: 0xffffff, alpha: 0.8 })
    }

    // Draw handle
    this.handleGraphics.moveTo(-15, -height / 2 - 2)
    this.handleGraphics.lineTo(-15, -height / 2 - 8)
    this.handleGraphics.lineTo(15, -height / 2 - 8)
    this.handleGraphics.lineTo(15, -height / 2 - 2)
    this.handleGraphics.stroke({ width: 3, color: 0x666666 })

    // Draw latch clips
    const latchPositions = [-12, 12]
    for (const x of latchPositions) {
      this.graphics.rect(x - 2, -height / 2 + 10, 4, 6)
      this.graphics.fill({ color: 0x888888 })
    }

    // Add 3D highlight on lid
    this.graphics.moveTo(-width / 2 + 2, -height / 2 + 2)
    this.graphics.lineTo(width / 2 - 2, -height / 2 + 2)
    this.graphics.stroke({ width: 2, color: 0xffffff, alpha: 0.4 })
  }

  /**
   * Pick up the cooler
   */
  public pickup(): void {
    this.isPickedUp = true
    this.drawCooler() // Redraw without shadow
  }

  /**
   * Throw the cooler at a target (if player is strong enough)
   * @param _targetX - X coordinate to throw toward
   * @param _targetY - Y coordinate to throw toward
   * @returns Stun effect + ice slick secondary effect
   */
  public use(_targetX: number, _targetY: number): BeachItemEffect {
    // Cooler provides stun + creates slippery ice spot
    return {
      type: "stun",
      value: 1000, // 1 second stun
      description: "Ice chest knockout!",
      secondary: {
        type: "slippery",
        value: 3000, // Ice slick lasts 3 seconds
        duration: 3000
      }
    }
  }

  /**
   * Update cooler (minimal animation when on ground)
   * @param _delta - Frame delta multiplier
   */
  public update(_delta: number): void {
    // Cooler is heavy and stationary
    // Could add condensation drips animation here
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
