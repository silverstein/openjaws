import { Container, Graphics, Text } from "pixi.js"
import type { FishType } from "./Fish"
import { FISH_CATALOG } from "./Fish"
import { createFishVendor, FishVendor } from "./FishVendor"

export class FishMarket {
  public container: Container
  public x: number
  public y: number
  public vendor: FishVendor

  private graphics: Graphics
  private signText: Text
  private promptText: Text
  private priceText: Text

  private interactionRadius: number = 80
  private isPlayerNearby: boolean = false

  // Shop state
  private currentFishIndex: number = 0
  private fishTypes: FishType[] = ["sardine", "mackerel", "tuna", "chum"]

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create the fish vendor NPC behind the counter
    this.vendor = createFishVendor(0, -15) // Position slightly above center, behind counter
    this.container.addChild(this.vendor.container)

    // Create market stall graphics
    this.graphics = new Graphics()
    this.drawMarket()
    this.container.addChild(this.graphics)

    // Create sign text
    this.signText = new Text({
      text: "FISH MARKET",
      style: {
        fontSize: 16,
        fill: 0xffffff,
        fontWeight: "bold",
        dropShadow: {
          distance: 2,
          color: 0x000000,
          alpha: 0.8
        }
      }
    })
    this.signText.anchor.set(0.5)
    this.signText.y = -85
    this.container.addChild(this.signText)

    // Create price display
    this.priceText = new Text({
      text: this.getCurrentPriceText(),
      style: {
        fontSize: 12,
        fill: 0xffd700,
        fontWeight: "bold",
        align: "center",
        dropShadow: {
          distance: 1,
          color: 0x000000,
          alpha: 0.8
        }
      }
    })
    this.priceText.anchor.set(0.5)
    this.priceText.y = -25
    this.container.addChild(this.priceText)

    // Create interaction prompt
    this.promptText = new Text({
      text: "Press E to shop",
      style: {
        fontSize: 14,
        fill: 0x00ff00,
        fontWeight: "bold",
        dropShadow: {
          distance: 1,
          color: 0x000000,
          alpha: 0.8
        }
      }
    })
    this.promptText.anchor.set(0.5)
    this.promptText.y = 55
    this.promptText.visible = false
    this.container.addChild(this.promptText)
  }

  private drawMarket(): void {
    this.graphics.clear()

    // Draw market stall structure

    // Awning (colorful canopy)
    const awningColors = [0xff6b6b, 0xffffff] // Red and white stripes
    const stripeWidth = 15
    const awningWidth = 100
    const awningHeight = 20

    for (let i = 0; i < 7; i++) {
      const color = awningColors[i % 2] ?? 0xff6b6b
      this.graphics.rect(
        -awningWidth / 2 + i * stripeWidth,
        -70,
        stripeWidth,
        awningHeight
      )
      this.graphics.fill(color)
    }

    // Awning edge trim
    this.graphics.rect(-awningWidth / 2, -70, awningWidth, 2)
    this.graphics.fill(0x8b4513)
    this.graphics.rect(-awningWidth / 2, -50, awningWidth, 2)
    this.graphics.fill(0x8b4513)

    // Support poles
    this.graphics.rect(-45, -50, 6, 60)
    this.graphics.rect(39, -50, 6, 60)
    this.graphics.fill(0x8b4513) // Brown wood
    this.graphics.stroke({ width: 2, color: 0x654321 })

    // Counter (horizontal board)
    this.graphics.roundRect(-50, 0, 100, 15, 3)
    this.graphics.fill(0xa0522d) // Sienna
    this.graphics.stroke({ width: 2, color: 0x654321 })

    // Display case with fish
    this.graphics.roundRect(-45, -40, 90, 35, 5)
    this.graphics.fill({ color: 0x87ceeb, alpha: 0.3 }) // Light blue (ice)
    this.graphics.stroke({ width: 2, color: 0x4682b4 })

    // Draw fish on display
    this.drawFishDisplay()

    // Base/platform
    this.graphics.roundRect(-55, 10, 110, 8, 2)
    this.graphics.fill(0x8b4513)
    this.graphics.stroke({ width: 1, color: 0x654321 })

    // Highlight when player is nearby
    if (this.isPlayerNearby) {
      this.graphics.circle(0, 0, this.interactionRadius)
      this.graphics.stroke({ width: 3, color: 0x00ff00, alpha: 0.3 })
    }
  }

  private drawFishDisplay(): void {
    // Draw different fish types on the display
    const fishPositions = [
      { x: -30, y: -25 },
      { x: -10, y: -22 },
      { x: 10, y: -28 },
      { x: 30, y: -24 }
    ]

    fishPositions.forEach((pos, i) => {
      const fish = this.fishTypes[i]
      const isSelected = i === this.currentFishIndex

      // Draw fish body (simple oval)
      this.graphics.ellipse(pos.x, pos.y, 8, 4)

      // Color based on fish type
      let fishColor = 0xc0c0c0 // Default silver
      if (fish === "sardine") fishColor = 0xc0c0c0 // Silver
      if (fish === "mackerel") fishColor = 0x4169e1 // Blue
      if (fish === "tuna") fishColor = 0xff6347 // Red/orange
      if (fish === "chum") fishColor = 0x8b4513 // Brown

      this.graphics.fill({ color: fishColor, alpha: isSelected ? 1.0 : 0.6 })

      // Add shimmer to selected fish
      if (isSelected) {
        this.graphics.circle(pos.x - 2, pos.y - 1, 2)
        this.graphics.fill({ color: 0xffffff, alpha: 0.8 })

        // Selection indicator (glow)
        this.graphics.circle(pos.x, pos.y, 12)
        this.graphics.stroke({ width: 2, color: 0xffd700, alpha: 0.6 })
      }

      // Fish tail
      this.graphics.moveTo(pos.x + 8, pos.y)
      this.graphics.lineTo(pos.x + 12, pos.y - 3)
      this.graphics.lineTo(pos.x + 12, pos.y + 3)
      this.graphics.closePath()
      this.graphics.fill({ color: fishColor, alpha: isSelected ? 1.0 : 0.6 })
    })
  }

  private getCurrentPriceText(): string {
    const currentFish = FISH_CATALOG[this.fishTypes[this.currentFishIndex] ?? "sardine"]
    if (!currentFish) return ""

    return `${currentFish.name}\n${currentFish.price} points\n${currentFish.description}`
  }

  public update(delta: number, playerX: number, playerY: number): boolean {
    // Update vendor NPC (with world coordinates)
    const worldPlayerX = playerX - this.x
    const worldPlayerY = playerY - this.y
    this.vendor.update(delta, worldPlayerX, worldPlayerY)

    // Check if player is nearby
    const dist = Math.sqrt((playerX - this.x) ** 2 + (playerY - this.y) ** 2)
    const wasNearby = this.isPlayerNearby
    this.isPlayerNearby = dist < this.interactionRadius

    // Update prompt visibility
    this.promptText.visible = this.isPlayerNearby

    // Redraw if player proximity changed
    if (wasNearby !== this.isPlayerNearby) {
      this.drawMarket()
    }

    return this.isPlayerNearby
  }

  public canShop(): boolean {
    return this.isPlayerNearby
  }

  public openShop(): boolean {
    return this.canShop()
  }

  // Cycle through available fish
  public selectNextFish(): void {
    this.currentFishIndex = (this.currentFishIndex + 1) % this.fishTypes.length
    this.priceText.text = this.getCurrentPriceText()
    this.drawMarket()
  }

  public selectPreviousFish(): void {
    this.currentFishIndex = (this.currentFishIndex - 1 + this.fishTypes.length) % this.fishTypes.length
    this.priceText.text = this.getCurrentPriceText()
    this.drawMarket()
  }

  // Purchase current fish (returns fish type if successful, null if failed)
  public purchaseFish(playerPoints: number): FishType | null {
    if (!this.canShop()) {
      return null
    }

    const currentFish = FISH_CATALOG[this.fishTypes[this.currentFishIndex] ?? "sardine"]
    if (!currentFish) {
      return null
    }

    if (playerPoints >= currentFish.price) {
      return currentFish.type
    }

    return null // Not enough points
  }

  public getCurrentFish(): FishType {
    return this.fishTypes[this.currentFishIndex] ?? "sardine"
  }

  public getCurrentPrice(): number {
    const fish = FISH_CATALOG[this.getCurrentFish()]
    return fish?.price ?? 0
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  public isNearPlayer(): boolean {
    return this.isPlayerNearby
  }
}

// Factory function to create a fish market on the beach
export function createFishMarket(screenWidth: number, screenHeight: number): FishMarket {
  const beachY = screenHeight * 0.2 // Upper beach area

  // Place market on right side of beach
  return new FishMarket(screenWidth - 150, beachY)
}
