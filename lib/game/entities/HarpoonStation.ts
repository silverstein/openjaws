import { Container, Graphics, Text } from "pixi.js"

export class HarpoonStation {
  public container: Container
  public x: number
  public y: number

  private graphics: Graphics
  private ammoText: Text
  private promptText: Text

  private maxAmmo: number = 3
  private currentAmmo: number = 3
  private reloadTime: number = 5000 // 5 seconds per harpoon
  private reloadTimer: number = 0
  private interactionRadius: number = 60

  private isPlayerNearby: boolean = false

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create station graphics
    this.graphics = new Graphics()
    this.drawStation()
    this.container.addChild(this.graphics)

    // Create ammo counter text
    this.ammoText = new Text({
      text: `${this.currentAmmo}/${this.maxAmmo}`,
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
    this.ammoText.anchor.set(0.5)
    this.ammoText.y = -45
    this.container.addChild(this.ammoText)

    // Create interaction prompt
    this.promptText = new Text({
      text: "Press F to fire!",
      style: {
        fontSize: 12,
        fill: 0xffd700,
        fontWeight: "bold",
        dropShadow: {
          distance: 1,
          color: 0x000000,
          alpha: 0.8
        }
      }
    })
    this.promptText.anchor.set(0.5)
    this.promptText.y = 40
    this.promptText.visible = false
    this.container.addChild(this.promptText)
  }

  private drawStation(): void {
    this.graphics.clear()

    // Base/platform (wooden dock piece)
    this.graphics.roundRect(-25, 10, 50, 15, 3)
    this.graphics.fill(0x8b4513) // Saddle brown
    this.graphics.stroke({ width: 2, color: 0x654321 })

    // Support posts
    this.graphics.rect(-20, -25, 6, 35)
    this.graphics.rect(14, -25, 6, 35)
    this.graphics.fill(0x8b4513)
    this.graphics.stroke({ width: 1, color: 0x654321 })

    // Crossbar
    this.graphics.rect(-22, -25, 44, 6)
    this.graphics.fill(0xa0522d) // Sienna
    this.graphics.stroke({ width: 1, color: 0x654321 })

    // Draw harpoons based on ammo count
    for (let i = 0; i < this.currentAmmo; i++) {
      const harpoonX = -12 + i * 12
      this.drawHarpoon(harpoonX, -35)
    }

    // Empty slots indicator
    for (let i = this.currentAmmo; i < this.maxAmmo; i++) {
      const slotX = -12 + i * 12
      this.graphics.circle(slotX, -35, 3)
      this.graphics.stroke({ width: 1, color: 0x666666, alpha: 0.5 })
    }

    // Highlight when player nearby and has ammo
    if (this.isPlayerNearby && this.currentAmmo > 0) {
      this.graphics.circle(0, 0, this.interactionRadius)
      this.graphics.stroke({ width: 2, color: 0xffd700, alpha: 0.3 })
    }
  }

  private drawHarpoon(x: number, y: number): void {
    // Harpoon shaft
    this.graphics.rect(x - 2, y, 4, 25)
    this.graphics.fill(0xd2691e) // Chocolate (wood)

    // Harpoon head (metal tip)
    this.graphics.moveTo(x, y - 8)
    this.graphics.lineTo(x + 4, y)
    this.graphics.lineTo(x - 4, y)
    this.graphics.closePath()
    this.graphics.fill(0xc0c0c0) // Silver

    // Barb
    this.graphics.moveTo(x + 3, y - 3)
    this.graphics.lineTo(x + 6, y)
    this.graphics.lineTo(x + 3, y)
    this.graphics.closePath()
    this.graphics.fill(0xc0c0c0)
  }

  public update(delta: number, playerX: number, playerY: number): boolean {
    // Check if player is nearby
    const dist = Math.sqrt((playerX - this.x) ** 2 + (playerY - this.y) ** 2)
    const wasNearby = this.isPlayerNearby
    this.isPlayerNearby = dist < this.interactionRadius

    // Update prompt visibility
    this.promptText.visible = this.isPlayerNearby && this.currentAmmo > 0

    // Update prompt text based on ammo
    if (this.isPlayerNearby) {
      if (this.currentAmmo > 0) {
        this.promptText.text = "Press F to fire!"
        this.promptText.style.fill = 0xffd700
      } else {
        this.promptText.text = "Reloading..."
        this.promptText.style.fill = 0xff6666
        this.promptText.visible = true
      }
    }

    // Reload ammo over time
    if (this.currentAmmo < this.maxAmmo) {
      this.reloadTimer += delta * 16.67 // Convert to ms (assuming 60fps)
      if (this.reloadTimer >= this.reloadTime) {
        this.currentAmmo++
        this.reloadTimer = 0
        this.updateAmmoDisplay()
        this.drawStation()
      }
    }

    // Redraw if player proximity changed
    if (wasNearby !== this.isPlayerNearby) {
      this.drawStation()
    }

    return this.isPlayerNearby
  }

  public canFire(): boolean {
    return this.isPlayerNearby && this.currentAmmo > 0
  }

  public fire(): { damage: number; startX: number; startY: number } | null {
    if (!this.canFire()) {
      return null
    }

    this.currentAmmo--
    this.updateAmmoDisplay()
    this.drawStation()

    return {
      damage: 30, // Each harpoon deals 30 damage
      startX: this.x,
      startY: this.y - 30 // Fire from top of station
    }
  }

  private updateAmmoDisplay(): void {
    this.ammoText.text = `${this.currentAmmo}/${this.maxAmmo}`

    // Color based on ammo level
    if (this.currentAmmo === 0) {
      this.ammoText.style.fill = 0xff4444 // Red when empty
    } else if (this.currentAmmo === 1) {
      this.ammoText.style.fill = 0xffaa00 // Orange when low
    } else {
      this.ammoText.style.fill = 0x44ff44 // Green when good
    }
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  public isNearPlayer(): boolean {
    return this.isPlayerNearby
  }

  public getAmmo(): number {
    return this.currentAmmo
  }
}

// Factory function to create harpoon stations at strategic locations
export function createHarpoonStations(screenWidth: number, screenHeight: number): HarpoonStation[] {
  const waterLine = screenHeight * 0.3

  return [
    // Left side - near water's edge
    new HarpoonStation(100, waterLine + 20),
    // Right side - near water's edge
    new HarpoonStation(screenWidth - 100, waterLine + 20),
    // Center - slightly into water
    new HarpoonStation(screenWidth / 2, waterLine + 80),
  ]
}
