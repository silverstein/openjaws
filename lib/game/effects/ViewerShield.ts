import { Container, Graphics, Text } from "pixi.js"

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
    const viewerEmojis = ["😍", "🤩", "😎"]
    const colors = [0xff69b4, 0xffd700, 0x00ced1] // Pink, Gold, Turquoise

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
          align: "center",
        },
      })
      emoji.anchor.set(0.5)

      this.shields.push(shield)
      this.emojis.push(emoji)
      this.container.addChild(shield)
      this.container.addChild(emoji)
    }

    // Add "LIVE" indicator
    const liveText = new Text({
      text: "🔴 LIVE",
      style: {
        fontSize: 16,
        fill: 0xff0000,
        fontWeight: "bold",
      },
    })
    liveText.anchor.set(0.5)
    liveText.y = -60
    this.container.addChild(liveText)
  }

  public update(_delta: number): void {
    // Rotate shields around player
    for (let i = 0; i < this.shields.length; i++) {
      const shield = this.shields[i]
      const emoji = this.emojis[i]
      if (!shield || !emoji) continue

      if (i >= this.activeShields) {
        shield.visible = false
        emoji.visible = false
        continue
      }

      shield.visible = true
      emoji.visible = true

      const angle = (Date.now() * this.rotationSpeed + i * ((Math.PI * 2) / 3)) % (Math.PI * 2)
      const x = Math.cos(angle) * this.orbitRadius
      const y = Math.sin(angle) * this.orbitRadius

      shield.x = x
      shield.y = y
      emoji.x = x
      emoji.y = y
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
      const shield = this.shields[shieldIndex]
      if (shieldIndex >= 0 && shieldIndex < this.shields.length && shield) {
        // Create pop effect
        const popEffect = new Graphics()
        popEffect.circle(shield.x, shield.y, 20)
        popEffect.stroke({ width: 3, color: 0xffffff })
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
