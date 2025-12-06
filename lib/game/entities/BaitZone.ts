import { Container, Graphics } from "pixi.js"
import type { Fish } from "./Fish"

export class BaitZone {
  public container: Container
  private graphics: Graphics
  private rippleGraphics: Graphics

  public x: number
  public y: number
  public attractionRadius: number = 300 // How far the bait can attract sharks
  public duration: number // How long the bait lasts (in ms)
  public baitPower: number // Strength of attraction (1-4)

  private remainingTime: number
  private createdAt: number
  private animationOffset: number

  constructor(x: number, y: number, fish: Fish) {
    this.x = x
    this.y = y
    this.duration = fish.duration
    this.baitPower = fish.baitPower
    this.remainingTime = fish.duration
    this.createdAt = Date.now()
    this.animationOffset = Math.random() * Math.PI * 2 // Random animation start

    // Create container
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create graphics for ripple effects
    this.rippleGraphics = new Graphics()
    this.container.addChild(this.rippleGraphics)

    // Create graphics for bait visual
    this.graphics = new Graphics()
    this.container.addChild(this.graphics)

    this.drawBait()
    this.drawRipples()
  }

  private drawBait(): void {
    this.graphics.clear()

    // Draw fish pieces in water (small chunks floating)
    const pieceCount = this.baitPower * 2 + 2 // More powerful bait = more pieces
    const spread = 20 + this.baitPower * 10

    for (let i = 0; i < pieceCount; i++) {
      const angle = (i / pieceCount) * Math.PI * 2
      const dist = Math.random() * spread
      const x = Math.cos(angle) * dist
      const y = Math.sin(angle) * dist
      const size = 3 + Math.random() * 4

      // Draw fish chunk
      this.graphics.circle(x, y, size)
      this.graphics.fill({ color: 0xffa500, alpha: 0.8 }) // Orange fish color

      // Add shimmer effect
      this.graphics.circle(x - 1, y - 1, size * 0.5)
      this.graphics.fill({ color: 0xffffff, alpha: 0.4 })
    }

    // Draw central splash/disturbance
    this.graphics.circle(0, 0, 8)
    this.graphics.fill({ color: 0xffffff, alpha: 0.3 })
  }

  private drawRipples(): void {
    this.rippleGraphics.clear()

    const time = Date.now() - this.createdAt
    const fadeProgress = 1 - this.remainingTime / this.duration

    // Draw multiple expanding ripples
    const rippleCount = 3 + this.baitPower // More powerful bait = more ripples
    for (let i = 0; i < rippleCount; i++) {
      const rippleDelay = i * 400 // Stagger ripples
      const rippleTime = time + this.animationOffset * 1000 - rippleDelay

      if (rippleTime > 0) {
        const radius = (rippleTime * 0.15) % 60 // Expanding circle
        const alpha = Math.max(0, 0.5 - (radius / 60) * 0.5) * (1 - fadeProgress)

        if (alpha > 0) {
          this.rippleGraphics.circle(0, 0, radius)
          this.rippleGraphics.stroke({
            width: 2 + this.baitPower * 0.5,
            color: 0x4ecdc4,
            alpha: alpha
          })
        }
      }
    }

    // Add bubbles for powerful bait
    if (this.baitPower >= 3) {
      const bubbleCount = 5
      for (let i = 0; i < bubbleCount; i++) {
        const bubbleTime = ((time + i * 300) % 2000) / 2000
        const bubbleY = -bubbleTime * 50 // Rise up
        const bubbleX = Math.sin((time + i * 1000) * 0.003) * 15
        const bubbleSize = 3 + Math.sin(bubbleTime * Math.PI) * 2

        this.rippleGraphics.circle(bubbleX, bubbleY, bubbleSize)
        this.rippleGraphics.fill({ color: 0xffffff, alpha: 0.6 * (1 - bubbleTime) })
      }
    }
  }

  public update(delta: number): void {
    // Decrease remaining time
    this.remainingTime -= delta * 16.67 // Convert to ms (assuming 60fps)

    // Update ripple animation
    this.drawRipples()

    // Fade out as time runs out
    const fadeProgress = 1 - this.remainingTime / this.duration
    if (fadeProgress > 0.7) {
      this.container.alpha = 1 - (fadeProgress - 0.7) / 0.3
    }
  }

  public isActive(): boolean {
    return this.remainingTime > 0
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  // Calculate attraction strength based on distance and bait power
  public getAttractionStrength(sharkX: number, sharkY: number): number {
    const dx = sharkX - this.x
    const dy = sharkY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > this.attractionRadius) {
      return 0 // Outside attraction radius
    }

    // Attraction strength: inversely proportional to distance, multiplied by bait power
    const distanceFactor = 1 - distance / this.attractionRadius
    return this.baitPower * distanceFactor
  }

  // Get normalized direction vector from shark position to bait
  public getAttractionVector(sharkX: number, sharkY: number): { x: number; y: number } {
    const dx = this.x - sharkX
    const dy = this.y - sharkY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance === 0) {
      return { x: 0, y: 0 }
    }

    return {
      x: dx / distance,
      y: dy / distance
    }
  }

  // Get remaining time as percentage (0-1)
  public getTimeRemainingPercent(): number {
    return Math.max(0, this.remainingTime / this.duration)
  }
}
