import { Container, Graphics, Text, TextStyle } from 'pixi.js'

// Character archetype types from docs
export type CharacterType = 'influencer' | 'boomerDad' | 'surferBro' | 'lifeguard' | 'marineBiologist' | 'springBreaker'

// Character stats and abilities
const CHARACTER_STATS = {
  influencer: {
    name: 'The Influencer',
    baseSpeed: 3,
    swimSpeed: 2,
    ability: 'Going Live',
    color: 0xFF6B6B // Hot pink
  },
  boomerDad: {
    name: 'The Boomer Dad',
    baseSpeed: 2,
    swimSpeed: 1.5,
    ability: 'Dad Reflexes',
    color: 0x4169E1 // Royal blue
  },
  surferBro: {
    name: 'The Surfer Bro',
    baseSpeed: 3.5,
    swimSpeed: 4,
    ability: 'Surf Wake',
    color: 0xFFA07A // Warning orange
  },
  lifeguard: {
    name: 'The Lifeguard',
    baseSpeed: 3,
    swimSpeed: 3.5,
    ability: 'Baywatch Run',
    color: 0xFF0000 // Classic red
  },
  marineBiologist: {
    name: 'The Marine Biologist',
    baseSpeed: 2.5,
    swimSpeed: 2,
    ability: 'Bore with Facts',
    color: 0x32CD32 // Lime green
  },
  springBreaker: {
    name: 'The Spring Breaker',
    baseSpeed: 4,
    swimSpeed: 2.5,
    ability: 'YOLO Mode',
    color: 0xFF1493 // Deep pink
  }
}

export class Player {
  public container: Container
  private sprite: Graphics
  private nameText: Text
  private characterType: CharacterType
  private stats: typeof CHARACTER_STATS[CharacterType]
  private currentSpeed: number
  private isInWater: boolean = false
  private abilityActive: boolean = false
  private abilityDuration: number = 0
  
  public x: number
  public y: number
  public vx: number = 0
  public vy: number = 0
  
  // AI-accessible properties
  public health: number = 100
  public stamina: number = 100
  public archetype: string
  public userId: string | null = null

  constructor(x: number, y: number, type: CharacterType = 'influencer', userId?: string) {
    this.x = x
    this.y = y
    this.characterType = type
    this.archetype = type
    this.stats = CHARACTER_STATS[type]
    this.currentSpeed = this.stats.baseSpeed
    this.userId = userId || null

    // Create container
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create player sprite (simple circle with character color)
    this.sprite = new Graphics()
    this.drawCharacter()
    this.container.addChild(this.sprite)

    // Add name text
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xFFFFFF,
      stroke: { color: 0x000000, width: 2 },
      align: 'center'
    })
    
    this.nameText = new Text({ text: this.stats.name, style: textStyle })
    this.nameText.anchor.set(0.5, -1.5)
    this.container.addChild(this.nameText)
  }

  private drawCharacter(): void {
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

    // Add swimming effect if in water
    if (this.isInWater) {
      this.sprite.circle(0, 0, 25)
      this.sprite.stroke({ width: 1, color: 0x4ECDC4, alpha: 0.5 })
      
      // Ripple effect
      for (let i = 0; i < 3; i++) {
        this.sprite.circle(0, 0, 30 + i * 5)
        this.sprite.stroke({ width: 1, color: 0x4ECDC4, alpha: 0.2 - i * 0.05 })
      }
      
      // Drowning indicator at low stamina
      if (this.stamina < 25) {
        // Pulsing red circle
        const pulseAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2
        this.sprite.circle(0, 0, 22)
        this.sprite.stroke({ width: 3, color: 0xFF0000, alpha: pulseAlpha })
        
        // Bubble effects when drowning
        if (this.stamina === 0) {
          for (let i = 0; i < 3; i++) {
            const bubbleY = -30 - i * 10 - (Date.now() * 0.05) % 20
            this.sprite.circle(-5 + i * 5, bubbleY, 3)
            this.sprite.fill({ color: 0xFFFFFF, alpha: 0.6 })
          }
        }
      }
    }

    // Show ability activation
    if (this.abilityActive) {
      this.sprite.star(0, 0, 5, 35, 25, 0)
      this.sprite.fill({ color: 0xFFD700, alpha: 0.3 })
    }
  }

  public update(delta: number, inputX: number, inputY: number, inWater: boolean): void {
    // Update water state
    const wasInWater = this.isInWater
    this.isInWater = inWater
    
    if (wasInWater !== this.isInWater) {
      this.drawCharacter()
    }

    // Update speed based on terrain
    this.currentSpeed = this.isInWater ? this.stats.swimSpeed : this.stats.baseSpeed
    
    // Update stamina based on water/beach and movement
    const isMoving = Math.abs(inputX) > 0.1 || Math.abs(inputY) > 0.1
    
    if (this.isInWater) {
      // In water: stamina depletes
      if (isMoving) {
        this.stamina = Math.max(0, this.stamina - delta * 0.083) // 5 points/second at 60fps
      } else {
        this.stamina = Math.max(0, this.stamina - delta * 0.033) // 2 points/second when stationary
      }
      
      // Drowning damage at 0 stamina
      if (this.stamina === 0) {
        this.takeDamage(delta * 0.083) // 5 damage/second
      }
    } else {
      // On beach: stamina regenerates
      this.stamina = Math.min(100, this.stamina + delta * 0.167) // 10 points/second
    }
    
    // Stamina affects speed (more gradual)
    const staminaSpeedModifier = this.stamina / 100
    if (this.stamina === 0 && this.isInWater) {
      // Drowning: very slow movement
      this.currentSpeed *= 0.25
    } else {
      // Normal stamina-based speed reduction
      this.currentSpeed *= (0.5 + 0.5 * staminaSpeedModifier)
    }

    // Apply special ability speed modifiers
    if (this.characterType === 'lifeguard' && this.abilityActive) {
      this.currentSpeed *= 0.5 // Slow-mo Baywatch run
    } else if (this.characterType === 'springBreaker' && this.abilityActive) {
      this.currentSpeed *= 1.5 // YOLO mode
    }

    // Update velocity with some acceleration
    const acceleration = 0.2
    this.vx += (inputX * this.currentSpeed - this.vx) * acceleration
    this.vy += (inputY * this.currentSpeed - this.vy) * acceleration

    // Apply friction
    this.vx *= 0.9
    this.vy *= 0.9

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
  }

  public activateAbility(): void {
    if (this.abilityActive) return

    this.abilityActive = true
    this.abilityDuration = 3000 // 3 seconds

    // Character-specific ability effects
    switch (this.characterType) {
      case 'influencer':
        // Going Live - creates viewer shields
        console.log('Going Live! Viewer shields activated')
        break
      case 'boomerDad':
        // Dad Reflexes - can throw other players
        console.log('Dad Reflexes activated!')
        break
      case 'surferBro':
        // Can surf on shark's wake
        console.log('Catching the wake!')
        break
      case 'lifeguard':
        // Slow-mo Baywatch run
        console.log('Baywatch mode activated!')
        break
      case 'marineBiologist':
        // Bore shark with facts
        console.log('Actually, did you know that sharks...')
        break
      case 'springBreaker':
        // YOLO mode
        console.log('YOLO MODE ACTIVATED!')
        break
    }

    this.drawCharacter()
  }

  private deactivateAbility(): void {
    this.abilityActive = false
    this.drawCharacter()
  }

  public getPosition(): { x: number, y: number } {
    return { x: this.x, y: this.y }
  }

  public getBounds(): { x: number, y: number, width: number, height: number } {
    return {
      x: this.x - 20,
      y: this.y - 20,
      width: 40,
      height: 40
    }
  }
  
  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount)
    if (this.health <= 0) {
      console.log('Player eliminated!')
    }
  }
  
  public getStats(): { health: number; stamina: number } {
    return {
      health: this.health,
      stamina: this.stamina
    }
  }
}