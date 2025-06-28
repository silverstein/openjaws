import { Container, Graphics, Text } from 'pixi.js'

export interface Objective {
  id: string
  type: 'selfie' | 'sandcastle' | 'dance' | 'sunscreen'
  title: string
  description: string
  points: number
  progress: number
  required: number
  completed: boolean
}

export class ObjectiveSystem {
  private container: Container
  private currentObjective: Objective | null = null
  private score: number = 0
  private scoreText: Text
  private objectiveText: Text
  private progressBar: Graphics
  
  constructor() {
    this.container = new Container()
    
    // Score display - positioned at bottom left to avoid overlap
    this.scoreText = new Text({
      text: 'Score: 0',
      style: {
        fontSize: 24,
        fill: 0xFFFFFF,
        fontWeight: 'bold',
        dropShadow: true,
        dropShadowDistance: 2
      }
    })
    this.scoreText.x = 20
    this.scoreText.y = window.innerHeight - 180
    this.container.addChild(this.scoreText)
    
    // Objective display
    this.objectiveText = new Text({
      text: '',
      style: {
        fontSize: 18,
        fill: 0xFFD700,
        fontWeight: 'bold',
        dropShadow: true,
        dropShadowDistance: 2
      }
    })
    this.objectiveText.x = 20
    this.objectiveText.y = window.innerHeight - 150
    this.container.addChild(this.objectiveText)
    
    // Progress bar
    this.progressBar = new Graphics()
    this.progressBar.x = 20
    this.progressBar.y = window.innerHeight - 120
    this.container.addChild(this.progressBar)
    
    // Start with selfie objective
    this.setObjective({
      id: 'selfie_1',
      type: 'selfie',
      title: 'Viral Moment!',
      description: 'Take a selfie with the shark (Press F when near)',
      points: 100,
      progress: 0,
      required: 1,
      completed: false
    })
  }
  
  public getContainer(): Container {
    return this.container
  }
  
  public setObjective(objective: Objective): void {
    this.currentObjective = objective
    this.updateDisplay()
  }
  
  public getCurrentObjective(): Objective | null {
    return this.currentObjective
  }
  
  public checkSelfieCondition(playerX: number, playerY: number, sharkX: number, sharkY: number): boolean {
    if (!this.currentObjective || this.currentObjective.type !== 'selfie') return false
    
    // Check if player is close enough to shark for selfie
    const distance = Math.sqrt(
      Math.pow(playerX - sharkX, 2) + 
      Math.pow(playerY - sharkY, 2)
    )
    
    return distance < 150 // Must be within 150 pixels
  }
  
  public attemptSelfie(playerX: number, playerY: number, sharkX: number, sharkY: number): boolean {
    if (!this.checkSelfieCondition(playerX, playerY, sharkX, sharkY)) {
      return false
    }
    
    if (this.currentObjective && !this.currentObjective.completed) {
      this.currentObjective.progress = 1
      this.currentObjective.completed = true
      this.score += this.currentObjective.points
      this.updateDisplay()
      
      // Create success effect
      const successText = new Text({
        text: '📸 PERFECT SHOT! +' + this.currentObjective.points,
        style: {
          fontSize: 30,
          fill: 0x00FF00,
          fontWeight: 'bold',
          dropShadow: true,
          dropShadowDistance: 3
        }
      })
      successText.x = playerX - 100
      successText.y = playerY - 80
      this.container.addChild(successText)
      
      // Animate and remove
      let alpha = 1
      const fadeOut = setInterval(() => {
        alpha -= 0.02
        successText.alpha = alpha
        successText.y -= 1
        if (alpha <= 0) {
          this.container.removeChild(successText)
          clearInterval(fadeOut)
        }
      }, 16)
      
      // Set next objective after delay
      setTimeout(() => {
        this.setObjective({
          id: 'survive_1',
          type: 'selfie',
          title: 'Survive the Consequences!',
          description: 'That made the shark angry! Survive 30 seconds',
          points: 200,
          progress: 0,
          required: 30,
          completed: false
        })
      }, 2000)
      
      return true
    }
    
    return false
  }
  
  public updateTimer(delta: number): void {
    if (this.currentObjective && 
        this.currentObjective.id === 'survive_1' && 
        !this.currentObjective.completed) {
      // Delta is in milliseconds at 60fps, so divide by 1000 for seconds
      this.currentObjective.progress += delta / 60
      
      if (this.currentObjective.progress >= this.currentObjective.required) {
        this.currentObjective.completed = true
        this.score += this.currentObjective.points
        this.updateDisplay()
        
        // Show completion message
        const completeText = new Text({
          text: '🎉 SURVIVED! +' + this.currentObjective.points,
          style: {
            fontSize: 30,
            fill: 0x00FF00,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowDistance: 3
          }
        })
        completeText.x = window.innerWidth / 2 - 150
        completeText.y = window.innerHeight / 2
        this.container.addChild(completeText)
        
        // Remove after animation
        setTimeout(() => {
          this.container.removeChild(completeText)
          
          // Set next objective
          this.setObjective({
            id: 'selfie_2',
            type: 'selfie',
            title: 'Double Dare!',
            description: 'Take ANOTHER selfie with the angry shark! (Press F)',
            points: 300,
            progress: 0,
            required: 1,
            completed: false
          })
        }, 2000)
      }
      
      this.updateDisplay()
    }
  }
  
  public getScore(): number {
    return this.score
  }
  
  private updateDisplay(): void {
    this.scoreText.text = `Score: ${this.score}`
    
    if (this.currentObjective) {
      this.objectiveText.text = `📋 ${this.currentObjective.description}`
      
      // Update progress bar
      this.progressBar.clear()
      
      // Background
      this.progressBar.rect(0, 0, 200, 20)
      this.progressBar.fill({ color: 0x333333, alpha: 0.8 })
      
      // Progress
      const progress = Math.min(this.currentObjective.progress / this.currentObjective.required, 1)
      this.progressBar.rect(2, 2, 196 * progress, 16)
      this.progressBar.fill({ 
        color: this.currentObjective.completed ? 0x00FF00 : 0xFFD700
      })
      
      // Border
      this.progressBar.rect(0, 0, 200, 20)
      this.progressBar.stroke({ width: 2, color: 0xFFFFFF })
    }
  }
}