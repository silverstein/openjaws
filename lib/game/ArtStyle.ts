/**
 * ArtStyle — Unified geometric art constants for Beach Panic
 *
 * Design language: "Geometric Beach Party"
 * - Soft rounded shapes (no sharp corners on characters)
 * - Consistent 2px dark outlines on all entities
 * - Skin tone heads, colored bodies
 * - Simple dot eyes + curve smile
 * - Each character type has a signature accessory
 * - Idle bob animation (sinusoidal Y offset)
 * - Water shimmer on submerged entities
 */

/** Consistent outline style for all entities */
export const OUTLINE = { width: 2, color: 0x2d3436 } as const

/** Skin tones for character heads */
export const SKIN = {
  light: 0xffecd2,
  medium: 0xffdbac,
  tan: 0xd4a574,
} as const

/** Unified color palette */
export const PALETTE = {
  // Characters
  influencer: 0xff6b6b,
  boomerDad: 0x4169e1,
  surferBro: 0xffa07a,
  lifeguard: 0xff0000,
  marineBiologist: 0x32cd32,
  springBreaker: 0xff1493,

  // NPCs
  vendor: 0xffd700,
  npcLifeguard: 0xff0000,
  tourist: 0xff69b4,
  surfer: 0x00bfff,
  scientist: 0x32cd32,
  reporter: 0x9932cc,
  oldTimer: 0x8b7355,
  fishVendor: 0x20b2aa,

  // Shark
  sharkBody: 0x4a6b8a,
  sharkBodyAggro: 0x3d566e,
  sharkBelly: 0x8eafc0,
  sharkFin: 0x3d566e,
  sharkEye: 0xffcc00,
  sharkEyeAggro: 0xff0000,

  // Environment
  sand: 0xf4e6d9,
  water: 0x4ecdc4,
  deepWater: 0x2a7f7e,
} as const

/**
 * Calculate idle bob offset for character animation.
 * Returns a Y offset to apply to the entity container.
 * Call with Date.now() or a running timer.
 */
export function idleBob(time: number, amplitude: number = 2, speed: number = 0.003): number {
  return Math.sin(time * speed) * amplitude
}

/**
 * Calculate a gentle rotation sway for idle characters.
 */
export function idleSway(time: number, amplitude: number = 0.03, speed: number = 0.002): number {
  return Math.sin(time * speed + 0.5) * amplitude
}

/**
 * Draw a simple face on a Graphics object at given position.
 * Consistent across all character types.
 */
export function drawFace(
  g: { circle: (...args: any[]) => any; arc: (...args: any[]) => any; fill: (...args: any[]) => any; stroke: (...args: any[]) => any },
  eyeSpacing: number = 4,
  eyeY: number = -3,
  eyeSize: number = 2,
  smileWidth: number = 4,
): void {
  // Eyes
  g.circle(-eyeSpacing, eyeY, eyeSize)
  g.circle(eyeSpacing, eyeY, eyeSize)
  g.fill(0x2d3436)

  // Smile
  g.arc(0, eyeY + 4, smileWidth, 0.1, Math.PI - 0.1)
  g.stroke({ width: 1.5, color: 0x2d3436 })
}
