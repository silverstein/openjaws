import { Container, Graphics, Text, TextStyle } from "pixi.js"

/**
 * Represents a segment of the dock that players can walk on
 */
interface DockSegment {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Dock entity - a wooden pier extending from beach into water
 * Players can walk on the dock without losing stamina (unlike swimming)
 * Shark swims UNDER the dock and cannot attack players on it
 */
export class Dock {
  public container: Container
  public x: number
  public y: number

  private graphics: Graphics
  private segments: DockSegment[] = []
  private labelText: Text

  private dockWidth: number = 80
  private dockLength: number = 200
  private segmentCount: number = 10

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // Create graphics layer
    this.graphics = new Graphics()
    this.container.addChild(this.graphics)

    // Create label
    const textStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 14,
      fill: 0x8b4513,
      stroke: { color: 0xffffff, width: 2 },
      align: "center",
    })

    this.labelText = new Text({ text: "DOCK", style: textStyle })
    this.labelText.anchor.set(0.5)
    this.labelText.x = 0
    this.labelText.y = this.dockLength / 2 + 30
    this.container.addChild(this.labelText)

    // Build dock structure
    this.buildDock()
  }

  /**
   * Constructs the dock with wooden plank segments
   */
  private buildDock(): void {
    this.graphics.clear()
    this.segments = []

    const segmentLength = this.dockLength / this.segmentCount
    const plankWidth = this.dockWidth
    const plankGap = 4

    // Draw support posts first (underneath)
    this.drawSupportPosts()

    // Draw wooden planks
    for (let i = 0; i < this.segmentCount; i++) {
      const segmentY = i * segmentLength
      const plankY = segmentY + plankGap / 2
      const plankHeight = segmentLength - plankGap

      // Wood color variation for realism
      const woodShade = 0x8b4513 + Math.floor(Math.random() * 0x202020)

      // Draw plank
      this.graphics.rect(
        -plankWidth / 2,
        plankY,
        plankWidth,
        plankHeight
      )
      this.graphics.fill(woodShade)
      this.graphics.stroke({ width: 2, color: 0x654321 })

      // Add wood grain effect (horizontal lines)
      const grainLines = 2 + Math.floor(Math.random() * 3)
      for (let g = 0; g < grainLines; g++) {
        const grainY = plankY + (plankHeight / (grainLines + 1)) * (g + 1)
        this.graphics.moveTo(-plankWidth / 2 + 5, grainY)
        this.graphics.lineTo(plankWidth / 2 - 5, grainY)
        this.graphics.stroke({ width: 1, color: 0x654321, alpha: 0.3 })
      }

      // Add nail details at corners
      const nailPositions = [
        { x: -plankWidth / 2 + 8, y: plankY + 5 },
        { x: plankWidth / 2 - 8, y: plankY + 5 },
        { x: -plankWidth / 2 + 8, y: plankY + plankHeight - 5 },
        { x: plankWidth / 2 - 8, y: plankY + plankHeight - 5 },
      ]

      nailPositions.forEach(pos => {
        this.graphics.circle(pos.x, pos.y, 2)
        this.graphics.fill(0x2f2f2f) // Dark gray nails
      })

      // Track segment for collision detection
      this.segments.push({
        x: this.x - plankWidth / 2,
        y: this.y + plankY,
        width: plankWidth,
        height: plankHeight,
      })
    }
  }

  /**
   * Draws vertical support posts under the dock
   */
  private drawSupportPosts(): void {
    const postCount = 3
    const postWidth = 12
    const postSpacing = this.dockLength / (postCount + 1)

    for (let i = 1; i <= postCount; i++) {
      const postY = i * postSpacing

      // Draw post extending below water
      this.graphics.rect(
        -postWidth / 2 - 25,
        postY,
        postWidth,
        50
      )
      this.graphics.fill(0x654321) // Darker wood
      this.graphics.stroke({ width: 1, color: 0x3e2723 })

      this.graphics.rect(
        -postWidth / 2 + 25,
        postY,
        postWidth,
        50
      )
      this.graphics.fill(0x654321)
      this.graphics.stroke({ width: 1, color: 0x3e2723 })
    }
  }

  /**
   * Checks if a point is on the dock (for player collision)
   */
  public isPointOnDock(x: number, y: number): boolean {
    for (const segment of this.segments) {
      if (
        x >= segment.x &&
        x <= segment.x + segment.width &&
        y >= segment.y &&
        y <= segment.y + segment.height
      ) {
        return true
      }
    }
    return false
  }

  /**
   * Gets all dock segments for collision detection
   */
  public getSegments(): DockSegment[] {
    return this.segments
  }

  /**
   * Gets the bounds of the entire dock
   */
  public getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - this.dockWidth / 2,
      y: this.y,
      width: this.dockWidth,
      height: this.dockLength,
    }
  }

  /**
   * Gets the position of the dock's end (where boat should be)
   */
  public getEndPosition(): { x: number; y: number } {
    return {
      x: this.x,
      y: this.y + this.dockLength,
    }
  }

  /**
   * Update method (for future animations or effects)
   */
  public update(_delta: number): void {
    // Currently no animations, but keeping for consistency
    // Could add water splashing effects, creaking sounds, etc.
  }

  /**
   * Gets the dock position
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }
}

/**
 * Factory function to create a dock on the left side of the screen
 * extending from beach into water
 */
export function createDock(_screenWidth: number, screenHeight: number): Dock {
  const beachWaterLine = screenHeight * 0.3
  const dockX = 100 // Left side of screen

  return new Dock(dockX, beachWaterLine)
}
