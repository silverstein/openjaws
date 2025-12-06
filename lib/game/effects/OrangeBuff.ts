/**
 * OrangeBuff System - Speed boost power-up from Vitamin C
 *
 * Features:
 * - Duration: 15-20 seconds
 * - Effect: 2x swim speed multiplier
 * - Visual: Orange glow effect (handled by rendering system)
 * - No stacking (refreshes timer only)
 *
 * Usage:
 * - Player collects orange from Secret Room
 * - Speed multiplier applied to movement
 * - Buff expires after duration
 */

interface BuffData {
  startTime: number // Timestamp when buff was activated
  duration: number // Duration in milliseconds
  speedMultiplier: number // Speed multiplier value
}

export class OrangeBuff {
  private activeBuffs: Map<string, BuffData> = new Map()

  // Configuration
  private readonly MIN_DURATION = 15000 // 15 seconds
  private readonly MAX_DURATION = 20000 // 20 seconds
  private readonly SPEED_MULTIPLIER = 2.0

  /**
   * Activate the orange buff for a player
   * If buff is already active, refreshes the timer
   */
  public activate(playerId: string): void {
    const duration = this.MIN_DURATION + Math.random() * (this.MAX_DURATION - this.MIN_DURATION)

    this.activeBuffs.set(playerId, {
      startTime: Date.now(),
      duration,
      speedMultiplier: this.SPEED_MULTIPLIER,
    })
  }

  /**
   * Check if buff is active for a player
   */
  public isActive(playerId: string): boolean {
    const buff = this.activeBuffs.get(playerId)
    if (!buff) return false

    const now = Date.now()
    const elapsed = now - buff.startTime

    return elapsed < buff.duration
  }

  /**
   * Get remaining time for buff in milliseconds
   * Returns 0 if buff is not active
   */
  public getRemainingTime(playerId: string): number {
    const buff = this.activeBuffs.get(playerId)
    if (!buff) return 0

    const now = Date.now()
    const elapsed = now - buff.startTime
    const remaining = buff.duration - elapsed

    return Math.max(0, remaining)
  }

  /**
   * Get remaining time as a percentage (0-1)
   * Useful for UI progress bars
   */
  public getRemainingPercent(playerId: string): number {
    const buff = this.activeBuffs.get(playerId)
    if (!buff) return 0

    const remaining = this.getRemainingTime(playerId)
    return remaining / buff.duration
  }

  /**
   * Get speed multiplier for a player
   * Returns 1.0 if buff is not active, 2.0 if active
   */
  public getSpeedMultiplier(playerId: string): number {
    if (!this.isActive(playerId)) {
      return 1.0
    }

    const buff = this.activeBuffs.get(playerId)
    return buff?.speedMultiplier || 1.0
  }

  /**
   * Update buff timers and expire old buffs
   * Call this in your game loop
   */
  public update(_delta: number): void {
    const now = Date.now()

    // Remove expired buffs
    for (const [playerId, buff] of Array.from(this.activeBuffs.entries())) {
      const elapsed = now - buff.startTime

      if (elapsed >= buff.duration) {
        this.activeBuffs.delete(playerId)
      }
    }
  }

  /**
   * Manually deactivate buff for a player
   * Useful for game events (e.g., player dies, game ends)
   */
  public deactivate(playerId: string): void {
    this.activeBuffs.delete(playerId)
  }

  /**
   * Get all active buff player IDs
   * Useful for rendering glow effects
   */
  public getActivePlayers(): string[] {
    const activePlayers: string[] = []

    for (const [playerId] of Array.from(this.activeBuffs.entries())) {
      if (this.isActive(playerId)) {
        activePlayers.push(playerId)
      }
    }

    return activePlayers
  }

  /**
   * Get buff data for a player (for UI/debugging)
   */
  public getBuffData(playerId: string): BuffData | null {
    const buff = this.activeBuffs.get(playerId)
    if (!buff || !this.isActive(playerId)) {
      return null
    }

    return { ...buff }
  }

  /**
   * Clear all buffs (useful for game restart)
   */
  public clearAll(): void {
    this.activeBuffs.clear()
  }

  /**
   * Get total buff duration for a player
   */
  public getBuffDuration(playerId: string): number {
    const buff = this.activeBuffs.get(playerId)
    return buff?.duration || 0
  }

  /**
   * Check if player can receive buff (always true, since it refreshes)
   */
  public canActivate(_playerId: string): boolean {
    return true // Orange buff can always be activated (refreshes timer)
  }

  /**
   * Get glow intensity for visual effects (0-1)
   * Pulses based on remaining time
   */
  public getGlowIntensity(playerId: string, animationTime: number): number {
    if (!this.isActive(playerId)) {
      return 0
    }

    const remaining = this.getRemainingPercent(playerId)

    // Pulse faster as buff expires
    const pulseSpeed = 1 + (1 - remaining) * 2 // Speed up 3x near end
    const basePulse = 0.5 + Math.sin(animationTime * 0.003 * pulseSpeed) * 0.3

    // Fade out in last 20% of duration
    const fadeOut = remaining < 0.2 ? remaining / 0.2 : 1.0

    return basePulse * fadeOut
  }

  /**
   * Get buff color for visual effects
   */
  public getBuffColor(): number {
    return 0xff8c00 // Dark orange
  }

  /**
   * Get buff statistics (for debugging/analytics)
   */
  public getStats(): {
    activeBuffCount: number
    totalBuffsActivated: number
  } {
    return {
      activeBuffCount: this.activeBuffs.size,
      totalBuffsActivated: this.activeBuffs.size, // Could track cumulative if needed
    }
  }
}

/**
 * Factory function to create a new OrangeBuff system
 */
export function createOrangeBuff(): OrangeBuff {
  return new OrangeBuff()
}

/**
 * Singleton instance for global use
 * Import this if you want a shared buff system across your game
 */
export const globalOrangeBuff = new OrangeBuff()
