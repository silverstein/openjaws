import { Container, Graphics, Text, TextStyle } from "pixi.js"

/**
 * SecretRoom Entity - Hidden room that unlocks after proving yourself as a shark hunter
 *
 * Features:
 * - Unlocks for individual players after 5 shark hits (harpoon hits)
 * - Contains Orange crate (Vitamin C power-up for speed boost)
 * - Orange respawns every 60 seconds after being taken
 * - Visual feedback: Door glows when unlocked for player
 *
 * Location: Hidden near/behind Fish Market
 */
export class SecretRoom {
  public container: Container
  public x: number
  public y: number

  // Graphics components
  private roomGraphics: Graphics
  private doorGraphics: Graphics
  private crateGraphics: Graphics

  // UI text elements
  private signText: Text
  private promptText: Text
  private statusText: Text

  // State tracking
  private playerHits: Map<string, number> = new Map() // playerId -> hit count
  private unlockedPlayers: Set<string> = new Set() // players who unlocked room
  private orangeAvailable: boolean = true // is orange available to take
  private orangeRespawnTimer: number = 0 // time until next orange spawn (ms)
  private playersNearby: Set<string> = new Set() // players near the room

  // Configuration
  private readonly INTERACTION_RADIUS = 80
  private readonly HITS_REQUIRED = 5
  private readonly ORANGE_RESPAWN_TIME = 60000 // 60 seconds
  private readonly DOOR_LOCKED_COLOR = 0x8b4513 // Brown
  private readonly DOOR_UNLOCKED_COLOR = 0xffd700 // Gold

  private animationTime: number = 0

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create graphics layers
    this.roomGraphics = new Graphics()
    this.doorGraphics = new Graphics()
    this.crateGraphics = new Graphics()

    this.container.addChild(this.roomGraphics)
    this.container.addChild(this.doorGraphics)
    this.container.addChild(this.crateGraphics)

    // Create sign text
    this.signText = new Text({
      text: "SHARK HUNTERS ONLY",
      style: new TextStyle({
        fontSize: 14,
        fill: 0xff0000,
        fontWeight: "bold",
        stroke: { color: 0x000000, width: 2 },
      }),
    })
    this.signText.anchor.set(0.5)
    this.signText.y = -85
    this.container.addChild(this.signText)

    // Create prompt text
    this.promptText = new Text({
      text: "",
      style: new TextStyle({
        fontSize: 12,
        fill: 0xffd700,
        fontWeight: "bold",
        stroke: { color: 0x000000, width: 2 },
      }),
    })
    this.promptText.anchor.set(0.5)
    this.promptText.y = 70
    this.promptText.visible = false
    this.container.addChild(this.promptText)

    // Create status text (shows hit progress)
    this.statusText = new Text({
      text: "",
      style: new TextStyle({
        fontSize: 11,
        fill: 0xffffff,
        fontWeight: "bold",
        stroke: { color: 0x000000, width: 2 },
      }),
    })
    this.statusText.anchor.set(0.5)
    this.statusText.y = -65
    this.statusText.visible = false
    this.container.addChild(this.statusText)

    // Initial draw
    this.drawRoom()
    this.drawDoor(false)
    this.drawOrangeCrate()
  }

  /**
   * Draw the secret room structure
   */
  private drawRoom(): void {
    this.roomGraphics.clear()

    // Foundation
    this.roomGraphics.rect(-60, -10, 120, 70)
    this.roomGraphics.fill(0x696969) // Dark gray stone
    this.roomGraphics.stroke({ width: 2, color: 0x404040 })

    // Stone wall texture
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        this.roomGraphics.rect(-55 + i * 25, -5 + j * 20, 23, 18)
        this.roomGraphics.stroke({ width: 1, color: 0x505050, alpha: 0.5 })
      }
    }

    // Roof
    this.roomGraphics.moveTo(-70, -10)
    this.roomGraphics.lineTo(0, -50)
    this.roomGraphics.lineTo(70, -10)
    this.roomGraphics.closePath()
    this.roomGraphics.fill(0x2f4f4f) // Dark slate gray
    this.roomGraphics.stroke({ width: 2, color: 0x1c1c1c })

    // Skull decoration on wall (danger indicator)
    this.drawSkull(-40, -30)
    this.drawSkull(40, -30)

    // Interaction radius highlight when player nearby
    if (this.playersNearby.size > 0) {
      this.roomGraphics.circle(0, 30, this.INTERACTION_RADIUS)
      this.roomGraphics.stroke({ width: 2, color: 0xffd700, alpha: 0.3 })
    }
  }

  /**
   * Draw skull decoration
   */
  private drawSkull(x: number, y: number): void {
    // Skull
    this.roomGraphics.circle(x, y, 8)
    this.roomGraphics.fill(0xf5f5dc) // Beige bone color
    this.roomGraphics.stroke({ width: 1, color: 0x808080 })

    // Eye sockets
    this.roomGraphics.circle(x - 3, y - 2, 2)
    this.roomGraphics.circle(x + 3, y - 2, 2)
    this.roomGraphics.fill(0x000000)

    // Nose cavity
    this.roomGraphics.moveTo(x, y + 1)
    this.roomGraphics.lineTo(x - 2, y + 3)
    this.roomGraphics.lineTo(x + 2, y + 3)
    this.roomGraphics.closePath()
    this.roomGraphics.fill(0x000000)
  }

  /**
   * Draw the door (locked or unlocked)
   */
  private drawDoor(unlocked: boolean): void {
    this.doorGraphics.clear()

    const doorColor = unlocked ? this.DOOR_UNLOCKED_COLOR : this.DOOR_LOCKED_COLOR

    // Door frame
    this.doorGraphics.roundRect(-18, 10, 36, 45, 4)
    this.doorGraphics.fill(doorColor)
    this.doorGraphics.stroke({ width: 3, color: unlocked ? 0xffaa00 : 0x654321 })

    // Door panels
    this.doorGraphics.roundRect(-14, 15, 12, 15, 2)
    this.doorGraphics.roundRect(2, 15, 12, 15, 2)
    this.doorGraphics.roundRect(-14, 35, 12, 15, 2)
    this.doorGraphics.roundRect(2, 35, 12, 15, 2)
    this.doorGraphics.stroke({ width: 1, color: unlocked ? 0xcc8800 : 0x4a3318 })

    // Lock/Handle
    if (!unlocked) {
      // Padlock
      this.doorGraphics.roundRect(-4, 25, 8, 10, 2)
      this.doorGraphics.fill(0x2f4f4f)
      this.doorGraphics.circle(0, 28, 2)
      this.doorGraphics.fill(0x000000)

      // Chain
      for (let i = 0; i < 3; i++) {
        this.doorGraphics.circle(-8 + i * 8, 30, 3)
        this.doorGraphics.stroke({ width: 2, color: 0x696969 })
      }
    } else {
      // Golden handle
      this.doorGraphics.circle(10, 40, 3)
      this.doorGraphics.fill(0xffffff) // Bright shine
      this.doorGraphics.stroke({ width: 1, color: 0xffaa00 })

      // Glow effect when unlocked
      const glowAlpha = 0.3 + Math.sin(this.animationTime * 0.003) * 0.2
      this.doorGraphics.circle(0, 32, 25)
      this.doorGraphics.fill({ color: 0xffd700, alpha: glowAlpha })
    }
  }

  /**
   * Draw the orange crate (Vitamin C power-up)
   */
  private drawOrangeCrate(): void {
    this.crateGraphics.clear()

    if (!this.orangeAvailable) {
      // Show empty crate placeholder
      this.crateGraphics.rect(-10, 15, 20, 20)
      this.crateGraphics.stroke({ width: 2, color: 0x8b4513, alpha: 0.3 })

      // Respawn timer text
      if (this.orangeRespawnTimer > 0) {
        const secondsLeft = Math.ceil(this.orangeRespawnTimer / 1000)
        const timerText = new Text({
          text: `${secondsLeft}s`,
          style: new TextStyle({
            fontSize: 10,
            fill: 0xcccccc,
            fontWeight: "bold",
          }),
        })
        timerText.anchor.set(0.5)
        timerText.position.set(0, 25)
        this.crateGraphics.addChild(timerText)
      }
      return
    }

    // Wooden crate
    this.crateGraphics.roundRect(-15, 10, 30, 30, 3)
    this.crateGraphics.fill(0xcd853f) // Peru (light brown)
    this.crateGraphics.stroke({ width: 2, color: 0x8b4513 })

    // Crate planks
    for (let i = 0; i < 3; i++) {
      this.crateGraphics.moveTo(-15, 15 + i * 10)
      this.crateGraphics.lineTo(15, 15 + i * 10)
      this.crateGraphics.stroke({ width: 1, color: 0x654321, alpha: 0.5 })
    }

    // Orange (the power-up)
    const bobOffset = Math.sin(this.animationTime * 0.002) * 3
    this.crateGraphics.circle(0, 20 + bobOffset, 8)
    this.crateGraphics.fill(0xff8c00) // Dark orange
    this.crateGraphics.stroke({ width: 1, color: 0xff6347 })

    // Orange highlight
    this.crateGraphics.circle(-2, 18 + bobOffset, 3)
    this.crateGraphics.fill({ color: 0xffa500, alpha: 0.8 })

    // Stem
    this.crateGraphics.rect(-1, 12 + bobOffset, 2, 3)
    this.crateGraphics.fill(0x228b22) // Forest green

    // Leaf
    this.crateGraphics.ellipse(2, 13 + bobOffset, 3, 2)
    this.crateGraphics.fill(0x32cd32) // Lime green

    // Shimmer effect
    const shimmerAlpha = 0.4 + Math.sin(this.animationTime * 0.004) * 0.3
    this.crateGraphics.circle(0, 20 + bobOffset, 12)
    this.crateGraphics.fill({ color: 0xffff00, alpha: shimmerAlpha * 0.3 })
  }

  /**
   * Record a shark hit for a player
   * After 5 hits, the room unlocks for that player
   */
  public recordSharkHit(playerId: string): void {
    const currentHits = this.playerHits.get(playerId) || 0
    const newHits = currentHits + 1
    this.playerHits.set(playerId, newHits)

    if (newHits >= this.HITS_REQUIRED && !this.unlockedPlayers.has(playerId)) {
      this.unlockedPlayers.add(playerId)
    }
  }

  /**
   * Check if room is unlocked for a specific player
   */
  public isUnlocked(playerId: string): boolean {
    return this.unlockedPlayers.has(playerId)
  }

  /**
   * Get player's current hit progress toward unlocking
   */
  public getHitProgress(playerId: string): { current: number; required: number } {
    return {
      current: this.playerHits.get(playerId) || 0,
      required: this.HITS_REQUIRED,
    }
  }

  /**
   * Check if player can take the orange power-up
   */
  public canTakeOrange(playerId: string): boolean {
    return this.isUnlocked(playerId) && this.orangeAvailable && this.playersNearby.has(playerId)
  }

  /**
   * Take the orange power-up (returns true if successful)
   */
  public takeOrange(playerId: string): boolean {
    if (!this.canTakeOrange(playerId)) {
      return false
    }

    this.orangeAvailable = false
    this.orangeRespawnTimer = this.ORANGE_RESPAWN_TIME
    this.drawOrangeCrate()
    return true
  }

  /**
   * Check if orange is currently available
   */
  public isOrangeAvailable(): boolean {
    return this.orangeAvailable
  }

  /**
   * Get remaining time until orange respawns (in ms)
   */
  public getRespawnTime(): number {
    return this.orangeRespawnTimer
  }

  /**
   * Update the secret room state
   */
  public update(delta: number, playerX: number, playerY: number, playerId: string): void {
    this.animationTime += delta

    // Check if player is nearby
    const dist = Math.sqrt((playerX - this.x) ** 2 + (playerY - this.y) ** 2)
    const isNearby = dist < this.INTERACTION_RADIUS

    if (isNearby) {
      this.playersNearby.add(playerId)
    } else {
      this.playersNearby.delete(playerId)
    }

    // Update orange respawn timer
    if (!this.orangeAvailable && this.orangeRespawnTimer > 0) {
      this.orangeRespawnTimer = Math.max(0, this.orangeRespawnTimer - delta * 16.67) // Convert to ms

      if (this.orangeRespawnTimer === 0) {
        this.orangeAvailable = true
      }
    }

    // Update UI based on player state
    const unlocked = this.isUnlocked(playerId)
    const progress = this.getHitProgress(playerId)

    if (isNearby) {
      if (!unlocked) {
        // Show progress to unlock
        this.statusText.text = `Shark Hits: ${progress.current}/${progress.required}`
        this.statusText.style.fill = progress.current >= progress.required ? 0x00ff00 : 0xffffff
        this.statusText.visible = true
        this.promptText.text = "Locked - Hit shark with harpoon!"
        this.promptText.style.fill = 0xff6666
        this.promptText.visible = true
      } else if (this.orangeAvailable) {
        // Room unlocked, orange available
        this.statusText.text = "UNLOCKED!"
        this.statusText.style.fill = 0x00ff00
        this.statusText.visible = true
        this.promptText.text = "Press E to take Orange (+Speed)"
        this.promptText.style.fill = 0xffd700
        this.promptText.visible = true
      } else {
        // Room unlocked, but orange not available
        this.statusText.text = "UNLOCKED!"
        this.statusText.style.fill = 0x00ff00
        this.statusText.visible = true
        const secondsLeft = Math.ceil(this.orangeRespawnTimer / 1000)
        this.promptText.text = `Orange respawns in ${secondsLeft}s`
        this.promptText.style.fill = 0xcccccc
        this.promptText.visible = true
      }
    } else {
      this.statusText.visible = false
      this.promptText.visible = false
    }

    // Redraw graphics
    this.drawRoom()
    this.drawDoor(unlocked)
    this.drawOrangeCrate()
  }

  /**
   * Check if player is near the room
   */
  public isPlayerNearby(playerId: string): boolean {
    return this.playersNearby.has(playerId)
  }

  /**
   * Get position of the room
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  /**
   * Reset state for a specific player (useful for game restart)
   */
  public resetPlayer(playerId: string): void {
    this.playerHits.delete(playerId)
    this.unlockedPlayers.delete(playerId)
    this.playersNearby.delete(playerId)
  }

  /**
   * Reset all state (useful for game restart)
   */
  public resetAll(): void {
    this.playerHits.clear()
    this.unlockedPlayers.clear()
    this.playersNearby.clear()
    this.orangeAvailable = true
    this.orangeRespawnTimer = 0
  }
}

/**
 * Factory function to create a secret room near the Fish Market
 */
export function createSecretRoom(screenWidth: number, screenHeight: number): SecretRoom {
  const beachY = screenHeight * 0.2 // Same level as Fish Market

  // Place behind/near Fish Market (right side of screen)
  return new SecretRoom(screenWidth - 150, beachY + 120)
}
