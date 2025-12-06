import { Container, Graphics, Sprite, Text, TextStyle } from "pixi.js"
import type { NPCType } from "@/lib/ai/npcDialogue"
import { assetLoader } from "../AssetLoader"

// Fish Vendor NPC configuration
const FISH_VENDOR_CONFIG = {
  name: "Captain Bill",
  color: 0x4682b4, // Steel blue (fisherman colors)
  icon: "🐟",
  size: 26,
  spritePath: "/assets/sprites/npc/fish-vendor.png",
}

export class FishVendor {
  public container: Container
  private sprite: Sprite | Graphics
  private nameText: Text
  private interactionIndicator: Graphics
  private bodyGraphics: Graphics

  public x: number
  public y: number
  public npcType: NPCType = "fish_vendor"
  public npcName: string
  public isInteracting: boolean = false

  private interactionRadius: number = 80
  private pulseTime: number = 0
  private bobTime: number = 0

  constructor(x: number, y: number, customName?: string) {
    this.x = x
    this.y = y
    this.npcName = customName || FISH_VENDOR_CONFIG.name

    // Create container
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create interaction indicator (pulsing circle when player is near)
    this.interactionIndicator = new Graphics()
    this.interactionIndicator.alpha = 0
    this.container.addChild(this.interactionIndicator)

    // Create body graphics container (for bobbing animation)
    this.bodyGraphics = new Graphics()
    this.container.addChild(this.bodyGraphics)

    // Create NPC sprite - try to use texture first, fallback to graphics
    const texture = assetLoader.getTexture(FISH_VENDOR_CONFIG.spritePath)
    if (texture) {
      this.sprite = new Sprite(texture)
      this.sprite.anchor.set(0.5)
      this.sprite.scale.set(0.9)
      this.bodyGraphics.addChild(this.sprite)
    } else {
      // Fallback to custom graphics if texture not loaded
      this.sprite = new Graphics()
      this.drawFishVendor()
      this.bodyGraphics.addChild(this.sprite)
    }

    // Add name text
    const textStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 11,
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 3 },
      align: "center",
    })

    this.nameText = new Text({ text: this.npcName, style: textStyle })
    this.nameText.anchor.set(0.5, 2.8)
    this.container.addChild(this.nameText)
  }

  private drawFishVendor(): void {
    if (!(this.sprite instanceof Graphics)) return

    this.sprite.clear()

    // Draw fisherman character
    const headY = -20
    const bodyY = 0

    // Fish hat (simple fish shape on head)
    this.sprite.moveTo(-8, headY - 18)
    this.sprite.lineTo(-12, headY - 15)
    this.sprite.lineTo(-8, headY - 12)
    this.sprite.lineTo(8, headY - 12)
    this.sprite.lineTo(12, headY - 15)
    this.sprite.lineTo(8, headY - 18)
    this.sprite.closePath()
    this.sprite.fill(0xff6347) // Tomato red (fish color)
    this.sprite.stroke({ width: 1, color: 0x000000 })

    // Fish eye on hat
    this.sprite.circle(6, headY - 15, 2)
    this.sprite.fill(0x000000)

    // Head (circle)
    this.sprite.circle(0, headY, 10)
    this.sprite.fill(0xffd4a3) // Skin tone
    this.sprite.stroke({ width: 2, color: 0x000000 })

    // Eyes
    this.sprite.circle(-3, headY - 2, 2)
    this.sprite.circle(3, headY - 2, 2)
    this.sprite.fill(0x000000)

    // Friendly smile
    this.sprite.arc(0, headY + 2, 4, 0.2, Math.PI - 0.2)
    this.sprite.stroke({ width: 1.5, color: 0x000000 })

    // Body (blue/white striped apron)
    // White base
    this.sprite.rect(-12, bodyY - 8, 24, 18)
    this.sprite.fill(0xffffff)
    this.sprite.stroke({ width: 2, color: 0x000000 })

    // Blue stripes
    this.sprite.rect(-12, bodyY - 4, 24, 3)
    this.sprite.rect(-12, bodyY + 2, 24, 3)
    this.sprite.fill(0x4169e1) // Royal blue

    // Apron strings
    this.sprite.moveTo(-10, bodyY - 8)
    this.sprite.lineTo(-8, headY + 8)
    this.sprite.moveTo(10, bodyY - 8)
    this.sprite.lineTo(8, headY + 8)
    this.sprite.stroke({ width: 1, color: 0x808080 })

    // Arms (simple lines)
    this.sprite.moveTo(-12, bodyY - 4)
    this.sprite.lineTo(-18, bodyY + 2)
    this.sprite.moveTo(12, bodyY - 4)
    this.sprite.lineTo(18, bodyY + 2)
    this.sprite.stroke({ width: 3, color: 0xffd4a3 })
    this.sprite.stroke({ width: 2, color: 0x000000 })

    // Holding a fish in one hand
    this.sprite.ellipse(18, bodyY + 2, 6, 3)
    this.sprite.fill(0xc0c0c0) // Silver fish
    this.sprite.stroke({ width: 1, color: 0x000000 })

    // Fish tail
    this.sprite.moveTo(24, bodyY + 2)
    this.sprite.lineTo(27, bodyY)
    this.sprite.lineTo(27, bodyY + 4)
    this.sprite.closePath()
    this.sprite.fill(0xc0c0c0)
    this.sprite.stroke({ width: 1, color: 0x000000 })
  }

  private drawInteractionIndicator(isNear: boolean): void {
    this.interactionIndicator.clear()

    if (isNear) {
      // Pulsing ring
      const pulse = Math.sin(this.pulseTime * 3) * 0.3 + 0.7
      const radius = 35 + Math.sin(this.pulseTime * 2) * 5

      this.interactionIndicator.circle(0, 0, radius)
      this.interactionIndicator.stroke({
        width: 2,
        color: 0x4ecdc4,
        alpha: pulse * 0.5,
      })

      // Inner glow
      this.interactionIndicator.circle(0, 0, radius - 5)
      this.interactionIndicator.stroke({
        width: 1,
        color: 0xffffff,
        alpha: pulse * 0.3,
      })

      this.interactionIndicator.alpha = 1
    } else {
      this.interactionIndicator.alpha = 0
    }
  }

  public update(delta: number, playerX: number, playerY: number): boolean {
    this.pulseTime += delta * 0.01
    this.bobTime += delta * 0.01

    // Bobbing idle animation
    const bobAmount = Math.sin(this.bobTime * 2) * 2
    this.bodyGraphics.y = bobAmount

    // Check if player is nearby
    const distance = this.getDistanceToPlayer(playerX, playerY)
    const isPlayerNear = distance < this.interactionRadius

    // Update interaction indicator
    this.drawInteractionIndicator(isPlayerNear)

    return isPlayerNear
  }

  public getDistanceToPlayer(playerX: number, playerY: number): number {
    const dx = this.x - playerX
    const dy = this.y - playerY
    return Math.sqrt(dx * dx + dy * dy)
  }

  public isPlayerNearby(playerX: number, playerY: number): boolean {
    return this.getDistanceToPlayer(playerX, playerY) < this.interactionRadius
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  public getScreenPosition(): { x: number; y: number } {
    return {
      x: this.container.x,
      y: this.container.y,
    }
  }

  public getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - FISH_VENDOR_CONFIG.size,
      y: this.y - FISH_VENDOR_CONFIG.size,
      width: FISH_VENDOR_CONFIG.size * 2,
      height: FISH_VENDOR_CONFIG.size * 2,
    }
  }

  public setInteracting(value: boolean): void {
    this.isInteracting = value
  }

  public setPosition(x: number, y: number): void {
    this.x = x
    this.y = y
    this.container.x = x
    this.container.y = y
  }

  public startReaction(event: string): void {
    // Visual reaction to events
    console.log(`${this.npcName} reacting to: ${event}`)
  }
}

// Factory function to create a fish vendor NPC
export function createFishVendor(x: number, y: number, customName?: string): FishVendor {
  return new FishVendor(x, y, customName)
}
