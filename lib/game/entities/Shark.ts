import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Player } from './Player'
import { SharkAIController } from '../ai/SharkAIController'
import { SharkPersonality } from '@/convex/types'

// Shark AI states
export type SharkState = 'patrol' | 'hunting' | 'attacking' | 'stunned'

// AI Decision type
export type AIDecision = {
  action: 'hunt' | 'patrol' | 'ambush' | 'retreat' | 'taunt'
  targetPlayerId?: string
  reasoning: string
  confidence: number
  personalityInfluence: string
}

export class Shark {
  public container: Container
  private sprite: Graphics
  private stateText: Text
  private currentState: SharkState = 'patrol'
  
  public x: number
  public y: number
  public vx: number = 0
  public vy: number = 0
  private rotation: number = 0
  
  // AI parameters
  private patrolSpeed: number = 1.5
  private huntingSpeed: number = 3
  private attackSpeed: number = 5
  private detectionRadius: number = 200
  private attackRadius: number = 50
  
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
  private personality: SharkPersonality = 'methodical'
  private hunger: number = 50
  private rage: number = 0

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    // Create container
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create shark sprite
    this.sprite = new Graphics()
    this.drawShark()
    this.container.addChild(this.sprite)

    // Add state indicator text
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xFF0000,
      stroke: { color: 0xFFFFFF, width: 2 },
      align: 'center'
    })
    
    this.stateText = new Text({ text: 'Patrolling', style: textStyle })
    this.stateText.anchor.set(0.5, -2)
    this.container.addChild(this.stateText)
    
    // Add AI thought bubble
    const thoughtStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0x4ECDC4,
      stroke: { color: 0x1A252F, width: 1 },
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 200
    })
    
    this.aiThoughtText = new Text({ text: '', style: thoughtStyle })
    this.aiThoughtText.anchor.set(0.5, 1.5)
    this.aiThoughtText.y = -60
    this.container.addChild(this.aiThoughtText)
  }

  private drawShark(): void {
    this.sprite.clear()
    
    // Draw shark body (elongated triangle)
    this.sprite.moveTo(0, -40)
    this.sprite.lineTo(20, 30)
    this.sprite.lineTo(0, 20)
    this.sprite.lineTo(-20, 30)
    this.sprite.closePath()
    this.sprite.fill(0x2C3E50)
    this.sprite.stroke({ width: 2, color: 0x1A252F })

    // Draw dorsal fin
    this.sprite.moveTo(0, -10)
    this.sprite.lineTo(15, 5)
    this.sprite.lineTo(-15, 5)
    this.sprite.closePath()
    this.sprite.fill(0x34495E)

    // Draw tail fin
    this.sprite.moveTo(0, 20)
    this.sprite.lineTo(25, 40)
    this.sprite.lineTo(0, 30)
    this.sprite.lineTo(-25, 40)
    this.sprite.closePath()
    this.sprite.fill(0x2C3E50)
    this.sprite.stroke({ width: 1, color: 0x1A252F })

    // Draw eyes based on state
    const eyeColor = this.currentState === 'attacking' ? 0xFF0000 : 0x000000
    this.sprite.circle(-10, -20, 3)
    this.sprite.circle(10, -20, 3)
    this.sprite.fill(eyeColor)

    // Draw teeth when attacking
    if (this.currentState === 'attacking' || this.currentState === 'hunting') {
      for (let i = -3; i <= 3; i++) {
        this.sprite.poly([
          i * 4 - 2, -35,
          i * 4, -30,
          i * 4 + 2, -35
        ])
        this.sprite.fill(0xFFFFFF)
      }
    }

    // Add detection radius visualization (debug)
    if (this.currentState === 'patrol') {
      this.sprite.circle(0, 0, this.detectionRadius)
      this.sprite.stroke({ width: 1, color: 0x4ECDC4, alpha: 0.1 })
    }

    // Stunned effect
    if (this.currentState === 'stunned') {
      // Draw stars around head
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + Date.now() * 0.001
        const starX = Math.cos(angle) * 30
        const starY = Math.sin(angle) * 30 - 20
        this.sprite.star(starX, starY, 5, 8, 4)
        this.sprite.fill(0xFFD700)
      }
    }
  }

  public update(delta: number, player: Player | null, gameState?: any): void {
    // Poll AI for decisions
    if (this.aiController && Date.now() - this.lastAIDecisionTime > this.aiDecisionInterval) {
      this.pollAIDecision(player, gameState)
    }
    // Update stun duration
    if (this.stunDuration > 0) {
      this.stunDuration -= delta
      if (this.stunDuration <= 0) {
        this.setState('patrol')
      }
    }

    // Apply AI decision to state machine
    if (this.currentAIDecision && this.currentState !== 'stunned') {
      this.applyAIDecision(player)
    }
    
    // State machine logic
    switch (this.currentState) {
      case 'patrol':
        this.patrolBehavior(delta, player)
        break
      case 'hunting':
        this.huntingBehavior(delta, player)
        break
      case 'attacking':
        this.attackingBehavior(delta, player)
        break
      case 'stunned':
        this.stunnedBehavior(delta)
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
    
    if (this.stateTimer > 2000) { // Change direction every 2 seconds
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
        this.setState('hunting')
      }
    }
  }

  private huntingBehavior(delta: number, player: Player | null): void {
    if (!player) {
      this.setState('patrol')
      return
    }

    const dist = this.getDistanceTo(player.x, player.y)
    
    // If player escaped, return to patrol
    if (dist > this.detectionRadius * 1.5) {
      this.setState('patrol')
      return
    }

    // If close enough, attack
    if (dist < this.attackRadius) {
      this.setState('attacking')
      return
    }

    // Chase player
    const angle = Math.atan2(player.y - this.y, player.x - this.x)
    this.vx += Math.cos(angle) * this.huntingSpeed * 0.1
    this.vy += Math.sin(angle) * this.huntingSpeed * 0.1
  }

  private attackingBehavior(delta: number, player: Player | null): void {
    if (!player) {
      this.setState('patrol')
      return
    }

    const dist = this.getDistanceTo(player.x, player.y)
    
    // If player escaped attack range, go back to hunting
    if (dist > this.attackRadius * 1.5) {
      this.setState('hunting')
      return
    }

    // Lunge at player
    const angle = Math.atan2(player.y - this.y, player.x - this.x)
    this.vx += Math.cos(angle) * this.attackSpeed * 0.15
    this.vy += Math.sin(angle) * this.attackSpeed * 0.15

    // Check for collision
    if (dist < 30) {
      console.log('CHOMP! Player caught!')
      // In a real game, this would trigger death/respawn
    }
  }

  private stunnedBehavior(delta: number): void {
    // Drift randomly while stunned
    this.vx += (Math.random() - 0.5) * 0.5
    this.vy += (Math.random() - 0.5) * 0.5
  }

  private setState(newState: SharkState): void {
    this.currentState = newState
    this.stateTimer = 0
    
    // Update state text
    switch (newState) {
      case 'patrol':
        this.stateText.text = 'Patrolling'
        this.stateText.style.fill = 0x4ECDC4
        break
      case 'hunting':
        this.stateText.text = 'Hunting!'
        this.stateText.style.fill = 0xFFA07A
        break
      case 'attacking':
        this.stateText.text = 'ATTACK!'
        this.stateText.style.fill = 0xFF0000
        break
      case 'stunned':
        this.stateText.text = 'Stunned'
        this.stateText.style.fill = 0xFFD700
        break
    }
    
    this.drawShark()
  }

  public stun(duration: number = 2000): void {
    this.stunDuration = duration
    this.setState('stunned')
  }

  private getDistanceTo(x: number, y: number): number {
    const dx = x - this.x
    const dy = y - this.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  public getPosition(): { x: number, y: number } {
    return { x: this.x, y: this.y }
  }

  public getBounds(): { x: number, y: number, width: number, height: number } {
    return {
      x: this.x - 20,
      y: this.y - 40,
      width: 40,
      height: 80
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
  
  private async pollAIDecision(player: Player | null, gameState?: any): Promise<void> {
    if (!this.aiController) return
    
    this.lastAIDecisionTime = Date.now()
    
    try {
      const decision = await this.aiController.getDecision({
        sharkState: {
          position: { x: this.x, y: this.y, z: 0 },
          currentState: this.currentState,
          hunger: this.hunger,
          rage: this.rage,
          personality: this.personality
        },
        playerState: player ? {
          position: { x: player.x, y: player.y, z: 0 },
          health: player.health,
          stamina: player.stamina,
          archetype: player.archetype,
          userId: player.userId || 'unknown'
        } : null,
        gameState: gameState || {}
      })
      
      if (decision) {
        this.currentAIDecision = decision
        this.updateAIThought(decision.reasoning)
      }
    } catch (error) {
      console.error('Error polling AI decision:', error)
    }
  }
  
  private applyAIDecision(player: Player | null): void {
    if (!this.currentAIDecision) return
    
    const { action, targetPlayerId } = this.currentAIDecision
    
    switch (action) {
      case 'hunt':
        if (player && this.currentState !== 'hunting') {
          this.setState('hunting')
          this.currentTargetId = targetPlayerId || null
        }
        break
        
      case 'patrol':
        if (this.currentState !== 'patrol') {
          this.setState('patrol')
          this.currentTargetId = null
        }
        break
        
      case 'ambush':
        // Implement ambush behavior - slow movement, strategic positioning
        if (player) {
          this.huntingSpeed = 2 // Slower, more deliberate
          if (this.currentState !== 'hunting') {
            this.setState('hunting')
          }
        }
        break
        
      case 'retreat':
        // Move away from player
        if (player) {
          const angle = Math.atan2(this.y - player.y, this.x - player.x)
          this.vx += Math.cos(angle) * this.patrolSpeed * 0.2
          this.vy += Math.sin(angle) * this.patrolSpeed * 0.2
        }
        if (this.currentState !== 'patrol') {
          this.setState('patrol')
        }
        break
        
      case 'taunt':
        // Circle around player at medium distance
        if (player && this.currentState !== 'hunting') {
          this.setState('hunting')
          this.huntingSpeed = 2.5 // Medium speed for circling
        }
        break
    }
    
    // Update hunger and rage based on actions
    this.updateInternalState(action)
  }
  
  private updateInternalState(action: string): void {
    switch (action) {
      case 'hunt':
      case 'ambush':
        this.hunger = Math.min(100, this.hunger + 2)
        this.rage = Math.min(100, this.rage + 5)
        break
      case 'retreat':
        this.hunger = Math.max(0, this.hunger - 5)
        this.rage = Math.max(0, this.rage - 10)
        break
      case 'taunt':
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
      this.aiThoughtText.text = ''
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
      currentTarget: this.currentTargetId
    }
  }
}