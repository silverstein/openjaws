import { Container, Graphics, Text } from "pixi.js"

export class IceCreamStand {
  public container: Container
  public x: number
  public y: number

  private graphics: Graphics
  private signText: Text
  private promptText: Text
  private cooldownText: Text

  private interactionRadius: number = 70
  private healAmount: number = 50
  private cooldownDuration: number = 30000 // 30 seconds
  private playerCooldowns: Map<string, number> = new Map()

  private isPlayerNearby: boolean = false
  private canHealCurrentPlayer: boolean = false

  // Animation state
  private animationTime: number = 0
  private coneColors = [0xff69b4, 0x87ceeb, 0xffd700, 0x98fb98] // Pink, blue, gold, green

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create stand graphics
    this.graphics = new Graphics()
    this.drawStand()
    this.container.addChild(this.graphics)

    // Create sign
    this.signText = new Text({
      text: "ICE CREAM",
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
    this.signText.anchor.set(0.5)
    this.signText.y = -55
    this.container.addChild(this.signText)

    // Create interaction prompt
    this.promptText = new Text({
      text: "Press E to heal!",
      style: {
        fontSize: 12,
        fill: 0x44ff44,
        fontWeight: "bold",
        dropShadow: {
          distance: 1,
          color: 0x000000,
          alpha: 0.8
        }
      }
    })
    this.promptText.anchor.set(0.5)
    this.promptText.y = 50
    this.promptText.visible = false
    this.container.addChild(this.promptText)

    // Create cooldown text
    this.cooldownText = new Text({
      text: "",
      style: {
        fontSize: 11,
        fill: 0xff6666,
        fontWeight: "bold",
        dropShadow: {
          distance: 1,
          color: 0x000000,
          alpha: 0.8
        }
      }
    })
    this.cooldownText.anchor.set(0.5)
    this.cooldownText.y = 50
    this.cooldownText.visible = false
    this.container.addChild(this.cooldownText)
  }

  private drawStand(): void {
    this.graphics.clear()

    // Stand base (counter)
    this.graphics.roundRect(-40, 0, 80, 30, 5)
    this.graphics.fill(0xffffff)
    this.graphics.stroke({ width: 2, color: 0xff69b4 })

    // Stand back (display case)
    this.graphics.roundRect(-35, -30, 70, 30, 3)
    this.graphics.fill(0xffe4e1) // Misty rose
    this.graphics.stroke({ width: 2, color: 0xff69b4 })

    // Awning (striped)
    for (let i = 0; i < 7; i++) {
      const stripeX = -42 + i * 12
      const color = i % 2 === 0 ? 0xff69b4 : 0xffffff
      this.graphics.rect(stripeX, -50, 12, 20)
      this.graphics.fill(color)
    }
    // Awning border
    this.graphics.roundRect(-42, -50, 84, 20, 3)
    this.graphics.stroke({ width: 2, color: 0xff1493 })

    // Ice cream cones in display (animated colors)
    const conePositions = [-20, 0, 20]
    conePositions.forEach((coneX, i) => {
      // Cone
      this.graphics.moveTo(coneX - 6, -10)
      this.graphics.lineTo(coneX + 6, -10)
      this.graphics.lineTo(coneX, 5)
      this.graphics.closePath()
      this.graphics.fill(0xdaa520) // Golden cone

      // Ice cream scoop (color cycles with animation)
      const colorIndex = Math.floor((this.animationTime / 500 + i) % this.coneColors.length)
      const scoopColor = this.coneColors[colorIndex] ?? 0xff69b4
      this.graphics.circle(coneX, -16, 8)
      this.graphics.fill(scoopColor)
    })

    // Heart decorations
    this.drawHeart(-30, -40, 0xff69b4)
    this.drawHeart(30, -40, 0xff69b4)

    // Highlight when player nearby and can heal
    if (this.isPlayerNearby && this.canHealCurrentPlayer) {
      this.graphics.circle(0, 0, this.interactionRadius)
      this.graphics.stroke({ width: 2, color: 0x44ff44, alpha: 0.3 })
    }
  }

  private drawHeart(x: number, y: number, color: number): void {
    // Simple heart shape
    this.graphics.circle(x - 3, y, 4)
    this.graphics.circle(x + 3, y, 4)
    this.graphics.fill(color)
    this.graphics.moveTo(x - 6, y + 1)
    this.graphics.lineTo(x, y + 8)
    this.graphics.lineTo(x + 6, y + 1)
    this.graphics.closePath()
    this.graphics.fill(color)
  }

  public update(delta: number, playerX: number, playerY: number, playerId: string): boolean {
    // Update animation
    this.animationTime += delta * 16.67

    // Check if player is nearby
    const dist = Math.sqrt((playerX - this.x) ** 2 + (playerY - this.y) ** 2)
    const wasNearby = this.isPlayerNearby
    this.isPlayerNearby = dist < this.interactionRadius

    // Check cooldown for this player
    const cooldownEnd = this.playerCooldowns.get(playerId) || 0
    const now = Date.now()
    const remainingCooldown = Math.max(0, cooldownEnd - now)
    this.canHealCurrentPlayer = remainingCooldown === 0

    // Update prompts
    if (this.isPlayerNearby) {
      if (this.canHealCurrentPlayer) {
        this.promptText.text = "Press E to heal! (+50 HP)"
        this.promptText.style.fill = 0x44ff44
        this.promptText.visible = true
        this.cooldownText.visible = false
      } else {
        const seconds = Math.ceil(remainingCooldown / 1000)
        this.cooldownText.text = `Cooldown: ${seconds}s`
        this.cooldownText.visible = true
        this.promptText.visible = false
      }
    } else {
      this.promptText.visible = false
      this.cooldownText.visible = false
    }

    // Redraw periodically for animation and state changes
    if (wasNearby !== this.isPlayerNearby || Math.floor(this.animationTime / 500) !== Math.floor((this.animationTime - delta * 16.67) / 500)) {
      this.drawStand()
    }

    return this.isPlayerNearby
  }

  public canHeal(playerId: string): boolean {
    if (!this.isPlayerNearby) return false

    const cooldownEnd = this.playerCooldowns.get(playerId) || 0
    return Date.now() >= cooldownEnd
  }

  public heal(playerId: string): { healed: boolean; amount: number } {
    if (!this.canHeal(playerId)) {
      return { healed: false, amount: 0 }
    }

    // Set cooldown for this player
    this.playerCooldowns.set(playerId, Date.now() + this.cooldownDuration)

    return { healed: true, amount: this.healAmount }
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  public isNearPlayer(): boolean {
    return this.isPlayerNearby
  }

  public getRemainingCooldown(playerId: string): number {
    const cooldownEnd = this.playerCooldowns.get(playerId) || 0
    return Math.max(0, cooldownEnd - Date.now())
  }
}

// Factory function to create ice cream stand
export function createIceCreamStand(screenWidth: number, screenHeight: number): IceCreamStand {
  const beachY = screenHeight * 0.3

  // Position on opposite side from harpoon stations (which are at edges)
  // Put it in the middle-left area of the beach
  return new IceCreamStand(screenWidth * 0.3, beachY - 50)
}
