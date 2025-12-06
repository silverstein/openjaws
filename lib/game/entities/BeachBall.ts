import { Container, Graphics } from "pixi.js"
import type { BeachItem, BeachItemEffect, BeachItemType } from "./BeachItem"

/**
 * Beach Ball - A lightweight throwable distraction item
 * Throws a colorful striped ball that briefly stuns the shark
 */
export class BeachBall implements BeachItem {
  public container: Container
  public type: BeachItemType = "beach_ball"
  public x: number
  public y: number
  public isPickedUp: boolean = false

  private graphics: Graphics
  private bobOffset: number = 0
  private bobSpeed: number = 0.05
  private bobAmplitude: number = 3

  /**
   * Create a new beach ball
   * @param x - Initial X position
   * @param y - Initial Y position
   */
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.bobOffset = Math.random() * Math.PI * 2 // Random starting phase

    // Create container
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create graphics
    this.graphics = new Graphics()
    this.drawBall()
    this.container.addChild(this.graphics)
  }

  /**
   * Draw the beach ball with colorful stripes
   */
  private drawBall(): void {
    this.graphics.clear()

    const radius = 15

    // Draw main ball body (white base)
    this.graphics.circle(0, 0, radius)
    this.graphics.fill({ color: 0xffffff })

    // Draw colored stripes (red, blue, yellow)
    const stripeColors = [0xff0000, 0x0066ff, 0xffdd00]
    const stripeAngle = (Math.PI * 2) / stripeColors.length

    for (let i = 0; i < stripeColors.length; i++) {
      const startAngle = i * stripeAngle - Math.PI / 2
      const endAngle = (i + 1) * stripeAngle - Math.PI / 2

      // Draw wedge-shaped stripe
      this.graphics.moveTo(0, 0)
      this.graphics.arc(0, 0, radius, startAngle, endAngle)
      this.graphics.lineTo(0, 0)
      this.graphics.fill({ color: stripeColors[i]!, alpha: 0.8 })
    }

    // Add highlight for 3D effect
    this.graphics.circle(-5, -5, 5)
    this.graphics.fill({ color: 0xffffff, alpha: 0.6 })

    // Add outline
    this.graphics.circle(0, 0, radius)
    this.graphics.stroke({ width: 2, color: 0x333333, alpha: 0.3 })

    // Add shadow when not picked up
    if (!this.isPickedUp) {
      this.graphics.ellipse(2, radius + 5, radius * 0.8, radius * 0.3)
      this.graphics.fill({ color: 0x000000, alpha: 0.2 })
    }
  }

  /**
   * Pick up the beach ball
   */
  public pickup(): void {
    this.isPickedUp = true
    this.drawBall() // Redraw without shadow
  }

  /**
   * Throw the beach ball at a target location
   * @param _targetX - X coordinate to throw toward
   * @param _targetY - Y coordinate to throw toward
   * @returns Stun effect for 0.5 seconds
   */
  public use(_targetX: number, _targetY: number): BeachItemEffect {
    // Beach ball provides a brief distraction/stun
    return {
      type: "stun",
      value: 500, // 0.5 seconds
      description: "Beach ball distraction!"
    }
  }

  /**
   * Update beach ball animation (bobbing when on ground)
   * @param delta - Frame delta multiplier
   */
  public update(delta: number): void {
    if (!this.isPickedUp) {
      // Bob up and down gently
      this.bobOffset += this.bobSpeed * delta
      const bobY = Math.sin(this.bobOffset) * this.bobAmplitude
      this.container.y = this.y + bobY

      // Gentle rotation
      this.graphics.rotation += 0.01 * delta
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
