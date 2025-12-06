import { Container, Graphics, Sprite, Text, TextStyle } from "pixi.js"
import { ViewerShield } from "../effects/ViewerShield"
import { assetLoader } from "../AssetLoader"

// Character archetype types from docs
export type CharacterType =
  | "influencer"
  | "boomerDad"
  | "surferBro"
  | "lifeguard"
  | "marineBiologist"
  | "springBreaker"

// Ability effect types that GameCanvas can react to
export type AbilityEffect =
  | { type: "none" }
  | { type: "stun_shark"; duration: number; fact: string }
  | { type: "shield_active"; shields: number }
  | { type: "invincible" }
  | { type: "speed_boost"; multiplier: number }
  | { type: "drunk_controls" }
  | { type: "throw_item"; item: string; damage: number }

/** Player gameplay constants - extracted for maintainability */
export const PLAYER_CONSTANTS = {
  STAMINA: {
    MAX: 100,
    DRAIN_SWIMMING_MOVING: 5,     // points per second
    DRAIN_SWIMMING_IDLE: 2,       // points per second
    REGEN_ON_BEACH: 10,           // points per second
    DROWNING_DAMAGE: 5,           // damage per second at 0 stamina
    LOW_WARNING_THRESHOLD: 25,    // show warning below this
  },
  SPEED: {
    DROWNING_MULTIPLIER: 0.25,
    LOW_STAMINA_MIN: 0.5,
    LIFEGUARD_SLOWMO: 0.5,
    SPRING_BREAK_BOOST: 1.5,
    SURFER_BRO_SHARK_BOOST: 2.0,
    SURFER_BRO_PROXIMITY: 250,    // distance for boost activation
  },
  MOVEMENT: {
    ACCELERATION: 0.2,
    FRICTION: 0.9,
  },
  ABILITY: {
    COOLDOWN_MS: 10000,
    DEFAULT_DURATION_MS: 3000,
    INFLUENCER_DURATION_MS: 10000,
    BOOMER_DAD_DURATION_MS: 500,
    SURFER_BRO_DURATION_MS: 5000,
    LIFEGUARD_DURATION_MS: 3000,
    MARINE_BIO_DURATION_MS: 2500,
    SPRING_BREAK_DURATION_MS: 3000,
  },
} as const

// Shark facts for Marine Biologist
const SHARK_FACTS = [
  "Sharks have been around for 450 million years!",
  "A shark can detect one drop of blood in a million drops of water!",
  "Sharks don't have bones - their skeleton is made of cartilage!",
  "Great whites can't swim backwards!",
  "Sharks have electroreceptors to sense heartbeats!",
  "A shark's teeth are replaced every 8-10 days!",
  "Whale sharks are the largest fish in the ocean!",
  "Sharks sleep with their eyes open!",
]

// Character stats and abilities
const CHARACTER_STATS = {
  influencer: {
    name: "The Influencer",
    baseSpeed: 3,
    swimSpeed: 2,
    ability: "Going Live",
    color: 0xff6b6b, // Hot pink
    spritePath: "/assets/sprites/player/influencer.png",
  },
  boomerDad: {
    name: "The Boomer Dad",
    baseSpeed: 2,
    swimSpeed: 1.5,
    ability: "Dad Reflexes",
    color: 0x4169e1, // Royal blue
    spritePath: "/assets/sprites/player/boomer-dad.png",
  },
  surferBro: {
    name: "The Surfer Bro",
    baseSpeed: 3.5,
    swimSpeed: 4,
    ability: "Surf Wake",
    color: 0xffa07a, // Warning orange
    spritePath: "/assets/sprites/player/surfer-bro.png",
  },
  lifeguard: {
    name: "The Lifeguard",
    baseSpeed: 3,
    swimSpeed: 3.5,
    ability: "Baywatch Run",
    color: 0xff0000, // Classic red
    spritePath: "/assets/sprites/player/lifeguard.png",
  },
  marineBiologist: {
    name: "The Marine Biologist",
    baseSpeed: 2.5,
    swimSpeed: 2,
    ability: "Bore with Facts",
    color: 0x32cd32, // Lime green
    spritePath: "/assets/sprites/player/marine-biologist.png",
  },
  springBreaker: {
    name: "The Spring Breaker",
    baseSpeed: 4,
    swimSpeed: 2.5,
    ability: "YOLO Mode",
    color: 0xff1493, // Deep pink
    spritePath: "/assets/sprites/player/spring-breaker.png",
  },
}

export class Player {
  public container: Container
  private sprite: Sprite | Graphics
  private effectsGraphics: Graphics
  private nameText: Text
  private characterType: CharacterType
  private stats: (typeof CHARACTER_STATS)[CharacterType]
  private currentSpeed: number
  public isInWater: boolean = false
  private abilityActive: boolean = false
  private abilityDuration: number = 0
  private abilityCooldown: number = 0
  private viewerShield: ViewerShield | null = null

  public x: number
  public y: number
  public vx: number = 0
  public vy: number = 0

  // AI-accessible properties
  public health: number = 100
  public stamina: number = 100
  public archetype: string
  public userId: string | null = null
  public id: string
  public name: string

  // Ability effect state
  private pendingAbilityEffect: AbilityEffect = { type: "none" }
  private isInvincible: boolean = false
  private hasDrunkControls: boolean = false
  private sharkProximitySpeedBoost: boolean = false
  private currentFact: string = ""

  constructor(x: number, y: number, type: CharacterType = "influencer", userId?: string) {
    this.x = x
    this.y = y
    this.characterType = type
    this.archetype = type
    this.stats = CHARACTER_STATS[type]
    this.currentSpeed = this.stats.baseSpeed
    this.userId = userId || null
    this.id = userId || `player_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    this.name = this.stats.name

    // Create container
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create player sprite - try to use texture first, fallback to graphics
    const texture = assetLoader.getTexture(this.stats.spritePath)
    if (texture) {
      this.sprite = new Sprite(texture)
      this.sprite.anchor.set(0.5)
      this.sprite.scale.set(0.8) // Scale to appropriate size
    } else {
      // Fallback to graphics if texture not loaded
      this.sprite = new Graphics()
      this.drawCharacterFallback()
    }
    this.container.addChild(this.sprite)

    // Create separate graphics layer for effects (water ripples, ability glow, etc.)
    this.effectsGraphics = new Graphics()
    this.container.addChild(this.effectsGraphics)

    // Add name text
    const textStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 12,
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 2 },
      align: "center",
    })

    this.nameText = new Text({ text: this.stats.name, style: textStyle })
    this.nameText.anchor.set(0.5, -1.5)
    this.container.addChild(this.nameText)
  }

  private drawCharacterFallback(): void {
    if (!(this.sprite instanceof Graphics)) return

    this.sprite.clear()

    // Draw main body circle
    this.sprite.circle(0, 0, 20)
    this.sprite.fill(this.stats.color)
    this.sprite.stroke({ width: 2, color: 0x000000 })

    // Draw simple face
    this.sprite.circle(-7, -5, 3)
    this.sprite.circle(7, -5, 3)
    this.sprite.fill(0x000000)

    // Draw direction indicator
    this.sprite.moveTo(0, -20)
    this.sprite.lineTo(10, -30)
    this.sprite.lineTo(0, -25)
    this.sprite.lineTo(-10, -30)
    this.sprite.closePath()
    this.sprite.fill(this.stats.color)
    this.sprite.stroke({ width: 1, color: 0x000000 })
  }

  private drawEffects(): void {
    this.effectsGraphics.clear()

    // Add swimming effect if in water
    if (this.isInWater) {
      this.effectsGraphics.circle(0, 0, 25)
      this.effectsGraphics.stroke({ width: 1, color: 0x4ecdc4, alpha: 0.5 })

      // Ripple effect
      for (let i = 0; i < 3; i++) {
        this.effectsGraphics.circle(0, 0, 30 + i * 5)
        this.effectsGraphics.stroke({ width: 1, color: 0x4ecdc4, alpha: 0.2 - i * 0.05 })
      }

      // Drowning indicator at low stamina
      if (this.stamina < PLAYER_CONSTANTS.STAMINA.LOW_WARNING_THRESHOLD) {
        // Pulsing red circle
        const pulseAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2
        this.effectsGraphics.circle(0, 0, 22)
        this.effectsGraphics.stroke({ width: 3, color: 0xff0000, alpha: pulseAlpha })

        // Bubble effects when drowning
        if (this.stamina === 0) {
          for (let i = 0; i < 3; i++) {
            const bubbleY = -30 - i * 10 - ((Date.now() * 0.05) % 20)
            this.effectsGraphics.circle(-5 + i * 5, bubbleY, 3)
            this.effectsGraphics.fill({ color: 0xffffff, alpha: 0.6 })
          }
        }
      }
    }

    // Invincibility effect (golden glow)
    if (this.isInvincible) {
      const pulseSize = 30 + Math.sin(Date.now() * 0.01) * 5
      this.effectsGraphics.circle(0, 0, pulseSize)
      this.effectsGraphics.fill({ color: 0xffd700, alpha: 0.3 })
      this.effectsGraphics.circle(0, 0, pulseSize + 5)
      this.effectsGraphics.stroke({ width: 3, color: 0xffd700, alpha: 0.6 })
    }

    // Drunk controls effect (wobbly purple aura)
    if (this.hasDrunkControls) {
      const wobble = Math.sin(Date.now() * 0.02) * 10
      this.effectsGraphics.ellipse(wobble, 0, 35, 25)
      this.effectsGraphics.fill({ color: 0xff1493, alpha: 0.2 })
      // Add dizzy stars
      for (let i = 0; i < 3; i++) {
        const angle = (Date.now() * 0.005 + i * 2.1) % (Math.PI * 2)
        const starX = Math.cos(angle) * 35
        const starY = Math.sin(angle) * 20 - 30
        this.effectsGraphics.star(starX, starY, 5, 8, 4)
        this.effectsGraphics.fill({ color: 0xffff00, alpha: 0.8 })
      }
    }

    // Speed boost effect (blue streaks)
    if (this.sharkProximitySpeedBoost && this.abilityActive) {
      for (let i = 0; i < 3; i++) {
        const offset = (Date.now() * 0.1 + i * 10) % 30
        this.effectsGraphics.moveTo(-15 + i * 10, 20 + offset)
        this.effectsGraphics.lineTo(-15 + i * 10, 35 + offset)
        this.effectsGraphics.stroke({ width: 3, color: 0x00bfff, alpha: 0.6 - offset * 0.02 })
      }
    }

    // Show general ability activation (star burst)
    if (this.abilityActive && !this.isInvincible && !this.hasDrunkControls) {
      this.effectsGraphics.star(0, 0, 5, 35, 25, 0)
      this.effectsGraphics.fill({ color: 0xffd700, alpha: 0.3 })
    }
  }

  public update(delta: number, inputX: number, inputY: number, inWater: boolean, sharkDistance?: number): void {
    // Update water state
    this.isInWater = inWater

    // Update visual effects
    this.drawEffects()

    // Process drunk controls - reverse and add wobble
    let processedInputX = inputX
    let processedInputY = inputY
    if (this.hasDrunkControls) {
      // Reverse controls
      processedInputX = -inputX
      processedInputY = -inputY
      // Add random wobble
      const wobbleAmount = 0.3
      processedInputX += (Math.random() - 0.5) * wobbleAmount
      processedInputY += (Math.random() - 0.5) * wobbleAmount
    }

    // Update speed based on terrain
    this.currentSpeed = this.isInWater ? this.stats.swimSpeed : this.stats.baseSpeed

    // Update stamina based on water/beach and movement
    const isMoving = Math.abs(processedInputX) > 0.1 || Math.abs(processedInputY) > 0.1

    if (this.isInWater) {
      // In water: stamina depletes
      if (isMoving) {
        this.stamina = Math.max(0, this.stamina - delta * (PLAYER_CONSTANTS.STAMINA.DRAIN_SWIMMING_MOVING / 60))
      } else {
        this.stamina = Math.max(0, this.stamina - delta * (PLAYER_CONSTANTS.STAMINA.DRAIN_SWIMMING_IDLE / 60))
      }

      // Drowning damage at 0 stamina
      if (this.stamina === 0) {
        this.takeDamage(delta * (PLAYER_CONSTANTS.STAMINA.DROWNING_DAMAGE / 60))
      }
    } else {
      // On beach: stamina regenerates
      this.stamina = Math.min(PLAYER_CONSTANTS.STAMINA.MAX, this.stamina + delta * (PLAYER_CONSTANTS.STAMINA.REGEN_ON_BEACH / 60))
    }

    // Stamina affects speed (more gradual)
    const staminaSpeedModifier = this.stamina / PLAYER_CONSTANTS.STAMINA.MAX
    if (this.stamina === 0 && this.isInWater) {
      // Drowning: very slow movement
      this.currentSpeed *= PLAYER_CONSTANTS.SPEED.DROWNING_MULTIPLIER
    } else {
      // Normal stamina-based speed reduction
      this.currentSpeed *= PLAYER_CONSTANTS.SPEED.LOW_STAMINA_MIN + (1 - PLAYER_CONSTANTS.SPEED.LOW_STAMINA_MIN) * staminaSpeedModifier
    }

    // Apply special ability speed modifiers
    if (this.characterType === "lifeguard" && this.abilityActive) {
      this.currentSpeed *= PLAYER_CONSTANTS.SPEED.LIFEGUARD_SLOWMO
    } else if (this.characterType === "springBreaker" && this.abilityActive) {
      this.currentSpeed *= PLAYER_CONSTANTS.SPEED.SPRING_BREAK_BOOST
    } else if (this.characterType === "surferBro" && this.sharkProximitySpeedBoost && sharkDistance !== undefined) {
      // Surfer gets speed boost when shark is nearby (riding the danger!)
      if (sharkDistance < PLAYER_CONSTANTS.SPEED.SURFER_BRO_PROXIMITY) {
        this.currentSpeed *= PLAYER_CONSTANTS.SPEED.SURFER_BRO_SHARK_BOOST
      }
    }

    // Update velocity with some acceleration
    this.vx += (processedInputX * this.currentSpeed - this.vx) * PLAYER_CONSTANTS.MOVEMENT.ACCELERATION
    this.vy += (processedInputY * this.currentSpeed - this.vy) * PLAYER_CONSTANTS.MOVEMENT.ACCELERATION

    // Apply friction
    this.vx *= PLAYER_CONSTANTS.MOVEMENT.FRICTION
    this.vy *= PLAYER_CONSTANTS.MOVEMENT.FRICTION

    // Update position
    this.x += this.vx
    this.y += this.vy

    // Update container position
    this.container.x = this.x
    this.container.y = this.y

    // Rotate based on movement direction
    if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
      this.container.rotation = Math.atan2(this.vy, this.vx) + Math.PI / 2
    }

    // Update ability duration
    if (this.abilityActive) {
      this.abilityDuration -= delta
      if (this.abilityDuration <= 0) {
        this.deactivateAbility()
      }
    }

    // Update ability cooldown
    if (this.abilityCooldown > 0) {
      this.abilityCooldown -= delta
    }

    // Update viewer shield
    if (this.viewerShield) {
      this.viewerShield.update(delta)
    }
  }

  public activateAbility(): void {
    // Check if ability is on cooldown
    if (this.abilityCooldown > 0) {
      return
    }

    // Check if ability is already active (except for some abilities)
    if (this.abilityActive && this.characterType !== "marineBiologist") {
      return
    }

    this.abilityActive = true
    this.abilityDuration = PLAYER_CONSTANTS.ABILITY.DEFAULT_DURATION_MS
    this.abilityCooldown = PLAYER_CONSTANTS.ABILITY.COOLDOWN_MS

    // Character-specific ability effects
    switch (this.characterType) {
      case "influencer":
        // Going Live - creates viewer shields that block attacks
        if (!this.viewerShield) {
          this.viewerShield = new ViewerShield()
          this.container.addChild(this.viewerShield.getContainer())
        }
        this.pendingAbilityEffect = {
          type: "shield_active",
          shields: this.viewerShield.getActiveShields()
        }
        this.abilityDuration = PLAYER_CONSTANTS.ABILITY.INFLUENCER_DURATION_MS
        break

      case "boomerDad":
        // Dad Reflexes - throw items at shark (stuns for 1 sec)
        // Creates a throwable projectile toward shark direction
        this.pendingAbilityEffect = {
          type: "stun_shark",
          duration: 1000,
          fact: "GET OFF MY BEACH!"
        }
        this.abilityDuration = PLAYER_CONSTANTS.ABILITY.BOOMER_DAD_DURATION_MS
        break

      case "surferBro":
        // Surf Wake - speed boost when shark is nearby
        this.sharkProximitySpeedBoost = true
        this.pendingAbilityEffect = { type: "speed_boost", multiplier: PLAYER_CONSTANTS.SPEED.SURFER_BRO_SHARK_BOOST }
        this.abilityDuration = PLAYER_CONSTANTS.ABILITY.SURFER_BRO_DURATION_MS
        break

      case "lifeguard":
        // Baywatch Run - invincible during slow-mo
        this.isInvincible = true
        this.pendingAbilityEffect = { type: "invincible" }
        this.abilityDuration = PLAYER_CONSTANTS.ABILITY.LIFEGUARD_DURATION_MS
        break

      case "marineBiologist":
        // Bore with Facts - stun shark with educational content
        this.currentFact = SHARK_FACTS[Math.floor(Math.random() * SHARK_FACTS.length)] ?? "Sharks are fascinating creatures!"
        this.pendingAbilityEffect = {
          type: "stun_shark",
          duration: PLAYER_CONSTANTS.ABILITY.MARINE_BIO_DURATION_MS,
          fact: this.currentFact
        }
        this.abilityDuration = PLAYER_CONSTANTS.ABILITY.MARINE_BIO_DURATION_MS
        break

      case "springBreaker":
        // YOLO Mode - invincible but controls are drunk/reversed
        this.isInvincible = true
        this.hasDrunkControls = true
        this.pendingAbilityEffect = { type: "drunk_controls" }
        this.abilityDuration = PLAYER_CONSTANTS.ABILITY.SPRING_BREAK_DURATION_MS
        break
    }

    this.drawEffects()
  }

  private deactivateAbility(): void {
    this.abilityActive = false
    this.isInvincible = false
    this.hasDrunkControls = false
    this.sharkProximitySpeedBoost = false
    this.pendingAbilityEffect = { type: "none" }

    // Remove viewer shield visuals when ability ends
    if (this.characterType === "influencer" && this.viewerShield) {
      this.container.removeChild(this.viewerShield.getContainer())
      this.viewerShield = null
    }

    this.drawEffects()
  }

  // Called by GameCanvas to get and clear pending ability effects
  public consumeAbilityEffect(): AbilityEffect {
    const effect = this.pendingAbilityEffect
    // Only consume one-time effects like stun_shark
    if (effect.type === "stun_shark") {
      this.pendingAbilityEffect = { type: "none" }
    }
    return effect
  }

  // Check if player is currently invincible
  public isCurrentlyInvincible(): boolean {
    return this.isInvincible
  }

  // Check if player has drunk controls active
  public hasDrunkControlsActive(): boolean {
    return this.hasDrunkControls
  }

  // Get current shark fact (for displaying)
  public getCurrentFact(): string {
    return this.currentFact
  }

  // Check if player has active viewer shield
  public hasActiveShield(): boolean {
    return this.viewerShield !== null && this.viewerShield.isActive()
  }

  // Try to absorb damage with shield, returns true if absorbed
  public tryAbsorbWithShield(): boolean {
    if (this.viewerShield && this.viewerShield.absorbHit()) {
      return true
    }
    return false
  }

  // Get ability cooldown percentage (0-1)
  public getAbilityCooldownPercent(): number {
    return this.abilityCooldown / PLAYER_CONSTANTS.ABILITY.COOLDOWN_MS
  }

  // Check if ability is ready
  public isAbilityReady(): boolean {
    return this.abilityCooldown <= 0
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  public getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - 20,
      y: this.y - 20,
      width: 40,
      height: 40,
    }
  }

  public takeDamage(amount: number): boolean {
    // Check if invincible
    if (this.isInvincible) {
      return false // Damage blocked by invincibility
    }

    // Check if shield can absorb
    if (this.tryAbsorbWithShield()) {
      return false // Damage blocked by shield
    }

    this.health = Math.max(0, this.health - amount)
    if (this.health <= 0) {
      console.log("Player eliminated!")
    }
    return true // Damage was applied
  }

  public getStats(): { health: number; stamina: number } {
    return {
      health: this.health,
      stamina: this.stamina,
    }
  }
}
