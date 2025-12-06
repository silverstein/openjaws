import { Container, Graphics, Text, TextStyle } from "pixi.js"

/**
 * Boat entity - a small rowboat at the end of the dock
 * Provides safety from shark attacks but prevents selfie-taking
 * Has limited capacity and can eject players when bumped by shark
 */
export class Boat {
  public container: Container
  public x: number
  public y: number

  private graphics: Graphics
  private statusText: Text
  private occupants: string[] = []

  private maxCapacity: number = 3
  private bumpChance: number = 0.5 // 50% chance to eject player on shark bump
  private bobbingOffset: number = 0
  private bobbingSpeed: number = 0.002

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create graphics layer
    this.graphics = new Graphics()
    this.container.addChild(this.graphics)

    // Create status text
    const textStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 12,
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 2 },
      align: "center",
    })

    this.statusText = new Text({ text: this.getStatusText(), style: textStyle })
    this.statusText.anchor.set(0.5)
    this.statusText.y = -50
    this.container.addChild(this.statusText)

    // Draw initial boat
    this.drawBoat()
  }

  /**
   * Draws the rowboat with bobbing animation
   */
  private drawBoat(): void {
    this.graphics.clear()

    const boatWidth = 70
    const boatHeight = 30
    const boatDepth = 15

    // Apply bobbing offset
    const bobY = Math.sin(this.bobbingOffset) * 3

    // Draw boat hull (brown wood)
    // Bottom curve
    this.graphics.moveTo(-boatWidth / 2, bobY + boatDepth)
    this.graphics.bezierCurveTo(
      -boatWidth / 2, bobY + boatDepth + 5,
      boatWidth / 2, bobY + boatDepth + 5,
      boatWidth / 2, bobY + boatDepth
    )
    // Right side
    this.graphics.lineTo(boatWidth / 2 - 10, bobY - boatHeight / 2)
    // Top
    this.graphics.lineTo(-boatWidth / 2 + 10, bobY - boatHeight / 2)
    // Left side
    this.graphics.closePath()
    this.graphics.fill(0x8b4513)
    this.graphics.stroke({ width: 3, color: 0x654321 })

    // Draw boat interior (darker)
    this.graphics.ellipse(0, bobY + 2, boatWidth / 2 - 12, boatHeight / 2 - 8)
    this.graphics.fill({ color: 0x654321, alpha: 0.5 })

    // Draw seats (horizontal planks)
    for (let i = 0; i < 2; i++) {
      const seatY = bobY - 8 + i * 10
      this.graphics.rect(-boatWidth / 2 + 15, seatY, boatWidth - 30, 4)
      this.graphics.fill(0xa0522d)
      this.graphics.stroke({ width: 1, color: 0x654321 })
    }

    // Draw oars if boat has occupants
    if (this.occupants.length > 0) {
      this.drawOars(bobY)
    }

    // Draw occupancy indicator circles (player slots)
    this.drawOccupancyIndicators(bobY)

    // Draw water ripples around boat
    this.drawWaterRipples(bobY)

    // Full indicator if at capacity
    if (this.isFull()) {
      this.graphics.circle(0, bobY - 30, 8)
      this.graphics.fill(0xff0000)
      this.graphics.stroke({ width: 2, color: 0xffffff })
    }
  }

  /**
   * Draws oars on the sides of the boat
   */
  private drawOars(bobY: number): void {
    const oarLength = 45
    const oarWidth = 4
    const boatWidth = 70

    // Left oar
    this.graphics.rect(-boatWidth / 2 - oarLength + 10, bobY - 5, oarLength, oarWidth)
    this.graphics.fill(0xa0522d)
    this.graphics.stroke({ width: 1, color: 0x654321 })

    // Left paddle
    this.graphics.ellipse(-boatWidth / 2 - oarLength + 15, bobY - 3, 8, 6)
    this.graphics.fill(0xa0522d)
    this.graphics.stroke({ width: 1, color: 0x654321 })

    // Right oar
    this.graphics.rect(boatWidth / 2 - 10, bobY - 5, oarLength, oarWidth)
    this.graphics.fill(0xa0522d)
    this.graphics.stroke({ width: 1, color: 0x654321 })

    // Right paddle
    this.graphics.ellipse(boatWidth / 2 + oarLength - 15, bobY - 3, 8, 6)
    this.graphics.fill(0xa0522d)
    this.graphics.stroke({ width: 1, color: 0x654321 })
  }

  /**
   * Draws circles representing player capacity
   */
  private drawOccupancyIndicators(bobY: number): void {
    const indicatorRadius = 6
    const spacing = 20

    for (let i = 0; i < this.maxCapacity; i++) {
      const x = (i - 1) * spacing
      const y = bobY - 35

      this.graphics.circle(x, y, indicatorRadius)

      // Filled if occupied, empty if available
      if (i < this.occupants.length) {
        this.graphics.fill(0x00ff00) // Green = occupied
      } else {
        this.graphics.fill({ color: 0xffffff, alpha: 0.3 }) // White = empty
      }

      this.graphics.stroke({ width: 2, color: 0x000000 })
    }
  }

  /**
   * Draws water ripples around the boat
   */
  private drawWaterRipples(bobY: number): void {
    const rippleCount = 3
    const baseRadius = 40

    for (let i = 0; i < rippleCount; i++) {
      const radius = baseRadius + i * 10
      const alpha = 0.15 - i * 0.04

      this.graphics.ellipse(0, bobY + 15, radius, radius * 0.6)
      this.graphics.stroke({ width: 1, color: 0x4ecdc4, alpha })
    }
  }

  /**
   * Updates the boat animation and status
   */
  public update(delta: number): void {
    // Update bobbing animation
    this.bobbingOffset += this.bobbingSpeed * delta

    // Redraw boat with new bobbing position
    this.drawBoat()

    // Update status text
    this.statusText.text = this.getStatusText()
  }

  /**
   * Attempts to board a player onto the boat
   * @param playerId - Unique identifier for the player
   * @returns true if boarding was successful, false if boat is full
   */
  public board(playerId: string): boolean {
    if (this.isFull()) {
      return false
    }

    if (this.isPlayerInBoat(playerId)) {
      return false // Already on boat
    }

    this.occupants.push(playerId)
    this.drawBoat()
    return true
  }

  /**
   * Removes a player from the boat
   * @param playerId - Unique identifier for the player
   * @returns true if player was ejected, false if they weren't on boat
   */
  public eject(playerId: string): boolean {
    const index = this.occupants.indexOf(playerId)
    if (index === -1) {
      return false
    }

    this.occupants.splice(index, 1)
    this.drawBoat()
    return true
  }

  /**
   * Shark bump mechanic - randomly ejects players
   * @returns Array of player IDs that were ejected
   */
  public bump(): string[] {
    const ejected: string[] = []

    // Check each occupant for ejection
    for (let i = this.occupants.length - 1; i >= 0; i--) {
      if (Math.random() < this.bumpChance) {
        const playerId = this.occupants[i]
        if (playerId) {
          ejected.push(playerId)
          this.occupants.splice(i, 1)
        }
      }
    }

    if (ejected.length > 0) {
      this.drawBoat()
    }

    return ejected
  }

  /**
   * Checks if a specific player is in the boat
   */
  public isPlayerInBoat(playerId: string): boolean {
    return this.occupants.includes(playerId)
  }

  /**
   * Gets the number of players currently in the boat
   */
  public getOccupantCount(): number {
    return this.occupants.length
  }

  /**
   * Checks if the boat is at full capacity
   */
  public isFull(): boolean {
    return this.occupants.length >= this.maxCapacity
  }

  /**
   * Gets list of all occupant IDs
   */
  public getOccupants(): string[] {
    return [...this.occupants]
  }

  /**
   * Generates status text for the boat
   */
  private getStatusText(): string {
    const remaining = this.maxCapacity - this.occupants.length
    if (this.isFull()) {
      return "BOAT FULL"
    }
    if (this.occupants.length === 0) {
      return "EMPTY BOAT\nPress B to board"
    }
    return `${remaining} spot${remaining === 1 ? '' : 's'} left`
  }

  /**
   * Gets the boat's position
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  /**
   * Gets the boat's collision bounds
   */
  public getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - 35,
      y: this.y - 20,
      width: 70,
      height: 40,
    }
  }

  /**
   * Checks if a point is within boarding range of the boat
   */
  public isInBoardingRange(x: number, y: number, range: number = 50): boolean {
    const dx = x - this.x
    const dy = y - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < range
  }

  /**
   * Clears all occupants (for reset scenarios)
   */
  public clearOccupants(): void {
    this.occupants = []
    this.drawBoat()
  }
}

/**
 * Factory function to create a boat at the end of a dock
 * @param dockEndX - X position of dock end
 * @param dockEndY - Y position of dock end
 */
export function createBoat(dockEndX: number, dockEndY: number): Boat {
  // Position boat slightly beyond dock end in the water
  return new Boat(dockEndX, dockEndY + 25)
}
