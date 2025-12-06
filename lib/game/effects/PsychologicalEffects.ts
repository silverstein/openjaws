import { type Application, Container, Graphics } from "pixi.js"
import { gameLogger } from "@/lib/logger"

export class PsychologicalEffects {
  private app: Application
  private container: Container
  private isShaking: boolean = false
  private vignetteOverlay?: Graphics
  private heartbeatInterval?: NodeJS.Timeout
  private watchedIndicator?: Graphics
  private currentIntensity: number = 0

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    this.app.stage.addChild(this.container)

    this.createVignetteOverlay()
    this.createWatchedIndicator()
  }

  private createVignetteOverlay() {
    this.vignetteOverlay = new Graphics()
    this.updateVignette(0)
    this.container.addChild(this.vignetteOverlay)
  }

  private updateVignette(intensity: number) {
    if (!this.vignetteOverlay) {
      return
    }

    this.vignetteOverlay.clear()

    if (intensity > 0) {
      const width = this.app.screen.width
      const height = this.app.screen.height
      const centerX = width / 2
      const centerY = height / 2

      // Create radial gradient effect
      for (let i = 0; i < 10; i++) {
        const radius = Math.max(width, height) * (1 - i / 10)
        const alpha = intensity * 0.8 * (i / 10)

        this.vignetteOverlay.beginFill(0x000000, alpha)
        this.vignetteOverlay.drawCircle(centerX, centerY, radius)
        this.vignetteOverlay.endFill()
      }
    }
  }

  private createWatchedIndicator() {
    this.watchedIndicator = new Graphics()
    this.watchedIndicator.visible = false
    this.container.addChild(this.watchedIndicator)
  }

  // Screen shake effect
  async screenShake(duration: number = 500, intensity: number = 10) {
    if (this.isShaking) {
      return
    }

    this.isShaking = true
    const originalX = this.app.stage.x
    const originalY = this.app.stage.y
    const startTime = Date.now()

    const shake = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration

      if (progress >= 1) {
        this.app.stage.x = originalX
        this.app.stage.y = originalY
        this.isShaking = false
        return
      }

      // Decay intensity over time
      const currentIntensity = intensity * (1 - progress)

      this.app.stage.x = originalX + (Math.random() - 0.5) * currentIntensity
      this.app.stage.y = originalY + (Math.random() - 0.5) * currentIntensity

      requestAnimationFrame(shake)
    }

    shake()
  }

  // Vignette effect for tension
  setTension(level: number) {
    this.currentIntensity = Math.max(0, Math.min(1, level))
    this.updateVignette(this.currentIntensity)
  }

  // Heartbeat effect
  startHeartbeat(bpm: number = 80) {
    this.stopHeartbeat()

    const interval = 60000 / bpm

    this.heartbeatInterval = setInterval(() => {
      // Visual pulse
      this.pulseTension()

      // Could also trigger audio here
      this.playHeartbeatSound()
    }, interval)
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = undefined
    }
  }

  private pulseTension() {
    const originalIntensity = this.currentIntensity
    const pulseIntensity = Math.min(1, originalIntensity + 0.1)

    this.setTension(pulseIntensity)

    setTimeout(() => {
      this.setTension(originalIntensity)
    }, 100)
  }

  private playHeartbeatSound() {
    // Audio implementation would go here
    // For now, just log
    gameLogger.debug("Thump-thump")
  }

  // "Being watched" indicator
  showWatchedIndicator(x: number, y: number, intensity: number = 0.5) {
    if (!this.watchedIndicator) {
      return
    }

    this.watchedIndicator.clear()
    this.watchedIndicator.visible = true

    // Draw creepy eye indicators
    const eyeSize = 20
    const eyeDistance = 40

    // Left eye
    this.watchedIndicator.beginFill(0xff0000, intensity * 0.8)
    this.watchedIndicator.drawEllipse(x - eyeDistance / 2, y, eyeSize, eyeSize / 2)
    this.watchedIndicator.endFill()

    // Right eye
    this.watchedIndicator.beginFill(0xff0000, intensity * 0.8)
    this.watchedIndicator.drawEllipse(x + eyeDistance / 2, y, eyeSize, eyeSize / 2)
    this.watchedIndicator.endFill()

    // Pupils
    this.watchedIndicator.beginFill(0x000000)
    this.watchedIndicator.drawCircle(x - eyeDistance / 2, y, 5)
    this.watchedIndicator.drawCircle(x + eyeDistance / 2, y, 5)
    this.watchedIndicator.endFill()

    // Fade out after 2 seconds
    setTimeout(() => {
      if (this.watchedIndicator) {
        this.watchedIndicator.visible = false
      }
    }, 2000)
  }

  hideWatchedIndicator() {
    if (this.watchedIndicator) {
      this.watchedIndicator.visible = false
    }
  }

  // Recognition flash
  recognitionFlash(color: number = 0xff0000) {
    const flash = new Graphics()
    flash.beginFill(color, 0.6)
    flash.drawRect(0, 0, this.app.screen.width, this.app.screen.height)
    flash.endFill()

    this.container.addChild(flash)

    // Fade out
    let alpha = 0.6
    const fade = () => {
      alpha -= 0.05
      flash.alpha = alpha

      if (alpha <= 0) {
        this.container.removeChild(flash)
      } else {
        requestAnimationFrame(fade)
      }
    }

    fade()
  }

  // Predator vision effect
  predatorVision(duration: number = 3000) {
    const overlay = new Graphics()
    overlay.beginFill(0xff0000, 0.2)
    overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height)
    overlay.endFill()

    // Add scan lines
    for (let i = 0; i < this.app.screen.height; i += 4) {
      overlay.beginFill(0x000000, 0.1)
      overlay.drawRect(0, i, this.app.screen.width, 2)
      overlay.endFill()
    }

    this.container.addChild(overlay)

    setTimeout(() => {
      this.container.removeChild(overlay)
    }, duration)
  }

  // Clean up
  destroy() {
    this.stopHeartbeat()
    this.container.destroy({ children: true })
  }
}

// Achievement trigger system
export class AchievementTrigger {
  private achievements: Map<string, boolean> = new Map()

  trigger(achievementId: string, callback?: () => void) {
    if (this.achievements.get(achievementId)) {
      return
    }

    this.achievements.set(achievementId, true)

    // Trigger achievement notification
    this.showAchievement(achievementId)

    if (callback) {
      callback()
    }
  }

  private showAchievement(achievementId: string) {
    const achievements: Record<string, { title: string; description: string }> = {
      first_recognition: {
        title: "First Recognition",
        description: "The shark remembers you",
      },
      nemesis_status: {
        title: "Nemesis Status",
        description: "You have become the shark's nemesis",
      },
      predictable_prey: {
        title: "Predictable Prey",
        description: "The shark predicted your movement 3 times",
      },
      shark_knows_name: {
        title: "The Shark Knows My Name",
        description: "Ultimate recognition achieved",
      },
    }

    const achievement = achievements[achievementId]
    if (achievement) {
      gameLogger.debug(`Achievement Unlocked: ${achievement.title}`)
      // Actual UI notification would be implemented here
    }
  }

  hasAchievement(achievementId: string): boolean {
    return this.achievements.get(achievementId) || false
  }
}
