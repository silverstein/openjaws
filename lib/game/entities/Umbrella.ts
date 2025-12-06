import { Container, Graphics } from "pixi.js"
import type { BeachItem, BeachItemEffect, BeachItemType } from "./BeachItem"

/**
 * Umbrella - A throwable javelin-style weapon
 * Deals significant damage but breaks on impact (one-time use)
 * When thrown, umbrella closes and flies like a spear
 */
export class Umbrella implements BeachItem {
  public container: Container
  public type: BeachItemType = "umbrella"
  public x: number
  public y: number
  public isPickedUp: boolean = false

  private graphics: Graphics
  private canopyGraphics: Graphics
  private isClosed: boolean = false

  /**
   * Create a new beach umbrella
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

    // Create graphics layers
    this.graphics = new Graphics()
    this.canopyGraphics = new Graphics()

    this.drawUmbrella()
    this.container.addChild(this.graphics)
    this.container.addChild(this.canopyGraphics)
  }

  /**
   * Draw the umbrella (open or closed state)
   */
  private drawUmbrella(): void {
    this.graphics.clear()
    this.canopyGraphics.clear()

    if (!this.isClosed) {
      // Draw open umbrella
      this.drawOpenUmbrella()
    } else {
      // Draw closed umbrella (javelin mode)
      this.drawClosedUmbrella()
    }
  }

  /**
   * Draw open umbrella for when it's on the beach
   */
  private drawOpenUmbrella(): void {
    const canopyRadius = 35
    const poleHeight = 60

    // Draw shadow when not picked up
    if (!this.isPickedUp) {
      this.graphics.ellipse(2, -poleHeight + canopyRadius + 5, canopyRadius, canopyRadius * 0.3)
      this.graphics.fill({ color: 0x000000, alpha: 0.2 })
    }

    // Draw pole (wooden)
    this.graphics.moveTo(0, 0)
    this.graphics.lineTo(0, -poleHeight)
    this.graphics.stroke({ width: 4, color: 0x8b4513 }) // Brown wood

    // Draw pointed tip at top
    this.graphics.moveTo(-2, -poleHeight)
    this.graphics.lineTo(0, -poleHeight - 5)
    this.graphics.lineTo(2, -poleHeight)
    this.graphics.closePath()
    this.graphics.fill({ color: 0xc0c0c0 }) // Silver tip

    // Draw canopy with colorful stripes
    const stripeCount = 8
    const stripeAngle = (Math.PI * 2) / stripeCount
    const colors = [0xff6b6b, 0xffd93d, 0xff6b6b, 0xffd93d] // Red and yellow alternating

    for (let i = 0; i < stripeCount; i++) {
      const startAngle = i * stripeAngle - Math.PI / 2
      const endAngle = (i + 1) * stripeAngle - Math.PI / 2
      const color = colors[i % colors.length]!

      this.canopyGraphics.moveTo(0, -poleHeight)
      this.canopyGraphics.arc(0, -poleHeight, canopyRadius, startAngle, endAngle)
      this.canopyGraphics.lineTo(0, -poleHeight)
      this.canopyGraphics.fill({ color, alpha: 0.9 })
    }

    // Draw canopy outline
    this.canopyGraphics.circle(0, -poleHeight, canopyRadius)
    this.canopyGraphics.stroke({ width: 2, color: 0x333333, alpha: 0.3 })

    // Draw umbrella ribs
    for (let i = 0; i < stripeCount; i++) {
      const angle = i * stripeAngle - Math.PI / 2
      const ribX = Math.cos(angle) * canopyRadius
      const ribY = Math.sin(angle) * canopyRadius
      this.canopyGraphics.moveTo(0, -poleHeight)
      this.canopyGraphics.lineTo(ribX, -poleHeight + ribY)
      this.canopyGraphics.stroke({ width: 1, color: 0x333333, alpha: 0.5 })
    }
  }

  /**
   * Draw closed umbrella in javelin mode
   */
  private drawClosedUmbrella(): void {
    const length = 60

    // Draw pole (longer and thinner)
    this.graphics.rect(-2, -length, 4, length)
    this.graphics.fill({ color: 0x8b4513 }) // Brown wood

    // Draw closed canopy (cone shape)
    this.graphics.moveTo(0, -length)
    this.graphics.lineTo(-8, -length + 15)
    this.graphics.lineTo(8, -length + 15)
    this.graphics.closePath()
    this.graphics.fill({ color: 0xff6b6b })

    // Draw point
    this.graphics.moveTo(-3, -length)
    this.graphics.lineTo(0, -length - 8)
    this.graphics.lineTo(3, -length)
    this.graphics.closePath()
    this.graphics.fill({ color: 0xc0c0c0 }) // Silver tip
  }

  /**
   * Pick up the umbrella
   */
  public pickup(): void {
    this.isPickedUp = true
    this.drawUmbrella()
  }

  /**
   * Throw the umbrella like a javelin
   * @param _targetX - X coordinate to throw toward
   * @param _targetY - Y coordinate to throw toward
   * @returns Damage effect (10 damage)
   */
  public use(_targetX: number, _targetY: number): BeachItemEffect {
    // Close umbrella for throwing
    this.isClosed = true
    this.drawUmbrella()

    // Umbrella deals significant damage but is one-time use
    return {
      type: "damage",
      value: 20, // 20 damage to shark (high because it breaks)
      description: "Umbrella javelin strike!"
    }
  }

  /**
   * Update umbrella animation
   * @param _delta - Frame delta multiplier
   */
  public update(_delta: number): void {
    if (!this.isPickedUp && !this.isClosed) {
      // Gentle sway in the breeze
      const time = Date.now() * 0.001
      this.container.rotation = Math.sin(time) * 0.05
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
