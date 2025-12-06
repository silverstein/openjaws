import { Container, Graphics } from "pixi.js"
import type { TreasureType } from "../systems/DeepWaterZone"

/**
 * TreasureItem Entity - Visual representation of collectible deep water treasures
 *
 * Treasure Types & Visuals:
 * - Pearl: White/iridescent circle with shimmer effect
 * - Chest: Golden box with sparkle effect
 * - Bottle: Green bottle shape with message inside
 * - Shark Tooth: White triangle with glow effect
 *
 * Features:
 * - Animated shimmer/bob effects
 * - Collection animation
 * - Depth-based opacity (fade at extreme depths)
 */
export class TreasureItem {
  public container: Container
  public x: number
  public y: number
  public type: TreasureType
  public points: number

  private graphics: Graphics
  private isCollected: boolean = false
  private animationTime: number = 0
  private collectionAnimationProgress: number = 0
  private readonly COLLECTION_ANIMATION_DURATION = 500 // 0.5 seconds

  constructor(type: TreasureType, x: number, y: number, points: number) {
    this.type = type
    this.x = x
    this.y = y
    this.points = points

    this.container = new Container()
    this.container.x = x
    this.container.y = y

    this.graphics = new Graphics()
    this.container.addChild(this.graphics)

    this.draw()
  }

  /**
   * Draw the treasure based on its type
   */
  private draw(): void {
    this.graphics.clear()

    if (this.isCollected) {
      this.drawCollectionAnimation()
      return
    }

    // Bob animation
    const bobOffset = Math.sin(this.animationTime * 0.002) * 3

    switch (this.type) {
      case "pearl":
        this.drawPearl(bobOffset)
        break
      case "chest":
        this.drawChest(bobOffset)
        break
      case "bottle":
        this.drawBottle(bobOffset)
        break
      case "shark_tooth":
        this.drawSharkTooth(bobOffset)
        break
    }
  }

  /**
   * Draw pearl treasure
   */
  private drawPearl(bobOffset: number): void {
    // Main pearl body
    this.graphics.circle(0, bobOffset, 10)
    this.graphics.fill(0xf5f5f5) // White smoke

    // Iridescent shimmer (cycling colors)
    const shimmerHue = (this.animationTime * 0.1) % 360
    const shimmerColor = this.hslToRgb(shimmerHue, 0.5, 0.8)
    this.graphics.circle(-3, bobOffset - 2, 4)
    this.graphics.fill({ color: shimmerColor, alpha: 0.6 })

    // Highlight
    this.graphics.circle(-2, bobOffset - 3, 3)
    this.graphics.fill({ color: 0xffffff, alpha: 0.9 })

    // Glow effect
    const glowAlpha = 0.2 + Math.sin(this.animationTime * 0.003) * 0.1
    this.graphics.circle(0, bobOffset, 15)
    this.graphics.fill({ color: 0xffffff, alpha: glowAlpha })
  }

  /**
   * Draw treasure chest
   */
  private drawChest(bobOffset: number): void {
    // Chest base
    this.graphics.roundRect(-12, bobOffset - 5, 24, 12, 2)
    this.graphics.fill(0xcd7f32) // Bronze
    this.graphics.stroke({ width: 2, color: 0x8b4513 })

    // Chest lid
    this.graphics.roundRect(-12, bobOffset - 12, 24, 8, 2)
    this.graphics.fill(0xdaa520) // Goldenrod
    this.graphics.stroke({ width: 2, color: 0xb8860b })

    // Lock
    this.graphics.circle(0, bobOffset - 2, 3)
    this.graphics.fill(0x2f4f4f) // Dark slate gray
    this.graphics.stroke({ width: 1, color: 0x000000 })

    // Gold coins spilling out (sparkle)
    for (let i = 0; i < 3; i++) {
      const sparkleOffset = Math.sin(this.animationTime * 0.004 + i) * 2
      this.graphics.circle(-6 + i * 6, bobOffset + 5 + sparkleOffset, 2)
      this.graphics.fill(0xffd700) // Gold
    }

    // Glow effect (rare item)
    const glowAlpha = 0.3 + Math.sin(this.animationTime * 0.003) * 0.2
    this.graphics.circle(0, bobOffset - 3, 20)
    this.graphics.fill({ color: 0xffd700, alpha: glowAlpha })
  }

  /**
   * Draw message bottle
   */
  private drawBottle(bobOffset: number): void {
    // Bottle body
    this.graphics.roundRect(-4, bobOffset - 8, 8, 16, 2)
    this.graphics.fill({ color: 0x228b22, alpha: 0.7 }) // Forest green (glass)
    this.graphics.stroke({ width: 1, color: 0x006400 })

    // Bottle neck
    this.graphics.roundRect(-2, bobOffset - 12, 4, 5, 1)
    this.graphics.fill({ color: 0x228b22, alpha: 0.7 })
    this.graphics.stroke({ width: 1, color: 0x006400 })

    // Cork
    this.graphics.circle(0, bobOffset - 12, 2)
    this.graphics.fill(0xd2691e) // Chocolate brown

    // Message inside (paper)
    this.graphics.rect(-3, bobOffset - 5, 6, 8)
    this.graphics.fill({ color: 0xfffacd, alpha: 0.8 }) // Lemon chiffon

    // Text on paper
    for (let i = 0; i < 4; i++) {
      this.graphics.moveTo(-2, bobOffset - 4 + i * 2)
      this.graphics.lineTo(2, bobOffset - 4 + i * 2)
      this.graphics.stroke({ width: 0.5, color: 0x000000, alpha: 0.4 })
    }

    // Shimmer on glass
    const shimmerAlpha = 0.3 + Math.sin(this.animationTime * 0.004) * 0.2
    this.graphics.rect(-1, bobOffset - 6, 2, 10)
    this.graphics.fill({ color: 0xffffff, alpha: shimmerAlpha })
  }

  /**
   * Draw shark tooth
   */
  private drawSharkTooth(bobOffset: number): void {
    // Tooth shape (triangle)
    this.graphics.moveTo(0, bobOffset - 12)
    this.graphics.lineTo(-6, bobOffset + 8)
    this.graphics.lineTo(6, bobOffset + 8)
    this.graphics.closePath()
    this.graphics.fill(0xf5f5dc) // Beige (bone color)
    this.graphics.stroke({ width: 2, color: 0xdcdcdc })

    // Tooth ridge/serration
    for (let i = 0; i < 3; i++) {
      this.graphics.moveTo(-4 + i * 4, bobOffset + i * 5)
      this.graphics.lineTo(-2 + i * 4, bobOffset + 2 + i * 5)
      this.graphics.stroke({ width: 1, color: 0xc0c0c0, alpha: 0.5 })
    }

    // Highlight on tooth
    this.graphics.moveTo(-2, bobOffset - 8)
    this.graphics.lineTo(-1, bobOffset - 4)
    this.graphics.lineTo(0, bobOffset - 8)
    this.graphics.closePath()
    this.graphics.fill({ color: 0xffffff, alpha: 0.7 })

    // Glow effect (dangerous item)
    const glowAlpha = 0.25 + Math.sin(this.animationTime * 0.003) * 0.15
    this.graphics.circle(0, bobOffset - 2, 18)
    this.graphics.fill({ color: 0xff4444, alpha: glowAlpha })
  }

  /**
   * Draw collection animation (treasure rising and fading)
   */
  private drawCollectionAnimation(): void {
    const progress = this.collectionAnimationProgress / this.COLLECTION_ANIMATION_DURATION
    const alpha = 1 - progress
    const scaleUp = 1 + progress * 0.5
    const riseUp = -progress * 30

    this.container.alpha = alpha
    this.container.scale.set(scaleUp)
    this.container.y = this.y + riseUp

    // Draw a simple sparkle effect
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const distance = progress * 30
      const sparkleX = Math.cos(angle) * distance
      const sparkleY = Math.sin(angle) * distance

      this.graphics.circle(sparkleX, sparkleY, 2)
      this.graphics.fill({ color: 0xffd700, alpha: alpha * 0.8 })
    }
  }

  /**
   * Helper: Convert HSL to RGB
   */
  private hslToRgb(h: number, s: number, l: number): number {
    h = h / 360
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    const hueToRgb = (t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const r = Math.round(hueToRgb(h + 1 / 3) * 255)
    const g = Math.round(hueToRgb(h) * 255)
    const b = Math.round(hueToRgb(h - 1 / 3) * 255)

    return (r << 16) | (g << 8) | b
  }

  /**
   * Update treasure animation
   */
  public update(delta: number): void {
    this.animationTime += delta

    // Update collection animation
    if (this.isCollected) {
      this.collectionAnimationProgress += delta * 16.67 // Convert to ms
    }

    this.draw()
  }

  /**
   * Trigger collection animation
   */
  public collect(): void {
    if (!this.isCollected) {
      this.isCollected = true
      this.collectionAnimationProgress = 0
    }
  }

  /**
   * Check if treasure is collected
   */
  public isCollectedState(): boolean {
    return this.isCollected
  }

  /**
   * Check if collection animation is complete
   */
  public isAnimationComplete(): boolean {
    return this.isCollected && this.collectionAnimationProgress >= this.COLLECTION_ANIMATION_DURATION
  }

  /**
   * Get treasure position
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  /**
   * Get treasure type
   */
  public getType(): TreasureType {
    return this.type
  }

  /**
   * Get point value
   */
  public getPoints(): number {
    return this.points
  }

  /**
   * Set depth-based opacity (fade at extreme depths)
   */
  public setDepthOpacity(depthFraction: number): void {
    // Fade slightly in very deep water (atmospheric effect)
    if (depthFraction > 0.9) {
      const fadeAmount = (depthFraction - 0.9) / 0.1
      this.container.alpha = 1 - fadeAmount * 0.3
    } else {
      this.container.alpha = 1
    }
  }

  /**
   * Destroy the treasure (remove from stage)
   */
  public destroy(): void {
    this.container.destroy()
  }
}

/**
 * Factory function to create a treasure item
 */
export function createTreasureItem(
  type: TreasureType,
  x: number,
  y: number,
  points: number
): TreasureItem {
  return new TreasureItem(type, x, y, points)
}

/**
 * Helper to get treasure color by type (for UI)
 */
export function getTreasureColor(type: TreasureType): number {
  switch (type) {
    case "pearl":
      return 0xf5f5f5 // White
    case "chest":
      return 0xffd700 // Gold
    case "bottle":
      return 0x228b22 // Green
    case "shark_tooth":
      return 0xf5f5dc // Beige
    default:
      return 0xffffff
  }
}

/**
 * Helper to get treasure display name
 */
export function getTreasureName(type: TreasureType): string {
  switch (type) {
    case "pearl":
      return "Pearl"
    case "chest":
      return "Treasure Chest"
    case "bottle":
      return "Message Bottle"
    case "shark_tooth":
      return "Shark Tooth"
    default:
      return "Unknown"
  }
}
