import { Container, Text, type TextStyleOptions } from "pixi.js"

interface FloatingTextOptions {
  text: string
  x: number
  y: number
  style?: Partial<TextStyleOptions>
  duration?: number
  fadeSpeed?: number
  floatSpeed?: number
  scale?: { start: number; end: number }
}

const DEFAULT_STYLE: Partial<TextStyleOptions> = {
  fontSize: 18,
  fill: 0xffffff,
  fontWeight: "bold",
  dropShadow: {
    distance: 2,
    color: 0x000000,
    alpha: 0.7,
  },
}

/**
 * Shows a floating text that drifts up and fades out, then removes itself from the parent.
 * Replaces the 15+ manual setInterval/setTimeout patterns scattered in GameCanvas.
 */
export function showFloatingText(parent: Container, options: FloatingTextOptions): void {
  const {
    text: message,
    x,
    y,
    style = {},
    duration = 1500,
    fadeSpeed = 0.02,
    floatSpeed = 1,
    scale,
  } = options

  const mergedStyle = { ...DEFAULT_STYLE, ...style }
  const text = new Text({ text: message, style: mergedStyle })
  text.anchor.set(0.5)
  text.x = x
  text.y = y
  parent.addChild(text)

  const intervalMs = 30
  const startTime = Date.now()
  let alpha = 1

  const interval = setInterval(() => {
    alpha -= fadeSpeed
    text.alpha = alpha
    text.y -= floatSpeed

    if (scale) {
      const progress = Math.min(1, (Date.now() - startTime) / duration)
      const s = scale.start + (scale.end - scale.start) * progress
      text.scale.set(s)
    }

    if (alpha <= 0) {
      parent.removeChild(text)
      clearInterval(interval)
    }
  }, intervalMs)

  // Safety cleanup in case interval doesn't clear (e.g., tab backgrounded)
  setTimeout(() => {
    if (text.parent === parent) {
      parent.removeChild(text)
    }
    clearInterval(interval)
  }, duration + 500)
}

/** Convenience: red error/warning text */
export function showErrorText(parent: Container, message: string, x: number, y: number): void {
  showFloatingText(parent, {
    text: message,
    x,
    y,
    style: { fill: 0xff4444, fontSize: 16 },
    duration: 1500,
    fadeSpeed: 0,
    floatSpeed: 0,
  })
  // Simple timeout removal (no animation) for error messages
}

/** Convenience: gold reward/achievement text */
export function showRewardText(parent: Container, message: string, x: number, y: number, points?: number): void {
  const fullMessage = points ? `${message}\n+${points} points` : message
  showFloatingText(parent, {
    text: fullMessage,
    x,
    y,
    style: { fill: 0xffd700, fontSize: 20, align: "center" },
  })
}

/** Convenience: damage number text (red, floats up fast) */
export function showDamageText(parent: Container, damage: number, x: number, y: number, isCombo?: boolean): void {
  const message = isCombo ? `COMBO HIT! -${damage} (2x)` : `HIT! -${damage}`
  showFloatingText(parent, {
    text: message,
    x,
    y,
    style: {
      fill: isCombo ? 0xffd700 : 0xff4444,
      fontSize: isCombo ? 28 : 24,
    },
    fadeSpeed: 0.03,
    floatSpeed: 2,
    scale: isCombo ? { start: 1, end: 1.3 } : undefined,
  })
}
