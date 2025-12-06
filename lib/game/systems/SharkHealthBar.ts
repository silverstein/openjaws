import { Container, Graphics, Text } from "pixi.js"

export class SharkHealthBar {
  private container: Container
  private backgroundBar: Graphics
  private healthBar: Graphics
  private healthText: Text
  private maxHealth: number = 100
  private currentHealth: number = 100
  private targetHealth: number = 100
  private animationSpeed: number = 0.1

  constructor() {
    this.container = new Container()

    // Position at top center of screen
    this.container.x = window.innerWidth / 2
    this.container.y = 30

    // Create shark icon/label
    const label = new Text({
      text: "🦈 SHARK",
      style: {
        fontSize: 16,
        fill: 0xff4444,
        fontWeight: "bold",
        dropShadow: {
          distance: 1,
          color: 0x000000,
          alpha: 0.5
        }
      }
    })
    label.anchor.set(0.5, 1)
    label.y = -8
    this.container.addChild(label)

    // Background bar (dark)
    this.backgroundBar = new Graphics()
    this.backgroundBar.roundRect(-150, 0, 300, 25, 5)
    this.backgroundBar.fill({ color: 0x333333, alpha: 0.8 })
    this.backgroundBar.stroke({ width: 2, color: 0x666666 })
    this.container.addChild(this.backgroundBar)

    // Health bar (red gradient effect)
    this.healthBar = new Graphics()
    this.drawHealthBar()
    this.container.addChild(this.healthBar)

    // Health text
    this.healthText = new Text({
      text: "100 / 100",
      style: {
        fontSize: 14,
        fill: 0xffffff,
        fontWeight: "bold",
        dropShadow: {
          distance: 1,
          color: 0x000000,
          alpha: 0.8
        }
      }
    })
    this.healthText.anchor.set(0.5)
    this.healthText.y = 12
    this.container.addChild(this.healthText)
  }

  private drawHealthBar(): void {
    this.healthBar.clear()

    const healthPercent = this.currentHealth / this.maxHealth
    const barWidth = 296 * healthPercent

    if (barWidth > 0) {
      // Color changes based on health: green -> yellow -> red
      let color: number
      if (healthPercent > 0.6) {
        color = 0xff4444 // Red (shark is strong)
      } else if (healthPercent > 0.3) {
        color = 0xffaa00 // Orange (shark is weakening)
      } else {
        color = 0x44ff44 // Green (shark is almost defeated!)
      }

      this.healthBar.roundRect(-148, 2, barWidth, 21, 3)
      this.healthBar.fill(color)

      // Add shine effect
      this.healthBar.roundRect(-148, 2, barWidth, 8, 3)
      this.healthBar.fill({ color: 0xffffff, alpha: 0.2 })
    }
  }

  public getContainer(): Container {
    return this.container
  }

  public setHealth(health: number): void {
    this.targetHealth = Math.max(0, Math.min(this.maxHealth, health))
  }

  public setMaxHealth(maxHealth: number): void {
    this.maxHealth = maxHealth
  }

  public update(_delta: number): void {
    // Smooth animation toward target health
    if (Math.abs(this.currentHealth - this.targetHealth) > 0.5) {
      this.currentHealth += (this.targetHealth - this.currentHealth) * this.animationSpeed

      // Redraw the health bar
      this.drawHealthBar()

      // Update text
      this.healthText.text = `${Math.round(this.currentHealth)} / ${this.maxHealth}`

      // Shake effect when taking damage
      if (this.targetHealth < this.currentHealth - 5) {
        this.container.x = window.innerWidth / 2 + (Math.random() - 0.5) * 5
      } else {
        this.container.x = window.innerWidth / 2
      }
    } else {
      this.currentHealth = this.targetHealth
      this.container.x = window.innerWidth / 2
    }
  }

  public getCurrentHealth(): number {
    return this.currentHealth
  }

  public isDefeated(): boolean {
    return this.targetHealth <= 0
  }

  public onResize(): void {
    this.container.x = window.innerWidth / 2
  }
}
