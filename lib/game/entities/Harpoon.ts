import { Container, Graphics } from "pixi.js"

export class Harpoon {
  public container: Container
  public x: number
  public y: number
  public vx: number
  public vy: number
  public damage: number

  private graphics: Graphics
  private rotation: number = 0
  private speed: number = 8
  private isActive: boolean = true
  private lifetime: number = 3000 // 3 seconds max flight time
  private age: number = 0

  // Trail effect
  private trailPoints: Array<{ x: number; y: number; alpha: number }> = []
  private maxTrailLength: number = 10

  constructor(startX: number, startY: number, targetX: number, targetY: number, damage: number) {
    this.x = startX
    this.y = startY
    this.damage = damage

    // Calculate direction to target
    const dx = targetX - startX
    const dy = targetY - startY
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Normalize and apply speed
    this.vx = (dx / dist) * this.speed
    this.vy = (dy / dist) * this.speed

    // Calculate rotation
    this.rotation = Math.atan2(dy, dx)

    // Create container
    this.container = new Container()
    this.container.x = startX
    this.container.y = startY
    this.container.rotation = this.rotation

    // Create graphics
    this.graphics = new Graphics()
    this.drawHarpoon()
    this.container.addChild(this.graphics)
  }

  private drawHarpoon(): void {
    this.graphics.clear()

    // Draw trail
    for (let i = 0; i < this.trailPoints.length; i++) {
      const point = this.trailPoints[i]
      if (point) {
        // Convert world coords to local coords
        const localX = (point.x - this.x) * Math.cos(-this.rotation) - (point.y - this.y) * Math.sin(-this.rotation)
        const localY = (point.x - this.x) * Math.sin(-this.rotation) + (point.y - this.y) * Math.cos(-this.rotation)

        this.graphics.circle(localX, localY, 2)
        this.graphics.fill({ color: 0x87ceeb, alpha: point.alpha * 0.5 })
      }
    }

    // Harpoon shaft (longer, thinner)
    this.graphics.rect(-25, -2, 40, 4)
    this.graphics.fill(0xd2691e) // Chocolate wood

    // Metal tip
    this.graphics.moveTo(15, 0)
    this.graphics.lineTo(25, -4)
    this.graphics.lineTo(30, 0)
    this.graphics.lineTo(25, 4)
    this.graphics.closePath()
    this.graphics.fill(0xc0c0c0) // Silver

    // Barb
    this.graphics.moveTo(22, -3)
    this.graphics.lineTo(26, -6)
    this.graphics.lineTo(24, -3)
    this.graphics.closePath()
    this.graphics.fill(0xa0a0a0)

    // Rope trailing behind
    this.graphics.moveTo(-25, 0)
    this.graphics.lineTo(-35, 2)
    this.graphics.lineTo(-45, -1)
    this.graphics.lineTo(-55, 3)
    this.graphics.stroke({ width: 2, color: 0xdaa520, alpha: 0.7 }) // Golden rope
  }

  public update(delta: number): void {
    if (!this.isActive) return

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

    // Redraw with trail
    this.drawHarpoon()

    // Update age
    this.age += delta * 16.67

    // Deactivate if too old
    if (this.age >= this.lifetime) {
      this.isActive = false
    }
  }

  public checkCollision(targetX: number, targetY: number, targetRadius: number = 40): boolean {
    if (!this.isActive) return false

    const dx = this.x - targetX
    const dy = this.y - targetY
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Harpoon tip is at the front
    const tipX = this.x + Math.cos(this.rotation) * 30
    const tipY = this.y + Math.sin(this.rotation) * 30
    const tipDist = Math.sqrt((tipX - targetX) ** 2 + (tipY - targetY) ** 2)

    return dist < targetRadius || tipDist < targetRadius
  }

  public hit(): void {
    this.isActive = false
  }

  public isAlive(): boolean {
    return this.isActive
  }

  public getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - 30,
      y: this.y - 5,
      width: 60,
      height: 10
    }
  }

  public destroy(): void {
    this.isActive = false
    this.container.destroy({ children: true })
  }
}
