import { Container, Graphics, Text } from 'pixi.js'

export class ViewerShield {
  private container: Container
  private shields: Graphics[] = []
  private emojis: Text[] = []
  private rotationSpeed: number = 0.02
  private orbitRadius: number = 40
  private activeShields: number = 3
  
  constructor() {
    this.container = new Container()
    
    // Create 3 viewer shields
    const viewerEmojis = ['😍', '🤩', '😎']
    const colors = [0xFF69B4, 0xFFD700, 0x00CED1] // Pink, Gold, Turquoise
    
    for (let i = 0; i < 3; i++) {
      // Create shield graphic
      const shield = new Graphics()
      shield.circle(0, 0, 15)
      shield.fill({ color: colors[i], alpha: 0.3 })
      shield.stroke({ width: 2, color: colors[i] })
      
      // Create emoji text
      const emoji = new Text({
        text: viewerEmojis[i],
        style: {
          fontSize: 20,
          align: 'center'
        }
      })
      emoji.anchor.set(0.5)
      
      this.shields.push(shield)
      this.emojis.push(emoji)
      this.container.addChild(shield)
      this.container.addChild(emoji)
    }
    
    // Add "LIVE" indicator
    const liveText = new Text({
      text: '🔴 LIVE',
      style: {
        fontSize: 16,
        fill: 0xFF0000,
        fontWeight: 'bold',
        dropShadow: true,
        dropShadowDistance: 2
      }
    })
    liveText.anchor.set(0.5)
    liveText.y = -60
    this.container.addChild(liveText)
  }
  
  public update(delta: number): void {
    // Rotate shields around player
    for (let i = 0; i < this.shields.length; i++) {
      if (i >= this.activeShields) {
        this.shields[i].visible = false
        this.emojis[i].visible = false
        continue
      }
      
      this.shields[i].visible = true
      this.emojis[i].visible = true
      
      const angle = (Date.now() * this.rotationSpeed + i * (Math.PI * 2 / 3)) % (Math.PI * 2)
      const x = Math.cos(angle) * this.orbitRadius
      const y = Math.sin(angle) * this.orbitRadius
      
      this.shields[i].x = x
      this.shields[i].y = y
      this.emojis[i].x = x
      this.emojis[i].y = y
    }
  }
  
  public getContainer(): Container {
    return this.container
  }
  
  public absorbHit(): boolean {
    if (this.activeShields > 0) {
      this.activeShields--
      
      // Pop effect for the shield that was hit
      const shieldIndex = this.activeShields
      if (shieldIndex >= 0 && shieldIndex < this.shields.length) {
        // Create pop effect
        const popEffect = new Graphics()
        popEffect.circle(this.shields[shieldIndex].x, this.shields[shieldIndex].y, 20)
        popEffect.stroke({ width: 3, color: 0xFFFFFF })
        this.container.addChild(popEffect)
        
        // Animate and remove
        let scale = 1
        const animateInterval = setInterval(() => {
          scale += 0.1
          popEffect.scale.set(scale)
          popEffect.alpha -= 0.05
          
          if (popEffect.alpha <= 0) {
            this.container.removeChild(popEffect)
            clearInterval(animateInterval)
          }
        }, 16)
      }
      
      return true // Hit absorbed
    }
    return false // No shields left
  }
  
  public getActiveShields(): number {
    return this.activeShields
  }
  
  public isActive(): boolean {
    return this.activeShields > 0
  }
}