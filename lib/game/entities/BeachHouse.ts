import { Container, Graphics, Text, TextStyle } from "pixi.js"
import type { FishType } from "./Fish"

/**
 * Beach House entity - A safe cottage where players can rest and recover
 *
 * Features:
 * - Safe zone: Players inside are hidden from shark AI
 * - Bed: Sleep to recover 100% HP and stamina (60s cooldown)
 * - Drawer: Store up to 6 fish items for later use
 * - Door interaction: Enter/exit with visual prompts
 */
export class BeachHouse {
  public container: Container
  public x: number
  public y: number

  // Building components
  private exteriorGraphics: Graphics
  private interiorGraphics: Graphics
  private doorGraphics: Graphics
  private furnitureGraphics: Graphics

  // UI text elements
  private doorPromptText: Text
  private interiorPromptText: Text
  private sleepFeedbackText: Text
  private cooldownText: Text

  // State tracking
  private playersInside: Set<string> = new Set()
  private sleepingPlayers: Map<string, { progress: number; startTime: number }> = new Map()
  private sleepCooldowns: Map<string, number> = new Map() // playerId -> cooldown end time
  private drawerStorage: FishType[] = [] // Stored items (max 6)

  // Configuration
  private readonly INTERACTION_RADIUS = 80
  private readonly DOOR_X = 20 // Door offset from center
  private readonly DOOR_Y = 30 // Door vertical position
  private readonly SLEEP_DURATION = 3000 // 3 seconds
  private readonly SLEEP_COOLDOWN = 60000 // 60 seconds
  private readonly DRAWER_CAPACITY = 6

  private isPlayerNearDoor: boolean = false
  private animationTime: number = 0

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create graphics layers
    this.exteriorGraphics = new Graphics()
    this.interiorGraphics = new Graphics()
    this.doorGraphics = new Graphics()
    this.furnitureGraphics = new Graphics()

    // Add graphics to container (order matters for layering)
    this.container.addChild(this.exteriorGraphics)
    this.container.addChild(this.doorGraphics)
    this.container.addChild(this.furnitureGraphics)
    this.container.addChild(this.interiorGraphics)

    // Create UI text elements
    this.doorPromptText = new Text({
      text: "Press E to enter",
      style: new TextStyle({
        fontSize: 12,
        fill: 0xffffff,
        fontWeight: "bold",
        stroke: { color: 0x000000, width: 2 },
      }),
    })
    this.doorPromptText.anchor.set(0.5)
    this.doorPromptText.y = 60
    this.doorPromptText.visible = false
    this.container.addChild(this.doorPromptText)

    this.interiorPromptText = new Text({
      text: "",
      style: new TextStyle({
        fontSize: 11,
        fill: 0x44ff44,
        fontWeight: "bold",
        stroke: { color: 0x000000, width: 2 },
      }),
    })
    this.interiorPromptText.anchor.set(0.5)
    this.interiorPromptText.y = -60
    this.interiorPromptText.visible = false
    this.container.addChild(this.interiorPromptText)

    this.sleepFeedbackText = new Text({
      text: "",
      style: new TextStyle({
        fontSize: 14,
        fill: 0x44ff44,
        fontWeight: "bold",
        stroke: { color: 0x000000, width: 2 },
      }),
    })
    this.sleepFeedbackText.anchor.set(0.5)
    this.sleepFeedbackText.y = -80
    this.sleepFeedbackText.visible = false
    this.container.addChild(this.sleepFeedbackText)

    this.cooldownText = new Text({
      text: "",
      style: new TextStyle({
        fontSize: 10,
        fill: 0xff6666,
        fontWeight: "bold",
        stroke: { color: 0x000000, width: 2 },
      }),
    })
    this.cooldownText.anchor.set(0.5)
    this.cooldownText.y = -50
    this.cooldownText.visible = false
    this.container.addChild(this.cooldownText)

    // Initial draw
    this.drawExterior()
    this.drawDoor()
  }

  /**
   * Draw the exterior of the beach house
   */
  private drawExterior(): void {
    this.exteriorGraphics.clear()

    // Foundation/base
    this.exteriorGraphics.rect(-50, 10, 100, 50)
    this.exteriorGraphics.fill(0xe6d7c3) // Sandy beige
    this.exteriorGraphics.stroke({ width: 2, color: 0x8b7355 })

    // Main wall
    this.exteriorGraphics.rect(-50, -30, 100, 40)
    this.exteriorGraphics.fill(0xffd8a8) // Peach/coral color
    this.exteriorGraphics.stroke({ width: 2, color: 0xff8c42 })

    // Roof
    this.exteriorGraphics.moveTo(-60, -30)
    this.exteriorGraphics.lineTo(0, -60)
    this.exteriorGraphics.lineTo(60, -30)
    this.exteriorGraphics.closePath()
    this.exteriorGraphics.fill(0xff6b6b) // Red roof
    this.exteriorGraphics.stroke({ width: 2, color: 0xcc0000 })

    // Roof details (shingles)
    for (let i = 0; i < 3; i++) {
      const y = -55 + i * 10
      this.exteriorGraphics.moveTo(-55 + i * 15, y)
      this.exteriorGraphics.lineTo(55 - i * 15, y)
      this.exteriorGraphics.stroke({ width: 1, color: 0xcc0000, alpha: 0.5 })
    }

    // Window (left)
    this.exteriorGraphics.rect(-35, -20, 15, 15)
    this.exteriorGraphics.fill(0x87ceeb) // Sky blue
    this.exteriorGraphics.stroke({ width: 2, color: 0x4169e1 })

    // Window cross
    this.exteriorGraphics.moveTo(-27.5, -20)
    this.exteriorGraphics.lineTo(-27.5, -5)
    this.exteriorGraphics.moveTo(-35, -12.5)
    this.exteriorGraphics.lineTo(-20, -12.5)
    this.exteriorGraphics.stroke({ width: 1, color: 0xffffff })

    // Window (right)
    this.exteriorGraphics.rect(20, -20, 15, 15)
    this.exteriorGraphics.fill(0x87ceeb)
    this.exteriorGraphics.stroke({ width: 2, color: 0x4169e1 })

    // Window cross
    this.exteriorGraphics.moveTo(27.5, -20)
    this.exteriorGraphics.lineTo(27.5, -5)
    this.exteriorGraphics.moveTo(20, -12.5)
    this.exteriorGraphics.lineTo(35, -12.5)
    this.exteriorGraphics.stroke({ width: 1, color: 0xffffff })

    // Chimney
    this.exteriorGraphics.rect(30, -70, 12, 15)
    this.exteriorGraphics.fill(0x8b4513) // Brown brick
    this.exteriorGraphics.stroke({ width: 1, color: 0x654321 })

    // Chimney smoke (animated)
    const smokeY = -75 - (this.animationTime % 20)
    for (let i = 0; i < 3; i++) {
      this.exteriorGraphics.circle(36 + Math.sin(this.animationTime * 0.05 + i) * 3, smokeY - i * 8, 3 + i)
      this.exteriorGraphics.fill({ color: 0xcccccc, alpha: 0.6 - i * 0.2 })
    }

    // Interaction radius highlight when player nearby
    if (this.isPlayerNearDoor) {
      this.exteriorGraphics.circle(this.DOOR_X, this.DOOR_Y, this.INTERACTION_RADIUS)
      this.exteriorGraphics.stroke({ width: 2, color: 0x44ff44, alpha: 0.3 })
    }
  }

  /**
   * Draw the door
   */
  private drawDoor(): void {
    this.doorGraphics.clear()

    // Door frame
    this.doorGraphics.roundRect(this.DOOR_X - 12, 10, 24, 35, 3)
    this.doorGraphics.fill(0x8b4513) // Brown door
    this.doorGraphics.stroke({ width: 2, color: 0x654321 })

    // Door panels
    this.doorGraphics.roundRect(this.DOOR_X - 9, 15, 9, 10, 2)
    this.doorGraphics.roundRect(this.DOOR_X + 1, 15, 9, 10, 2)
    this.doorGraphics.roundRect(this.DOOR_X - 9, 30, 9, 10, 2)
    this.doorGraphics.roundRect(this.DOOR_X + 1, 30, 9, 10, 2)
    this.doorGraphics.stroke({ width: 1, color: 0x654321 })

    // Door knob
    this.doorGraphics.circle(this.DOOR_X + 8, 32, 2)
    this.doorGraphics.fill(0xffd700) // Gold knob
  }

  /**
   * Draw furniture (visible when player is inside)
   */
  private drawFurniture(): void {
    this.furnitureGraphics.clear()

    if (this.playersInside.size === 0) {
      return
    }

    // Semi-transparent overlay to indicate interior view
    this.furnitureGraphics.rect(-80, -80, 160, 160)
    this.furnitureGraphics.fill({ color: 0x000000, alpha: 0.3 })

    // Bed (left side)
    this.furnitureGraphics.roundRect(-35, 0, 30, 40, 3)
    this.furnitureGraphics.fill(0xffb6c1) // Pink bed
    this.furnitureGraphics.stroke({ width: 2, color: 0xff69b4 })

    // Pillow
    this.furnitureGraphics.roundRect(-30, 2, 20, 10, 2)
    this.furnitureGraphics.fill(0xffffff)

    // Bed icon/label
    const bedLabel = new Text({
      text: "Bed",
      style: new TextStyle({
        fontSize: 10,
        fill: 0xffffff,
        fontWeight: "bold",
      }),
    })
    bedLabel.anchor.set(0.5)
    bedLabel.position.set(-20, 20)
    this.furnitureGraphics.addChild(bedLabel)

    // Drawer/Chest (right side)
    this.furnitureGraphics.roundRect(10, 10, 30, 25, 3)
    this.furnitureGraphics.fill(0x8b4513) // Brown wood
    this.furnitureGraphics.stroke({ width: 2, color: 0x654321 })

    // Drawer handles
    this.furnitureGraphics.circle(18, 17, 2)
    this.furnitureGraphics.circle(32, 17, 2)
    this.furnitureGraphics.circle(18, 28, 2)
    this.furnitureGraphics.circle(32, 28, 2)
    this.furnitureGraphics.fill(0xffd700)

    // Storage indicator
    const storageLabel = new Text({
      text: `Drawer ${this.drawerStorage.length}/${this.DRAWER_CAPACITY}`,
      style: new TextStyle({
        fontSize: 9,
        fill: 0xffffff,
        fontWeight: "bold",
      }),
    })
    storageLabel.anchor.set(0.5)
    storageLabel.position.set(25, 42)
    this.furnitureGraphics.addChild(storageLabel)
  }

  /**
   * Update the beach house state
   */
  public update(delta: number, playerX: number, playerY: number, playerId: string): void {
    // Update animation time
    this.animationTime += delta

    // Check if player is near the door
    const doorWorldX = this.x + this.DOOR_X
    const doorWorldY = this.y + this.DOOR_Y
    const distToDoor = Math.sqrt((playerX - doorWorldX) ** 2 + (playerY - doorWorldY) ** 2)
    this.isPlayerNearDoor = distToDoor < this.INTERACTION_RADIUS

    // Update door prompt
    const isInside = this.playersInside.has(playerId)
    if (this.isPlayerNearDoor && !isInside) {
      this.doorPromptText.text = "Press E to enter"
      this.doorPromptText.visible = true
    } else if (isInside) {
      this.doorPromptText.text = "Press E to exit"
      this.doorPromptText.visible = true
    } else {
      this.doorPromptText.visible = false
    }

    // Update interior UI
    if (isInside) {
      // Check sleep cooldown
      const cooldownEnd = this.sleepCooldowns.get(playerId) || 0
      const now = Date.now()
      const remainingCooldown = Math.max(0, cooldownEnd - now)
      const canSleep = remainingCooldown === 0 && !this.sleepingPlayers.has(playerId)

      if (canSleep) {
        this.interiorPromptText.text = "Press B to sleep (Full recovery)"
        this.interiorPromptText.style.fill = 0x44ff44
        this.interiorPromptText.visible = true
        this.cooldownText.visible = false
      } else if (this.sleepingPlayers.has(playerId)) {
        this.interiorPromptText.visible = false
        this.cooldownText.visible = false
      } else {
        const seconds = Math.ceil(remainingCooldown / 1000)
        this.cooldownText.text = `Sleep cooldown: ${seconds}s`
        this.cooldownText.visible = true
        this.interiorPromptText.visible = false
      }
    } else {
      this.interiorPromptText.visible = false
      this.cooldownText.visible = false
    }

    // Update sleeping players progress
    this.sleepingPlayers.forEach((sleepData) => {
      sleepData.progress += delta * 16.67 // Convert to ms
    })

    // Update sleeping animation for current player
    if (this.sleepingPlayers.has(playerId)) {
      const progress = this.sleepingPlayers.get(playerId)!.progress / this.SLEEP_DURATION
      const zCount = Math.floor(progress * 3) + 1
      this.interiorPromptText.text = "Z".repeat(zCount) + "z".repeat(3 - zCount)
      this.interiorPromptText.visible = true
    }

    // Redraw graphics
    this.drawExterior()
    this.drawFurniture()
  }

  /**
   * Check if player can enter the house
   */
  public canEnter(playerId: string): boolean {
    return this.isPlayerNearDoor && !this.playersInside.has(playerId)
  }

  /**
   * Mark player as inside the house
   */
  public enter(playerId: string): void {
    if (this.canEnter(playerId)) {
      this.playersInside.add(playerId)
      this.drawFurniture()
    }
  }

  /**
   * Mark player as outside the house
   */
  public exit(playerId: string): void {
    if (this.playersInside.has(playerId)) {
      this.playersInside.delete(playerId)
      this.sleepingPlayers.delete(playerId)
      this.drawFurniture()
    }
  }

  /**
   * Check if player is inside the house
   */
  public isPlayerInside(playerId: string): boolean {
    return this.playersInside.has(playerId)
  }

  /**
   * Check if player is currently sleeping
   */
  public isSleeping(playerId: string): boolean {
    return this.sleepingPlayers.has(playerId)
  }

  /**
   * Start sleep sequence for player
   * Returns a promise that resolves when sleep is complete
   */
  public useBed(playerId: string): Promise<{ success: boolean; hp: number; stamina: number }> {
    return new Promise((resolve) => {
      // Check if player is inside
      if (!this.playersInside.has(playerId)) {
        resolve({ success: false, hp: 0, stamina: 0 })
        return
      }

      // Check cooldown
      const cooldownEnd = this.sleepCooldowns.get(playerId) || 0
      const now = Date.now()
      if (now < cooldownEnd) {
        resolve({ success: false, hp: 0, stamina: 0 })
        return
      }

      // Check if already sleeping
      if (this.sleepingPlayers.has(playerId)) {
        resolve({ success: false, hp: 0, stamina: 0 })
        return
      }

      // Start sleep
      this.sleepingPlayers.set(playerId, { progress: 0, startTime: now })
      this.sleepCooldowns.set(playerId, now + this.SLEEP_COOLDOWN)

      // Wait for sleep duration, then complete sleep
      setTimeout(() => {
        this.sleepingPlayers.delete(playerId)

        // Show recovery feedback
        this.sleepFeedbackText.text = "+100% HP +100% Stamina"
        this.sleepFeedbackText.visible = true
        setTimeout(() => {
          this.sleepFeedbackText.visible = false
        }, 2000)

        resolve({ success: true, hp: 100, stamina: 100 })
      }, this.SLEEP_DURATION)
    })
  }

  /**
   * Add item to drawer storage
   */
  public storeItem(item: FishType): boolean {
    if (this.drawerStorage.length >= this.DRAWER_CAPACITY) {
      return false
    }
    this.drawerStorage.push(item)
    this.drawFurniture()
    return true
  }

  /**
   * Remove item from drawer storage
   */
  public retrieveItem(index: number): FishType | null {
    if (index < 0 || index >= this.drawerStorage.length) {
      return null
    }
    const item = this.drawerStorage.splice(index, 1)[0]
    this.drawFurniture()
    return item || null
  }

  /**
   * Get all stored items
   */
  public getStoredItems(): FishType[] {
    return [...this.drawerStorage]
  }

  /**
   * Check if drawer has space
   */
  public hasDrawerSpace(): boolean {
    return this.drawerStorage.length < this.DRAWER_CAPACITY
  }

  /**
   * Get remaining sleep cooldown for player (in ms)
   */
  public getRemainingCooldown(playerId: string): number {
    const cooldownEnd = this.sleepCooldowns.get(playerId) || 0
    return Math.max(0, cooldownEnd - Date.now())
  }

  /**
   * Get sleep progress for player (0-1)
   */
  public getSleepProgress(playerId: string): number {
    const sleepData = this.sleepingPlayers.get(playerId)
    if (!sleepData) return 0
    return Math.min(1, sleepData.progress / this.SLEEP_DURATION)
  }

  /**
   * Get position of the house
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  /**
   * Get door position in world coordinates
   */
  public getDoorPosition(): { x: number; y: number } {
    return {
      x: this.x + this.DOOR_X,
      y: this.y + this.DOOR_Y,
    }
  }

  /**
   * Check if player is near door
   */
  public isNearDoor(): boolean {
    return this.isPlayerNearDoor
  }

  /**
   * Get all players currently inside
   */
  public getPlayersInside(): string[] {
    return Array.from(this.playersInside)
  }
}

/**
 * Factory function to create a beach house positioned in the upper-left beach area
 */
export function createBeachHouse(_screenWidth: number, screenHeight: number): BeachHouse {
  // Position in upper-left area of beach, away from dock/market
  const beachY = screenHeight * 0.15
  const x = 120
  const y = beachY

  return new BeachHouse(x, y)
}
