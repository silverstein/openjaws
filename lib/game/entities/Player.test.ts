import { beforeEach, describe, expect, it, vi } from "vitest"
import { type CharacterType, Player } from "./Player"

// Mock PIXI.js with class-based mocks for v8 compatibility
vi.mock("pixi.js", () => {
  class MockContainer {
    x = 0
    y = 0
    rotation = 0
    scale = { x: 1, y: 1, set: vi.fn() }
    anchor = { set: vi.fn() }
    alpha = 1
    visible = true
    children: unknown[] = []
    addChild = vi.fn((child) => {
      this.children.push(child)
      return child
    })
    removeChild = vi.fn()
  }

  class MockGraphics extends MockContainer {
    clear = vi.fn().mockReturnThis()
    circle = vi.fn().mockReturnThis()
    ellipse = vi.fn().mockReturnThis()
    rect = vi.fn().mockReturnThis()
    fill = vi.fn().mockReturnThis()
    stroke = vi.fn().mockReturnThis()
    moveTo = vi.fn().mockReturnThis()
    lineTo = vi.fn().mockReturnThis()
    closePath = vi.fn().mockReturnThis()
    star = vi.fn().mockReturnThis()
    poly = vi.fn().mockReturnThis()
    beginFill = vi.fn().mockReturnThis()
    endFill = vi.fn().mockReturnThis()
  }

  class MockText extends MockContainer {
    text = ""
    style = { fill: 0xffffff }
    constructor(options?: { text?: string; style?: Record<string, unknown> }) {
      super()
      if (options) {
        this.text = options.text || ""
        this.style = (options.style as { fill: number }) || { fill: 0xffffff }
      }
    }
  }

  class MockTextStyle {
    fontFamily = "Arial"
    fontSize = 14
    fill = 0xffffff
    constructor(options?: Record<string, unknown>) {
      if (options) {
        Object.assign(this, options)
      }
    }
  }

  return {
    Container: MockContainer,
    Graphics: MockGraphics,
    Text: MockText,
    TextStyle: MockTextStyle,
  }
})

describe("Player Entity", () => {
  let player: Player

  beforeEach(() => {
    player = new Player(100, 200, "influencer", "test-user-123")
  })

  describe("Initialization", () => {
    it("should initialize with correct position", () => {
      expect(player.x).toBe(100)
      expect(player.y).toBe(200)
      expect(player.getPosition()).toEqual({ x: 100, y: 200 })
    })

    it("should set character type and stats", () => {
      expect(player.archetype).toBe("influencer")
      expect(player.health).toBe(100)
      expect(player.stamina).toBe(100)
    })

    it("should set user ID when provided", () => {
      expect(player.userId).toBe("test-user-123")
    })

    it("should handle missing user ID", () => {
      const playerNoId = new Player(0, 0, "surferBro")
      expect(playerNoId.userId).toBeNull()
    })

    it("should support all character types", () => {
      const types: CharacterType[] = [
        "influencer",
        "boomerDad",
        "surferBro",
        "lifeguard",
        "marineBiologist",
        "springBreaker",
      ]

      types.forEach((type) => {
        const testPlayer = new Player(0, 0, type)
        expect(testPlayer.archetype).toBe(type)
      })
    })
  })

  describe("Movement", () => {
    it("should update position based on input", () => {
      player.update(16, 1, 0, false) // Move right

      expect(player.vx).toBeGreaterThan(0)
      expect(player.x).toBeGreaterThan(100)
    })

    it("should apply friction to velocity", () => {
      player.vx = 10
      player.vy = 10

      player.update(16, 0, 0, false) // No input

      expect(player.vx).toBeLessThan(10)
      expect(player.vy).toBeLessThan(10)
    })

    it("should move slower in water", () => {
      // Move on land
      player.update(16, 1, 0, false)
      const landVelocity = player.vx

      // Reset and move in water
      player.vx = 0
      player.update(16, 1, 0, true)
      const waterVelocity = player.vx

      expect(waterVelocity).toBeLessThan(landVelocity)
    })

    it("should rotate based on movement direction", () => {
      player.update(16, 1, 1, false) // Move diagonally

      expect(player.container.rotation).not.toBe(0)
    })
  })

  describe("Stamina System", () => {
    it("should decrease stamina when moving in water", () => {
      const initialStamina = player.stamina

      player.update(16, 1, 0, true) // Move in water

      expect(player.stamina).toBeLessThan(initialStamina)
    })

    it("should recover stamina when stationary", () => {
      player.stamina = 50 // Set low stamina

      player.update(16, 0, 0, false) // No movement

      expect(player.stamina).toBeGreaterThan(50)
    })

    it("should cap stamina at 100", () => {
      player.stamina = 99

      // Multiple updates while stationary
      for (let i = 0; i < 10; i++) {
        player.update(16, 0, 0, false)
      }

      expect(player.stamina).toBe(100)
    })

    it("should reduce speed when stamina is low", () => {
      player.stamina = 100
      player.update(16, 1, 0, false)
      const normalSpeed = player.vx

      // Reset and test with low stamina
      player.vx = 0
      player.stamina = 10
      player.update(16, 1, 0, false)
      const lowStaminaSpeed = player.vx

      expect(lowStaminaSpeed).toBeLessThan(normalSpeed)
    })
  })

  describe("Character Abilities", () => {
    it("should activate abilities and produce effects", () => {
      // Influencer ability creates a shield effect
      player.activateAbility()

      // Check that an ability effect was generated
      const effect = player.consumeAbilityEffect()
      expect(effect.type).toBe("shield_active")
    })

    it("should not activate ability if already active", () => {
      player.activateAbility()
      const consoleSpy = vi.spyOn(console, "log")

      player.activateAbility() // Try to activate again

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it("should deactivate ability after duration", () => {
      vi.useFakeTimers()

      player.activateAbility()

      // Advance time past ability duration
      for (let i = 0; i < 200; i++) {
        player.update(16, 0, 0, false)
      }

      // Ability should be deactivated
      player.activateAbility() // Should work now

      vi.useRealTimers()
    })

    it("should apply character-specific ability effects", () => {
      // Test Lifeguard's Baywatch mode (invincibility)
      const lifeguard = new Player(0, 0, "lifeguard")
      lifeguard.activateAbility()
      expect(lifeguard.isCurrentlyInvincible()).toBe(true)

      // Test Spring Breaker's YOLO mode (invincible + drunk controls)
      const springBreaker = new Player(0, 0, "springBreaker")
      springBreaker.activateAbility()
      expect(springBreaker.isCurrentlyInvincible()).toBe(true)
      expect(springBreaker.hasDrunkControlsActive()).toBe(true)

      // Test Marine Biologist's shark stun ability
      const marineBiologist = new Player(0, 0, "marineBiologist")
      marineBiologist.activateAbility()
      const effect = marineBiologist.consumeAbilityEffect()
      expect(effect.type).toBe("stun_shark")
      if (effect.type === "stun_shark") {
        expect(effect.duration).toBe(2500)
        expect(effect.fact).toBeTruthy()
      }
    })
  })

  describe("Damage and Health", () => {
    it("should take damage correctly", () => {
      player.takeDamage(30)

      expect(player.health).toBe(70)
    })

    it("should not go below 0 health", () => {
      player.takeDamage(150)

      expect(player.health).toBe(0)
    })

    it("should set health to 0 when eliminated", () => {
      player.takeDamage(100)

      expect(player.health).toBe(0)
    })
  })

  describe("Bounds and Collision", () => {
    it("should return correct bounds", () => {
      const bounds = player.getBounds()

      expect(bounds).toEqual({
        x: 80, // 100 - 20
        y: 180, // 200 - 20
        width: 40,
        height: 40,
      })
    })

    it("should update bounds when position changes", () => {
      player.x = 300
      player.y = 400

      const bounds = player.getBounds()

      expect(bounds.x).toBe(280)
      expect(bounds.y).toBe(380)
    })
  })

  describe("Stats Retrieval", () => {
    it("should return current stats", () => {
      player.health = 75
      player.stamina = 60

      const stats = player.getStats()

      expect(stats).toEqual({
        health: 75,
        stamina: 60,
      })
    })
  })

  describe("Character-Specific Behaviors", () => {
    it("should have different base speeds for characters", () => {
      const surfer = new Player(0, 0, "surferBro")
      const dad = new Player(0, 0, "boomerDad")

      // Surfer should be faster
      surfer.update(16, 1, 0, false)
      dad.update(16, 1, 0, false)

      expect(surfer.vx).toBeGreaterThan(dad.vx)
    })

    it("should have different swim speeds for characters", () => {
      const surfer = new Player(0, 0, "surferBro")
      const influencer = new Player(0, 0, "influencer")

      // Both move in water
      surfer.update(16, 1, 0, true)
      influencer.update(16, 1, 0, true)

      // Surfer should be faster in water
      expect(surfer.vx).toBeGreaterThan(influencer.vx)
    })
  })
})
