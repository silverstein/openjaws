/**
 * ScreenEffects — Screen shake, flash, and visual feedback
 * Makes the game feel visceral and exciting for kids
 */

import type { Container } from "pixi.js"

export class ScreenShake {
  private intensity = 0
  private duration = 0
  private elapsed = 0
  private originalX = 0
  private originalY = 0
  private target: Container | null = null

  /** Trigger a screen shake */
  shake(target: Container, intensity: number, durationMs: number): void {
    this.target = target
    this.intensity = intensity
    this.duration = durationMs
    this.elapsed = 0
    this.originalX = target.x
    this.originalY = target.y
  }

  /** Update — call every frame */
  update(delta: number): void {
    if (!this.target || this.elapsed >= this.duration) {
      if (this.target) {
        this.target.x = this.originalX
        this.target.y = this.originalY
        this.target = null
      }
      return
    }

    this.elapsed += delta * (1000 / 60) // Convert frame delta to ms
    const progress = this.elapsed / this.duration
    const decay = 1 - progress // Shake decreases over time

    const offsetX = (Math.random() - 0.5) * 2 * this.intensity * decay
    const offsetY = (Math.random() - 0.5) * 2 * this.intensity * decay

    this.target.x = this.originalX + offsetX
    this.target.y = this.originalY + offsetY
  }

  isActive(): boolean {
    return this.target !== null && this.elapsed < this.duration
  }
}

export class CloseCallDetector {
  private lastCloseCallTime = 0
  private readonly cooldownMs = 3000 // Don't trigger more than once per 3 seconds
  private readonly closeCallDistance = 80 // Pixels — "too close for comfort"
  private readonly nearMissDistance = 50 // Even closer — near miss!

  /**
   * Check if the shark is dangerously close to the player.
   * Returns the type of close call or null.
   */
  check(
    playerX: number,
    playerY: number,
    sharkX: number,
    sharkY: number,
    sharkState: string
  ): "near_miss" | "close_call" | null {
    const now = Date.now()
    if (now - this.lastCloseCallTime < this.cooldownMs) return null

    // Only trigger when shark is actively hunting or attacking
    if (sharkState !== "hunting" && sharkState !== "attacking") return null

    const dx = playerX - sharkX
    const dy = playerY - sharkY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < this.nearMissDistance) {
      this.lastCloseCallTime = now
      return "near_miss"
    }

    if (distance < this.closeCallDistance) {
      this.lastCloseCallTime = now
      return "close_call"
    }

    return null
  }
}

export class TensionTracker {
  private tensionLevel = 0 // 0-100
  private readonly rampRate = 0.5 // Per second when shark is near
  private readonly decayRate = 2.0 // Per second when safe
  private readonly sharkNearDistance = 250
  private readonly sharkDangerDistance = 120

  /**
   * Update tension based on shark proximity.
   * Returns current tension level (0-100).
   */
  update(
    delta: number,
    playerX: number,
    playerY: number,
    sharkX: number,
    sharkY: number,
    playerInWater: boolean
  ): number {
    const dx = playerX - sharkX
    const dy = playerY - sharkY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const dt = delta / 60 // Convert frame delta to seconds

    if (playerInWater && distance < this.sharkDangerDistance) {
      // DANGER — tension rises fast
      this.tensionLevel = Math.min(100, this.tensionLevel + this.rampRate * 4 * dt * 60)
    } else if (distance < this.sharkNearDistance) {
      // Shark is near — tension rises
      const proximity = 1 - distance / this.sharkNearDistance
      this.tensionLevel = Math.min(100, this.tensionLevel + this.rampRate * proximity * dt * 60)
    } else {
      // Safe — tension decays
      this.tensionLevel = Math.max(0, this.tensionLevel - this.decayRate * dt * 60)
    }

    return this.tensionLevel
  }

  getTension(): number {
    return this.tensionLevel
  }

  /** Returns "calm" | "tense" | "danger" | "panic" */
  getMood(): "calm" | "tense" | "danger" | "panic" {
    if (this.tensionLevel < 20) return "calm"
    if (this.tensionLevel < 50) return "tense"
    if (this.tensionLevel < 80) return "danger"
    return "panic"
  }
}
