import { Container, Graphics, Sprite, Text, TextStyle } from "pixi.js"
import { gameLogger } from "@/lib/logger"
import { OUTLINE, PALETTE, idleBob } from "../ArtStyle"
import type { SharkPersonality } from "@/convex/types"
import type { SharkAIController } from "../ai/SharkAIController"
import type { Player } from "./Player"
import { assetLoader } from "../AssetLoader"

// Shark AI states
export type SharkState = "patrol" | "hunting" | "attacking" | "stunned" | "eating"

// Game state interface for Shark AI
export interface GameState {
  timeRemaining?: number
  waterLevel?: string
  activeEvent?: { type: string; startTime: number; duration: number }
  playerCount?: number
  objectivesActive?: number
}

// AI Decision type
export type AIDecision = {
  action: "hunt" | "patrol" | "ambush" | "retreat" | "taunt"
  targetPlayerId?: string
  reasoning: string
  confidence: number
  personalityInfluence: string
}

export class Shark {
  public container: Container
  private sprite: Sprite | Graphics
  private effectsGraphics: Graphics
  private stateText: Text
  private currentState: SharkState = "patrol"

  public x: number
  public y: number
  public vx: number = 0
  public vy: number = 0
  private rotation: number = 0

  // AI parameters
  private patrolSpeed: number = 1.5
  private readonly defaultHuntingSpeed: number = 3
  private huntingSpeed: number = 3
  private attackSpeed: number = 5
  private detectionRadius: number = 200
  private attackRadius: number = 50

  // Difficulty scaling
  private difficultyMultiplier: number = 1.0

  // State timers
  private stateTimer: number = 0
  private patrolDirection: number = Math.random() * Math.PI * 2
  private stunDuration: number = 0

  // AI Integration
  private aiController: SharkAIController | null = null
  private lastAIDecisionTime: number = 0
  private aiDecisionInterval: number = 2500 // 2.5 seconds
  private currentAIDecision: AIDecision | null = null
  private currentTargetId: string | null = null
  private aiThoughtText: Text

  // Personality
  protected personality: SharkPersonality = "methodical"
  protected hunger: number = 50
  protected rage: number = 0

  // Health system
  protected health: number = 150
  protected maxHealth: number = 150

  // Bait system
  private eatingDuration: number = 0
  private currentBaitPosition: { x: number; y: number } | null = null

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    // Create container
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create shark sprite - try to use texture first, fallback to graphics
    const texture = assetLoader.getTexture("/assets/sprites/shark/shark-body.png")
    if (texture) {
      this.sprite = new Sprite(texture)
      this.sprite.anchor.set(0.5)
      this.sprite.scale.set(1.0) // Scale to appropriate size
    } else {
      // Fallback to graphics if texture not loaded
      this.sprite = new Graphics()
      this.drawSharkFallback()
    }
    this.container.addChild(this.sprite)

    // Create separate graphics layer for effects (detection radius, stunned stars, etc.)
    this.effectsGraphics = new Graphics()
    this.container.addChild(this.effectsGraphics)

    // Add state indicator text
    const textStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 14,
      fill: 0xff0000,
      stroke: { color: 0xffffff, width: 2 },
      align: "center",
    })

    this.stateText = new Text({ text: "Patrolling", style: textStyle })
    this.stateText.anchor.set(0.5, -2)
    this.container.addChild(this.stateText)

    // Add AI thought bubble
    const thoughtStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 12,
      fill: 0x4ecdc4,
      stroke: { color: 0x1a252f, width: 1 },
      align: "center",
      wordWrap: true,
      wordWrapWidth: 200,
    })

    this.aiThoughtText = new Text({ text: "", style: thoughtStyle })
    this.aiThoughtText.anchor.set(0.5, 1.5)
    this.aiThoughtText.y = -60
    this.container.addChild(this.aiThoughtText)
  }

  // Getter and setter for rage
  public getRage(): number {
    return this.rage
  }

  public setRage(value: number): void {
    this.rage = Math.max(0, Math.min(100, value))
  }

  // Health methods
  public getHealth(): number {
    return this.health
  }

  public getMaxHealth(): number {
    return this.maxHealth
  }

  public takeDamage(amount: number): void {
    // Apply vulnerability multiplier if eating
    const finalDamage = amount * this.getVulnerabilityMultiplier()
    this.health = Math.max(0, this.health - finalDamage)

    // Increase rage when damaged
    this.rage = Math.min(100, this.rage + finalDamage * 0.5)

    // Stun briefly when hit
    if (finalDamage > 10) {
      this.stun(500)
    }

    // If eating, interrupt eating when damaged
    if (this.currentState === "eating") {
      this.currentBaitPosition = null
      this.setState("stunned")
    }
  }

  public isDefeated(): boolean {
    return this.health <= 0
  }

  private drawSharkFallback(): void {
    if (!(this.sprite instanceof Graphics)) return

    const g = this.sprite
    g.clear()

    const isAggro = this.currentState === "attacking" || this.currentState === "hunting"
    const bodyColor = isAggro ? PALETTE.sharkBodyAggro : PALETTE.sharkBody

    // Water shadow
    g.ellipse(0, 42, 16, 4)
    g.fill({ color: 0x000000, alpha: 0.1 })

    // Tail fin — forked, behind body
    g.moveTo(0, 30)
    g.lineTo(18, 44)
    g.lineTo(0, 36)
    g.lineTo(-18, 44)
    g.closePath()
    g.fill(PALETTE.sharkFin)
    g.stroke(OUTLINE)

    // Pectoral fins (side fins) — behind body
    g.moveTo(-15, 2)
    g.lineTo(-28, 14)
    g.lineTo(-14, 8)
    g.closePath()
    g.fill(bodyColor)
    g.stroke({ width: 1.5, color: OUTLINE.color })
    g.moveTo(15, 2)
    g.lineTo(28, 14)
    g.lineTo(14, 8)
    g.closePath()
    g.fill(bodyColor)
    g.stroke({ width: 1.5, color: OUTLINE.color })

    // Main body — smooth torpedo
    g.ellipse(0, -2, 17, 38)
    g.fill(bodyColor)
    g.stroke(OUTLINE)

    // Belly — lighter underside
    g.ellipse(0, 8, 11, 22)
    g.fill(PALETTE.sharkBelly)

    // Dorsal fin — iconic triangle
    g.moveTo(0, -18)
    g.lineTo(16, -2)
    g.lineTo(2, -2)
    g.closePath()
    g.fill(PALETTE.sharkFin)
    g.stroke(OUTLINE)

    // Eyes — glow when aggressive
    const eyeSize = isAggro ? 4 : 3
    const eyeColor = isAggro ? PALETTE.sharkEyeAggro : PALETTE.sharkEye
    g.circle(-7, -24, eyeSize)
    g.circle(7, -24, eyeSize)
    g.fill(eyeColor)
    // Pupils — slitted when hunting
    if (isAggro) {
      g.ellipse(-7, -24, 1, 3)
      g.ellipse(7, -24, 1, 3)
    } else {
      g.circle(-7, -24, 1.5)
      g.circle(7, -24, 1.5)
    }
    g.fill(0x111111)

    // Mouth line
    g.moveTo(-10, -34)
    g.lineTo(0, -36)
    g.lineTo(10, -34)
    g.stroke({ width: 1.5, color: OUTLINE.color })

    // Teeth — always showing, more when aggressive
    const teethCount = isAggro ? 5 : 3
    for (let i = -teethCount; i <= teethCount; i++) {
      g.moveTo(i * 2.5 - 1.5, -34)
      g.lineTo(i * 2.5, isAggro ? -41 : -38)
      g.lineTo(i * 2.5 + 1.5, -34)
      g.fill(0xffffff)
    }

    // Scars (personality)
    g.moveTo(-5, -8)
    g.lineTo(3, -13)
    g.stroke({ width: 1, color: OUTLINE.color, alpha: 0.3 })
    g.moveTo(4, 2)
    g.lineTo(8, -3)
    g.stroke({ width: 0.8, color: OUTLINE.color, alpha: 0.2 })

    // Difficulty indicator — glow ring when scaled up
    if (this.difficultyMultiplier > 1.0) {
      const glowAlpha = 0.1 + (this.difficultyMultiplier - 1) * 0.3
      g.circle(0, 0, 44)
      g.stroke({ width: 2, color: isAggro ? 0xff0000 : 0xff6600, alpha: Math.min(0.5, glowAlpha) })
    }
  }

  /** Apply idle swim animation */
  public applyIdleAnimation(): void {
    if (this.currentState === "patrol") {
      this.container.y = this.y + idleBob(Date.now(), 3, 0.002)
    }
  }

  private drawEffects(): void {
    this.effectsGraphics.clear()

    // Add detection radius visualization (debug)
    if (this.currentState === "patrol") {
      this.effectsGraphics.circle(0, 0, this.detectionRadius)
      this.effectsGraphics.stroke({ width: 1, color: 0x4ecdc4, alpha: 0.1 })
    }

    // Stunned effect
    if (this.currentState === "stunned") {
      // Draw stars around head
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + Date.now() * 0.001
        const starX = Math.cos(angle) * 30
        const starY = Math.sin(angle) * 30 - 20
        this.effectsGraphics.star(starX, starY, 5, 8, 4)
        this.effectsGraphics.fill(0xffd700)
      }
    }
  }

  public update(delta: number, player: Player | null, gameState?: GameState): void {
    // Update visual effects
    this.drawEffects()

    // Poll AI for decisions
    if (this.aiController && Date.now() - this.lastAIDecisionTime > this.aiDecisionInterval) {
      this.pollAIDecision(player, gameState)
    }
    // Update stun duration
    if (this.stunDuration > 0) {
      this.stunDuration -= delta
      if (this.stunDuration <= 0) {
        this.setState("patrol")
      }
    }

    // Apply AI decision to state machine
    if (this.currentAIDecision && this.currentState !== "stunned") {
      this.applyAIDecision(player)
    }

    // State machine logic
    switch (this.currentState) {
      case "patrol":
        this.patrolBehavior(delta, player)
        break
      case "hunting":
        this.huntingBehavior(delta, player)
        break
      case "attacking":
        this.attackingBehavior(delta, player)
        break
      case "stunned":
        this.stunnedBehavior(delta)
        break
      case "eating":
        this.eatingBehavior(delta)
        break
    }

    // Apply friction
    this.vx *= 0.95
    this.vy *= 0.95

    // Update position
    this.x += this.vx
    this.y += this.vy

    // Update container
    this.container.x = this.x
    this.container.y = this.y

    // Update rotation based on velocity
    if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
      this.rotation = Math.atan2(this.vy, this.vx) + Math.PI / 2
      this.container.rotation = this.rotation
    }
  }

  private patrolBehavior(delta: number, player: Player | null): void {
    // Random patrol movement
    this.stateTimer += delta

    if (this.stateTimer > 2000) {
      // Change direction every 2 seconds
      this.patrolDirection += (Math.random() - 0.5) * Math.PI
      this.stateTimer = 0
    }

    // Apply patrol movement
    this.vx += Math.cos(this.patrolDirection) * this.patrolSpeed * 0.1
    this.vy += Math.sin(this.patrolDirection) * this.patrolSpeed * 0.1

    // Check for player detection
    if (player) {
      const dist = this.getDistanceTo(player.x, player.y)
      if (dist < this.detectionRadius) {
        this.setState("hunting")
      }
    }
  }

  private huntingBehavior(_delta: number, player: Player | null): void {
    if (!player) {
      this.setState("patrol")
      return
    }

    const dist = this.getDistanceTo(player.x, player.y)

    // If player escaped, return to patrol
    if (dist > this.detectionRadius * 1.5) {
      this.setState("patrol")
      return
    }

    // If close enough, attack
    if (dist < this.attackRadius) {
      this.setState("attacking")
      return
    }

    // Chase player
    const angle = Math.atan2(player.y - this.y, player.x - this.x)
    this.vx += Math.cos(angle) * this.huntingSpeed * 0.1
    this.vy += Math.sin(angle) * this.huntingSpeed * 0.1
  }

  private attackingBehavior(_delta: number, player: Player | null): void {
    if (!player) {
      this.setState("patrol")
      return
    }

    const dist = this.getDistanceTo(player.x, player.y)

    // If player escaped attack range, go back to hunting
    if (dist > this.attackRadius * 1.5) {
      this.setState("hunting")
      return
    }

    // Lunge at player
    const angle = Math.atan2(player.y - this.y, player.x - this.x)
    this.vx += Math.cos(angle) * this.attackSpeed * 0.15
    this.vy += Math.sin(angle) * this.attackSpeed * 0.15

    // Check for collision
    if (dist < 30) {
      gameLogger.debug("CHOMP! Player caught!")
      // In a real game, this would trigger death/respawn
    }
  }

  private stunnedBehavior(_delta: number): void {
    // Drift randomly while stunned
    this.vx += (Math.random() - 0.5) * 0.5
    this.vy += (Math.random() - 0.5) * 0.5
  }

  private eatingBehavior(delta: number): void {
    // Stay at bait position while eating
    if (this.currentBaitPosition) {
      // Slow down to a stop
      this.vx *= 0.8
      this.vy *= 0.8

      // Small chomping animation (wiggle)
      const wiggle = Math.sin(Date.now() * 0.02) * 5
      this.container.x = this.x + wiggle
    }

    // Decrease eating duration
    this.eatingDuration -= delta
    if (this.eatingDuration <= 0) {
      this.currentBaitPosition = null
      this.setState("patrol")
    }
  }

  private setState(newState: SharkState): void {
    this.currentState = newState
    this.stateTimer = 0
    this.huntingSpeed = this.defaultHuntingSpeed

    // Update state text
    switch (newState) {
      case "patrol":
        this.stateText.text = "Patrolling"
        this.stateText.style.fill = 0x4ecdc4
        break
      case "hunting":
        this.stateText.text = "Hunting!"
        this.stateText.style.fill = 0xffa07a
        break
      case "attacking":
        this.stateText.text = "ATTACK!"
        this.stateText.style.fill = 0xff0000
        break
      case "stunned":
        this.stateText.text = "Stunned"
        this.stateText.style.fill = 0xffd700
        break
      case "eating":
        this.stateText.text = "Eating!"
        this.stateText.style.fill = 0x00ff00
        break
    }

    this.drawEffects()
  }

  public stun(duration: number = 2000): void {
    this.stunDuration = duration
    this.setState("stunned")
  }

  /** Scale difficulty for round progression. Called between rounds. */
  public setDifficultyForRound(round: number): void {
    this.difficultyMultiplier = 1.0 + (round - 1) * 0.1
    const baseHP = 150
    this.maxHealth = baseHP + (round - 1) * 20
    this.health = this.maxHealth
    this.patrolSpeed = 1.5 * this.difficultyMultiplier
    this.detectionRadius = 200 + (round - 1) * 15
    this.rage = Math.min(100, (round - 1) * 10)
    gameLogger.debug(`Shark difficulty set for round ${round}: ${this.difficultyMultiplier}x speed, ${this.maxHealth} HP, ${this.detectionRadius} detection`)
  }

  public getDifficultyMultiplier(): number {
    return this.difficultyMultiplier
  }

  protected getDistanceTo(x: number, y: number): number {
    const dx = x - this.x
    const dy = y - this.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  public getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - 20,
      y: this.y - 40,
      width: 40,
      height: 80,
    }
  }

  // AI Integration Methods
  public setAIController(controller: SharkAIController): void {
    this.aiController = controller
  }

  public setPersonality(personality: SharkPersonality): void {
    this.personality = personality
    this.updateAIThought(`Feeling ${personality}...`)
  }

  private async pollAIDecision(player: Player | null, gameState?: GameState): Promise<void> {
    if (!this.aiController) {
      return
    }

    this.lastAIDecisionTime = Date.now()

    try {
      const decision = await this.aiController.getDecision({
        sharkState: {
          position: { x: this.x, y: this.y, z: 0 },
          currentState: this.currentState,
          hunger: this.hunger,
          rage: this.rage,
          personality: this.personality,
        },
        playerState: player
          ? {
              position: { x: player.x, y: player.y, z: 0 },
              health: player.health,
              stamina: player.stamina,
              archetype: player.archetype,
              userId: player.userId || "unknown",
            }
          : null,
        gameState: gameState || {},
      })

      if (decision) {
        this.currentAIDecision = decision
        this.updateAIThought(decision.reasoning)
      }
    } catch (error) {
      gameLogger.error("Error polling AI decision:", error)
    }
  }

  private applyAIDecision(player: Player | null): void {
    if (!this.currentAIDecision) {
      return
    }

    const { action, targetPlayerId } = this.currentAIDecision

    switch (action) {
      case "hunt":
        if (player && this.currentState !== "hunting") {
          this.setState("hunting")
          this.currentTargetId = targetPlayerId || null
        }
        break

      case "patrol":
        if (this.currentState !== "patrol") {
          this.setState("patrol")
          this.currentTargetId = null
        }
        break

      case "ambush":
        // Implement ambush behavior - slow movement, strategic positioning
        if (player) {
          this.huntingSpeed = 2 // Slower, more deliberate
          if (this.currentState !== "hunting") {
            this.setState("hunting")
          }
        }
        break

      case "retreat":
        // Move away from player
        if (player) {
          const angle = Math.atan2(this.y - player.y, this.x - player.x)
          this.vx += Math.cos(angle) * this.patrolSpeed * 0.2
          this.vy += Math.sin(angle) * this.patrolSpeed * 0.2
        }
        if (this.currentState !== "patrol") {
          this.setState("patrol")
        }
        break

      case "taunt":
        // Circle around player at medium distance
        if (player && this.currentState !== "hunting") {
          this.setState("hunting")
          this.huntingSpeed = 2.5 // Medium speed for circling
        }
        break
    }

    // Update hunger and rage based on actions
    this.updateInternalState(action)
  }

  private updateInternalState(action: string): void {
    switch (action) {
      case "hunt":
      case "ambush":
        this.hunger = Math.min(100, this.hunger + 2)
        this.rage = Math.min(100, this.rage + 5)
        break
      case "retreat":
        this.hunger = Math.max(0, this.hunger - 5)
        this.rage = Math.max(0, this.rage - 10)
        break
      case "taunt":
        this.rage = Math.min(100, this.rage + 3)
        break
    }
  }

  private updateAIThought(thought: string): void {
    this.aiThoughtText.text = thought

    // Fade out the thought after a few seconds
    setTimeout(() => {
      this.aiThoughtText.alpha = 0.7
    }, 3000)

    setTimeout(() => {
      this.aiThoughtText.alpha = 0.4
    }, 4000)

    setTimeout(() => {
      this.aiThoughtText.text = ""
      this.aiThoughtText.alpha = 1
    }, 5000)
  }

  public getAIState(): {
    hunger: number
    rage: number
    personality: SharkPersonality
    currentTarget: string | null
  } {
    return {
      hunger: this.hunger,
      rage: this.rage,
      personality: this.personality,
      currentTarget: this.currentTargetId,
    }
  }

  // Bait system methods
  public checkForBait(baitZones: Array<{ x: number; y: number; baitPower: number; isActive: () => boolean; getAttractionStrength: (x: number, y: number) => number; getAttractionVector: (x: number, y: number) => { x: number; y: number } }>): void {
    // Don't check for bait if already eating or stunned
    if (this.currentState === "eating" || this.currentState === "stunned") {
      return
    }

    // Find the closest active bait zone
    let closestBait = null
    let maxAttraction = 0

    for (const bait of baitZones) {
      if (!bait.isActive()) {
        continue
      }

      const attraction = bait.getAttractionStrength(this.x, this.y)
      if (attraction > maxAttraction) {
        maxAttraction = attraction
        closestBait = bait
      }
    }

    // If bait is found and strong enough, move toward it
    if (closestBait && maxAttraction > 0.1) {
      const vector = closestBait.getAttractionVector(this.x, this.y)
      const baitSpeed = this.huntingSpeed * (0.5 + maxAttraction * 0.5) // Speed based on attraction

      // Override normal behavior to move toward bait
      this.vx += vector.x * baitSpeed * 0.15
      this.vy += vector.y * baitSpeed * 0.15

      // Check if shark reached the bait
      const dist = this.getDistanceTo(closestBait.x, closestBait.y)
      if (dist < 30) {
        this.startEatingBait(closestBait.x, closestBait.y)
      } else {
        // Update AI thought while pursuing bait
        this.updateAIThought("Mmm... fish!")
      }
    }
  }

  private startEatingBait(x: number, y: number): void {
    this.currentBaitPosition = { x, y }
    this.eatingDuration = 2000 // 2 seconds of eating (vulnerable state)
    this.setState("eating")

    // Reduce hunger while eating
    this.hunger = Math.max(0, this.hunger - 20)
  }

  public isVulnerable(): boolean {
    return this.currentState === "eating"
  }

  public getVulnerabilityMultiplier(): number {
    // Take 2x damage while eating
    return this.isVulnerable() ? 2.0 : 1.0
  }
}
