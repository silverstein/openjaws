import { describe, it, expect, beforeEach } from "vitest"
import { BaitZone } from "./BaitZone"
import { FISH_CATALOG } from "./Fish"

describe("BaitZone", () => {
  let baitZone: BaitZone

  beforeEach(() => {
    const sardine = FISH_CATALOG.sardine
    baitZone = new BaitZone(100, 100, sardine)
  })

  it("should initialize with correct position", () => {
    const pos = baitZone.getPosition()
    expect(pos.x).toBe(100)
    expect(pos.y).toBe(100)
  })

  it("should be active when created", () => {
    expect(baitZone.isActive()).toBe(true)
  })

  it("should have an attraction radius", () => {
    expect(baitZone.attractionRadius).toBe(300)
  })

  it("should calculate attraction strength based on distance", () => {
    // Shark at same position - maximum attraction
    const strengthSame = baitZone.getAttractionStrength(100, 100)
    expect(strengthSame).toBeGreaterThan(0)

    // Shark within radius - some attraction
    const strengthNear = baitZone.getAttractionStrength(200, 200)
    expect(strengthNear).toBeGreaterThan(0)
    expect(strengthNear).toBeLessThan(strengthSame)

    // Shark outside radius - no attraction
    const strengthFar = baitZone.getAttractionStrength(500, 500)
    expect(strengthFar).toBe(0)
  })

  it("should provide attraction vector pointing toward bait", () => {
    // Shark to the right should get vector pointing left (negative x)
    const vector = baitZone.getAttractionVector(200, 100)
    expect(vector.x).toBeLessThan(0)
    expect(vector.y).toBe(0)
  })

  it("should expire after duration", () => {
    // Simulate time passing
    const delta = 1 // 1 frame
    const totalFrames = Math.ceil(baitZone.duration / (delta * 16.67))

    // Update beyond duration
    for (let i = 0; i < totalFrames + 10; i++) {
      baitZone.update(delta)
    }

    expect(baitZone.isActive()).toBe(false)
  })

  it("should have different durations based on fish type", () => {
    const sardine = FISH_CATALOG.sardine
    const tuna = FISH_CATALOG.tuna

    const sardineZone = new BaitZone(0, 0, sardine)
    const tunaZone = new BaitZone(0, 0, tuna)

    expect(tunaZone.duration).toBeGreaterThan(sardineZone.duration)
  })

  it("should have different bait power based on fish type", () => {
    const sardine = FISH_CATALOG.sardine
    const chum = FISH_CATALOG.chum

    const sardineZone = new BaitZone(0, 0, sardine)
    const chumZone = new BaitZone(0, 0, chum)

    expect(chumZone.baitPower).toBeGreaterThan(sardineZone.baitPower)
  })
})
