import { Container, Graphics, Text } from "pixi.js"

/**
 * DeepWaterIndicator - Visual overlay showing water depth zones
 * Provides visual feedback for shallow water, deep water, and the abyss
 * Uses semi-transparent overlays that don't obscure the water shader
 */
export class DeepWaterIndicator {
  public container: Container

  private screenWidth: number
  private screenHeight: number
  private waterLineY: number

  private zoneOverlay: Graphics
  private boundaryLines: Graphics
  private labels: Container

  // Zone thresholds (as percentages of screen height)
  private readonly SHALLOW_THRESHOLD = 0.5
  private readonly DEEP_THRESHOLD = 0.7

  // Visual settings
  private readonly OVERLAY_ALPHA = 0.15
  private readonly BOUNDARY_ALPHA = 0.25
  private readonly LABEL_ALPHA = 0.4

  // Zone colors
  private readonly SHALLOW_COLOR = 0x87ceeb // Light blue
  private readonly DEEP_COLOR = 0x4682b4 // Darker blue
  private readonly ABYSS_COLOR = 0x1a1a3e // Dark blue/purple

  // Animation
  private animationOffset: number = 0
  private animationSpeed: number = 0.02

  /**
   * Create a new deep water indicator
   * @param screenWidth - Current screen width
   * @param screenHeight - Current screen height
   * @param waterLineY - Y coordinate where water starts
   */
  constructor(screenWidth: number, screenHeight: number, waterLineY: number) {
    this.screenWidth = screenWidth
    this.screenHeight = screenHeight
    this.waterLineY = waterLineY

    // Create main container
    this.container = new Container()

    // Create graphics layers
    this.zoneOverlay = new Graphics()
    this.boundaryLines = new Graphics()
    this.labels = new Container()

    // Add layers to container (order matters for rendering)
    this.container.addChild(this.zoneOverlay)
    this.container.addChild(this.boundaryLines)
    this.container.addChild(this.labels)

    // Initial draw
    this.draw()
  }

  /**
   * Draw all visual elements
   */
  private draw(): void {
    this.drawZoneOverlays()
    this.drawBoundaryLines()
    this.drawLabels()
  }

  /**
   * Draw the gradient color overlays for each zone
   */
  private drawZoneOverlays(): void {
    this.zoneOverlay.clear()

    const shallowY = this.screenHeight * this.SHALLOW_THRESHOLD
    const deepY = this.screenHeight * this.DEEP_THRESHOLD

    // Shallow water zone (waterline to shallow threshold)
    this.zoneOverlay.rect(0, this.waterLineY, this.screenWidth, shallowY - this.waterLineY)
    this.zoneOverlay.fill({ color: this.SHALLOW_COLOR, alpha: this.OVERLAY_ALPHA * 0.5 })

    // Deep water zone (shallow threshold to deep threshold)
    this.zoneOverlay.rect(0, shallowY, this.screenWidth, deepY - shallowY)
    this.zoneOverlay.fill({ color: this.DEEP_COLOR, alpha: this.OVERLAY_ALPHA })

    // The Abyss zone (deep threshold to bottom)
    this.zoneOverlay.rect(0, deepY, this.screenWidth, this.screenHeight - deepY)
    this.zoneOverlay.fill({ color: this.ABYSS_COLOR, alpha: this.OVERLAY_ALPHA * 1.5 })

    // Add gradient transitions between zones
    this.drawGradientTransition(shallowY - 20, 40, this.SHALLOW_COLOR, this.DEEP_COLOR)
    this.drawGradientTransition(deepY - 20, 40, this.DEEP_COLOR, this.ABYSS_COLOR)
  }

  /**
   * Draw a gradient transition between two zones
   * @param startY - Y coordinate to start gradient
   * @param height - Height of gradient transition
   * @param colorTop - Top color
   * @param colorBottom - Bottom color
   */
  private drawGradientTransition(startY: number, height: number, colorTop: number, colorBottom: number): void {
    const steps = 10
    const stepHeight = height / steps

    for (let i = 0; i < steps; i++) {
      const alpha = (this.OVERLAY_ALPHA * (i / steps)) * 0.3
      const y = startY + i * stepHeight

      // Alternate between colors for smooth transition
      const color = i % 2 === 0 ? colorTop : colorBottom

      this.zoneOverlay.rect(0, y, this.screenWidth, stepHeight)
      this.zoneOverlay.fill({ color, alpha })
    }
  }

  /**
   * Draw dashed/dotted boundary lines at zone transitions
   */
  private drawBoundaryLines(): void {
    this.boundaryLines.clear()

    const shallowY = this.screenHeight * this.SHALLOW_THRESHOLD
    const deepY = this.screenHeight * this.DEEP_THRESHOLD

    // Draw dashed lines at boundaries
    this.drawDashedLine(shallowY, 0x4682b4)
    this.drawDashedLine(deepY, 0x1a1a3e)
  }

  /**
   * Draw a dashed horizontal line across the screen
   * @param y - Y coordinate for the line
   * @param color - Line color
   */
  private drawDashedLine(y: number, color: number): void {
    const dashLength = 15
    const gapLength = 10
    const totalSegment = dashLength + gapLength

    for (let x = 0; x < this.screenWidth; x += totalSegment) {
      this.boundaryLines.moveTo(x, y)
      this.boundaryLines.lineTo(Math.min(x + dashLength, this.screenWidth), y)
    }

    this.boundaryLines.stroke({ width: 2, color, alpha: this.BOUNDARY_ALPHA })
  }

  /**
   * Draw zone labels on the side
   */
  private drawLabels(): void {
    // Clear existing labels
    this.labels.removeChildren()

    const shallowY = this.screenHeight * this.SHALLOW_THRESHOLD
    const deepY = this.screenHeight * this.DEEP_THRESHOLD

    // Calculate center Y positions for each zone
    const shallowCenterY = this.waterLineY + (shallowY - this.waterLineY) / 2
    const deepCenterY = shallowY + (deepY - shallowY) / 2
    const abyssCenterY = deepY + (this.screenHeight - deepY) / 2

    // Create labels
    this.createZoneLabel("SHALLOW", shallowCenterY, 0x87ceeb)
    this.createZoneLabel("DEEP", deepCenterY, 0x4682b4)
    this.createZoneLabel("ABYSS", abyssCenterY, 0xff6b6b)
  }

  /**
   * Create a zone label text
   * @param text - Label text
   * @param y - Y position
   * @param color - Text color
   */
  private createZoneLabel(text: string, y: number, color: number): void {
    const label = new Text({
      text,
      style: {
        fontSize: 16,
        fontWeight: "bold",
        fill: color,
        fontFamily: "Arial, sans-serif",
        dropShadow: {
          distance: 2,
          color: 0x000000,
          alpha: 0.8,
          blur: 2
        }
      }
    })

    label.anchor.set(0, 0.5)
    label.x = 10 // 10px from left edge
    label.y = y
    label.alpha = this.LABEL_ALPHA
    label.rotation = -Math.PI / 2 // Rotate 90 degrees counter-clockwise

    this.labels.addChild(label)
  }

  /**
   * Update animation (subtle wave effect on boundaries)
   * @param delta - Frame delta multiplier
   */
  public update(delta: number): void {
    // Animate boundary lines with subtle wave effect
    this.animationOffset += this.animationSpeed * delta

    // Optional: Add gentle pulsing to labels
    const pulse = Math.sin(this.animationOffset) * 0.1 + 0.9
    for (const label of this.labels.children) {
      if (label instanceof Text) {
        label.alpha = this.LABEL_ALPHA * pulse
      }
    }
  }

  /**
   * Resize the indicator when screen dimensions change
   * @param screenWidth - New screen width
   * @param screenHeight - New screen height
   * @param waterLineY - New water line Y coordinate
   */
  public resize(screenWidth: number, screenHeight: number, waterLineY: number): void {
    this.screenWidth = screenWidth
    this.screenHeight = screenHeight
    this.waterLineY = waterLineY

    // Redraw everything with new dimensions
    this.draw()
  }

  /**
   * Get the zone name for a given Y coordinate
   * @param y - Y coordinate to check
   * @returns Zone name
   */
  public getZoneAtY(y: number): "shallow" | "deep" | "abyss" {
    const shallowY = this.screenHeight * this.SHALLOW_THRESHOLD
    const deepY = this.screenHeight * this.DEEP_THRESHOLD

    if (y < shallowY) {
      return "shallow"
    } else if (y < deepY) {
      return "deep"
    } else {
      return "abyss"
    }
  }

  /**
   * Get the danger level (0-1) based on Y coordinate
   * @param y - Y coordinate to check
   * @returns Danger level from 0 (safe) to 1 (maximum danger)
   */
  public getDangerLevel(y: number): number {
    const normalizedY = (y - this.waterLineY) / (this.screenHeight - this.waterLineY)
    return Math.max(0, Math.min(1, normalizedY))
  }

  /**
   * Clean up and destroy
   */
  public destroy(): void {
    this.container.destroy({ children: true })
  }
}
