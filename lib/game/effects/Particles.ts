/**
 * Particles — Lightweight particle effects for game juice
 * Handles splash, sparkle, damage numbers, and hit impacts
 */

import { Container, Graphics, Text } from "pixi.js"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: number
  alpha: number
  gravity: number
}

export class ParticleSystem {
  private container: Container
  private particles: Particle[] = []
  private graphics: Graphics

  constructor() {
    this.container = new Container()
    this.graphics = new Graphics()
    this.container.addChild(this.graphics)
  }

  getContainer(): Container {
    return this.container
  }

  /** Update all particles — call every frame */
  update(delta: number): void {
    this.graphics.clear()

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!
      p.life -= delta / 60
      if (p.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }

      // Physics
      p.x += p.vx * delta
      p.y += p.vy * delta
      p.vy += p.gravity * delta
      p.alpha = Math.max(0, p.life / p.maxLife)

      // Draw
      this.graphics.circle(p.x, p.y, p.size * p.alpha)
      this.graphics.fill({ color: p.color, alpha: p.alpha })
    }
  }

  /** Water splash — when player enters water */
  splash(x: number, y: number): void {
    const count = 12
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI
      const speed = 1.5 + Math.random() * 2
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        size: 3 + Math.random() * 3,
        color: [0x4ecdc4, 0x5bcdcd, 0xffffff][Math.floor(Math.random() * 3)]!,
        alpha: 1,
        gravity: 0.15,
      })
    }
  }

  /** Hit impact — when shark takes damage */
  hitImpact(x: number, y: number, color: number = 0xff6b6b): void {
    const count = 8
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 3
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        size: 2 + Math.random() * 2,
        color,
        alpha: 1,
        gravity: 0,
      })
    }
  }

  /** Sparkle — item pickup, objective complete */
  sparkle(x: number, y: number): void {
    const count = 6
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.5 + Math.random() * 1.5
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: -1 - Math.random() * 2,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1,
        size: 2 + Math.random() * 3,
        color: [0xffd700, 0xffa500, 0xffff00][Math.floor(Math.random() * 3)]!,
        alpha: 1,
        gravity: -0.02, // Float up
      })
    }
  }

  /** Chomp burst — when shark bites player */
  chomp(x: number, y: number): void {
    // Red blood-like particles
    const count = 15
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        size: 2 + Math.random() * 4,
        color: [0xff0000, 0xff3333, 0xff6666, 0xcc0000][Math.floor(Math.random() * 4)]!,
        alpha: 1,
        gravity: 0.1,
      })
    }
  }

  /** Bubble trail — when swimming */
  bubble(x: number, y: number): void {
    if (Math.random() > 0.3) return // Don't spawn every frame
    this.particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.5 - Math.random() * 1,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1,
      size: 2 + Math.random() * 3,
      color: 0xffffff,
      alpha: 0.6,
      gravity: -0.03,
    })
  }

  /** Stun stars — when shark is stunned */
  stunStars(x: number, y: number): void {
    const count = 5
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radius = 25
      this.particles.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius - 15,
        vx: Math.cos(angle) * 0.3,
        vy: -0.5,
        life: 0.8,
        maxLife: 0.8,
        size: 4,
        color: 0xffd700,
        alpha: 1,
        gravity: 0,
      })
    }
  }
}

/**
 * Floating damage/score numbers that drift up and fade
 */
export class FloatingTextManager {
  private container: Container

  constructor() {
    this.container = new Container()
  }

  getContainer(): Container {
    return this.container
  }

  /** Show a floating number/text at position */
  spawn(x: number, y: number, text: string, color: number = 0xffffff, size: number = 22): void {
    const label = new Text({
      text,
      style: {
        fontSize: size,
        fill: color,
        fontWeight: "bold",
        dropShadow: { distance: 2, color: 0x000000, alpha: 0.6 },
      },
    })
    label.anchor.set(0.5)
    label.x = x + (Math.random() - 0.5) * 20 // Slight random offset
    label.y = y
    this.container.addChild(label)

    // Animate: float up and fade
    let life = 1.0
    const tick = setInterval(() => {
      life -= 0.02
      label.y -= 1
      label.alpha = Math.max(0, life)
      label.scale.set(0.8 + life * 0.4) // Slight shrink

      if (life <= 0) {
        this.container.removeChild(label)
        clearInterval(tick)
      }
    }, 16)
  }

  /** Damage number — red, bouncy */
  damage(x: number, y: number, amount: number): void {
    this.spawn(x, y - 20, `-${amount}`, 0xff4444, 24)
  }

  /** Score popup — gold */
  score(x: number, y: number, points: number): void {
    this.spawn(x, y - 30, `+${points}`, 0xffd700, 26)
  }

  /** Heal number — green */
  heal(x: number, y: number, amount: number): void {
    this.spawn(x, y - 20, `+${amount} HP`, 0x44ff44, 20)
  }
}
