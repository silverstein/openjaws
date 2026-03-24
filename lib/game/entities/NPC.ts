import { Container, Graphics, Sprite, Text, TextStyle } from "pixi.js"
import { gameLogger } from "@/lib/logger"
import type { NPCType } from "@/lib/ai/npcDialogue"
import { assetLoader } from "../AssetLoader"
import { OUTLINE, SKIN, drawFace, idleBob } from "../ArtStyle"

// NPC visual configurations
const NPC_CONFIGS: Record<
  NPCType,
  {
    name: string
    color: number
    icon: string
    size: number
    spritePath: string
  }
> = {
  beach_vendor: {
    name: "Sandy's Snacks",
    color: 0xffd700, // Gold
    icon: "🏪",
    size: 24,
    spritePath: "/assets/sprites/npc/beach-vendor.png",
  },
  lifeguard: {
    name: "Chad",
    color: 0xff0000, // Red
    icon: "🏊",
    size: 28,
    spritePath: "/assets/sprites/npc/lifeguard.png",
  },
  tourist: {
    name: "Karen",
    color: 0xff69b4, // Pink
    icon: "📸",
    size: 22,
    spritePath: "/assets/sprites/npc/tourist.png",
  },
  surfer: {
    name: "Kai",
    color: 0x00bfff, // Deep sky blue
    icon: "🏄",
    size: 26,
    spritePath: "/assets/sprites/npc/surfer.png",
  },
  scientist: {
    name: "Dr. Marina",
    color: 0x32cd32, // Lime green
    icon: "🔬",
    size: 24,
    spritePath: "/assets/sprites/npc/scientist.png",
  },
  reporter: {
    name: "Brenda Waves",
    color: 0x9932cc, // Purple
    icon: "🎤",
    size: 24,
    spritePath: "/assets/sprites/npc/reporter.png",
  },
  old_timer: {
    name: "Old Pete",
    color: 0x8b4513, // Saddle brown
    icon: "🎣",
    size: 26,
    spritePath: "/assets/sprites/npc/old-timer.png",
  },
  fish_vendor: {
    name: "Captain Bill",
    color: 0x4682b4, // Steel blue
    icon: "🐟",
    size: 26,
    spritePath: "/assets/sprites/npc/fish-vendor.png",
  },
}

export class NPC {
  public container: Container
  private sprite: Sprite | Graphics
  private nameText: Text
  private interactionIndicator: Graphics

  public x: number
  public y: number
  public npcType: NPCType
  public npcName: string
  public isInteracting: boolean = false

  private interactionRadius: number = 80
  private pulseTime: number = 0

  constructor(x: number, y: number, type: NPCType, customName?: string) {
    this.x = x
    this.y = y
    this.npcType = type

    const config = NPC_CONFIGS[type]
    this.npcName = customName || config.name

    // Create container
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create interaction indicator (pulsing circle when player is near)
    this.interactionIndicator = new Graphics()
    this.interactionIndicator.alpha = 0
    this.container.addChild(this.interactionIndicator)

    // Create NPC sprite - try to use texture first, fallback to graphics
    const texture = assetLoader.getTexture(config.spritePath)
    if (texture) {
      this.sprite = new Sprite(texture)
      this.sprite.anchor.set(0.5)
      this.sprite.scale.set(0.9) // Scale to appropriate size
    } else {
      // Fallback to graphics if texture not loaded
      this.sprite = new Graphics()
      this.drawNPCFallback(config)
    }
    this.container.addChild(this.sprite)

    // Add name text
    const textStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 11,
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 3 },
      align: "center",
    })

    this.nameText = new Text({ text: this.npcName, style: textStyle })
    this.nameText.anchor.set(0.5, 2.5)
    this.container.addChild(this.nameText)
  }

  private drawNPCFallback(config: { color: number; size: number }): void {
    if (!(this.sprite instanceof Graphics)) return

    const g = this.sprite
    g.clear()
    const r = config.size

    // Shadow
    g.ellipse(0, r + 4, r * 0.7, 4)
    g.fill({ color: 0x000000, alpha: 0.12 })

    // Body — pill shape (same as Player for consistency)
    g.roundRect(-r * 0.55, -r * 0.4, r * 1.1, r * 1.4, r * 0.4)
    g.fill(config.color)
    g.stroke(OUTLINE)

    // Head
    g.circle(0, -r * 0.55, r * 0.45)
    g.fill(SKIN.medium)
    g.stroke(OUTLINE)

    // Face
    drawFace(g, r * 0.15, -r * 0.6, r * 0.08, r * 0.15)
  }

  /** Apply idle bob animation */
  public applyIdleAnimation(): void {
    this.container.y = this.y + idleBob(Date.now() + this.x * 100, 1.5, 0.002)
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
    const config = NPC_CONFIGS[this.npcType]
    return {
      x: this.x - config.size,
      y: this.y - config.size,
      width: config.size * 2,
      height: config.size * 2,
    }
  }

  public setInteracting(value: boolean): void {
    this.isInteracting = value
    // Could add visual feedback here
  }

  public setPosition(x: number, y: number): void {
    this.x = x
    this.y = y
    this.container.x = x
    this.container.y = y
  }

  public startReaction(event: string): void {
    // Visual reaction to events
    // Could add animation, particle effects, etc.
    gameLogger.debug(`${this.npcName} reacting to: ${event}`)
  }
}

// NPC position configurations (as screen ratios)
export const NPC_POSITIONS: Array<{
  type: NPCType
  xRatio: number
  yRatio: number
  zone: "beach" | "waterline"
}> = [
  { type: "beach_vendor", xRatio: 0.15, yRatio: 0.6, zone: "beach" },
  { type: "lifeguard", xRatio: 0.5, yRatio: 0.4, zone: "beach" },
  { type: "tourist", xRatio: 0.75, yRatio: 0.8, zone: "beach" },
  { type: "surfer", xRatio: 0.3, yRatio: 0, zone: "waterline" },
  { type: "scientist", xRatio: 0.85, yRatio: 0, zone: "waterline" },
  { type: "reporter", xRatio: 0.6, yRatio: 0.5, zone: "beach" },
  { type: "old_timer", xRatio: 0.1, yRatio: 0, zone: "waterline" },
]

// Calculate NPC position based on screen size
export function calculateNPCPosition(
  config: (typeof NPC_POSITIONS)[number],
  screenWidth: number,
  screenHeight: number
): { x: number; y: number } {
  const beachY = screenHeight * 0.25
  const waterLineY = screenHeight * 0.3

  if (config.zone === "waterline") {
    // Position near water line with slight offset
    const offsetMap: Record<NPCType, number> = {
      surfer: -20,
      scientist: -30,
      old_timer: -10,
      beach_vendor: 0,
      lifeguard: 0,
      tourist: 0,
      reporter: 0,
      fish_vendor: 0,
    }
    return {
      x: screenWidth * config.xRatio,
      y: waterLineY + (offsetMap[config.type] || 0),
    }
  }

  return {
    x: screenWidth * config.xRatio,
    y: beachY * config.yRatio,
  }
}

// Factory function to create NPCs at predefined beach locations
export function createBeachNPCs(screenWidth: number, screenHeight: number): NPC[] {
  return NPC_POSITIONS.map((config) => {
    const pos = calculateNPCPosition(config, screenWidth, screenHeight)
    return new NPC(pos.x, pos.y, config.type)
  })
}

// Reposition existing NPCs for new screen size
export function repositionNPCs(
  npcs: NPC[],
  screenWidth: number,
  screenHeight: number
): void {
  npcs.forEach((npc, index) => {
    const config = NPC_POSITIONS[index]
    if (config) {
      const pos = calculateNPCPosition(config, screenWidth, screenHeight)
      npc.setPosition(pos.x, pos.y)
    }
  })
}
