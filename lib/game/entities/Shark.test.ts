import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SharkAIController } from "../ai/SharkAIController"
import { Player } from "./Player"
import { type AIDecision, Shark } from "./Shark"

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
    style = { fill: 0xff0000 }
    constructor(options?: { text?: string; style?: Record<string, unknown> }) {
      super()
      if (options) {
        this.text = options.text || ""
        this.style = (options.style as { fill: number }) || { fill: 0xff0000 }
      }
    }
  }

  class MockTextStyle {
    fontFamily = "Arial"
    fontSize = 14
    fill = 0xff0000
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

describe("Shark Entity", () => {
  let shark: Shark
  let player: Player

  beforeEach(() => {
    shark = new Shark(300, 300)
    player = new Player(100, 100, "surferBro")
  })

  describe("Initialization", () => {
    it("should initialize with correct position", () => {
      expect(shark.x).toBe(300)
      expect(shark.y).toBe(300)
      expect(shark.getPosition()).toEqual({ x: 300, y: 300 })
    })

    it("should start in patrol state", () => {
      expect(shark.container.children[2].text).toBe("Patrolling")
    })

    it("should have default personality", () => {
      const aiState = shark.getAIState()
      expect(aiState.personality).toBe("methodical")
    })
  })

  describe("State Machine", () => {
    it("should transition from patrol to hunting when player is detected", () => {
      // Move player within detection radius (200)
      player.x = 350
      player.y = 350

      shark.update(16, player)

      // Should detect player and switch to hunting
      expect(shark.container.children[2].text).toBe("Hunting!")
    })

    it("should transition from hunting to attacking when close", () => {
      // Set shark to hunting state first
      player.x = 350
      player.y = 350
      shark.update(16, player) // Detect player

      // Move player very close (within attack radius)
      player.x = 310
      player.y = 310

      // Update multiple times to close distance
      for (let i = 0; i < 10; i++) {
        shark.update(16, player)
      }

      expect(shark.container.children[2].text).toBe("ATTACK!")
    })

    it("should return to patrol when player escapes", () => {
      // Get shark hunting
      player.x = 350
      player.y = 350
      shark.update(16, player)

      // Move player far away
      player.x = 1000
      player.y = 1000
      shark.update(16, player)

      expect(shark.container.children[2].text).toBe("Patrolling")
    })

    it("should handle null player", () => {
      shark.update(16, null)

      // Should remain in patrol
      expect(shark.container.children[2].text).toBe("Patrolling")
    })
  })

  describe("Movement Behaviors", () => {
    it("should patrol randomly", () => {
      const initialX = shark.x
      const initialY = shark.y

      // Update many times
      for (let i = 0; i < 50; i++) {
        shark.update(16, null)
      }

      // Should have moved
      expect(shark.x).not.toBe(initialX)
      expect(shark.y).not.toBe(initialY)
    })

    it("should chase player when hunting", () => {
      player.x = 400
      player.y = 400

      // Trigger hunting
      shark.update(16, player)

      const startDistance = Math.hypot(player.x - shark.x, player.y - shark.y)

      // Update multiple times
      for (let i = 0; i < 10; i++) {
        shark.update(16, player)
      }

      const endDistance = Math.hypot(player.x - shark.x, player.y - shark.y)

      // Should be closer to player
      expect(endDistance).toBeLessThan(startDistance)
    })

    it("should apply friction to movement", () => {
      shark.vx = 10
      shark.vy = 10

      shark.update(16, null)

      expect(shark.vx).toBeLessThan(10)
      expect(shark.vy).toBeLessThan(10)
    })

    it("should rotate based on movement direction", () => {
      // Force movement in a specific direction
      shark.vx = 5
      shark.vy = 5

      shark.update(16, null)

      expect(shark.container.rotation).not.toBe(0)
    })
  })

  describe("Stun Mechanics", () => {
    it("should enter stunned state", () => {
      shark.stun(1000)

      expect(shark.container.children[2].text).toBe("Stunned")
    })

    it("should recover from stun after duration", () => {
      shark.stun(100) // Short stun

      // Update multiple times to pass stun duration
      for (let i = 0; i < 10; i++) {
        shark.update(16, null)
      }

      expect(shark.container.children[2].text).toBe("Patrolling")
    })

    it("should drift randomly while stunned", () => {
      shark.stun(1000)

      const initialX = shark.x
      const initialY = shark.y

      // Update while stunned
      for (let i = 0; i < 5; i++) {
        shark.update(16, null)
      }

      // Position should change slightly
      const moved = Math.abs(shark.x - initialX) > 0.1 || Math.abs(shark.y - initialY) > 0.1
      expect(moved).toBe(true)
    })
  })

  describe("AI Integration", () => {
    it("should accept AI controller", () => {
      const mockController = {
        getDecision: vi.fn(),
      } as unknown as SharkAIController

      shark.setAIController(mockController)

      // Should not throw
      expect(() => shark.update(16, player)).not.toThrow()
    })

    it("should poll AI for decisions", async () => {
      const mockDecision: AIDecision = {
        action: "hunt",
        targetPlayerId: "player1",
        reasoning: "Player detected",
        confidence: 0.8,
        personalityInfluence: "Methodical approach",
      }

      const mockController = {
        getDecision: vi.fn().mockResolvedValue(mockDecision),
      } as unknown as SharkAIController

      shark.setAIController(mockController)

      // Wait for AI decision interval to pass
      vi.useFakeTimers()
      vi.advanceTimersByTime(3000)

      shark.update(16, player, {})

      // Allow promises to resolve
      await vi.runAllTimersAsync()

      expect(mockController.getDecision).toHaveBeenCalled()

      vi.useRealTimers()
    })

    it("should apply AI decisions to behavior", async () => {
      const mockDecision: AIDecision = {
        action: "retreat",
        reasoning: "Low health",
        confidence: 0.9,
        personalityInfluence: "Self-preservation",
      }

      const mockController = {
        getDecision: vi.fn().mockResolvedValue(mockDecision),
      } as unknown as SharkAIController

      shark.setAIController(mockController)

      // Manually trigger AI decision polling
      vi.useFakeTimers()
      vi.advanceTimersByTime(3000)

      shark.update(16, player, {})
      await vi.runAllTimersAsync()

      // Next update should apply the decision
      shark.update(16, player, {})

      // Shark should move away from player (retreat)
      const initialDistance = Math.hypot(player.x - shark.x, player.y - shark.y)

      for (let i = 0; i < 5; i++) {
        shark.update(16, player, {})
      }

      const finalDistance = Math.hypot(player.x - shark.x, player.y - shark.y)

      // Should be further from player
      expect(finalDistance).toBeGreaterThan(initialDistance)

      vi.useRealTimers()
    })
  })

  describe("Personality System", () => {
    it("should set personality", () => {
      shark.setPersonality("vengeful")

      const aiState = shark.getAIState()
      expect(aiState.personality).toBe("vengeful")
    })

    it("should update AI thought when setting personality", () => {
      const thoughtText = shark.container.children[3] as any

      shark.setPersonality("theatrical")

      expect(thoughtText.text).toContain("theatrical")
    })
  })

  describe("Internal State", () => {
    it("should track hunger and rage", () => {
      const initialState = shark.getAIState()

      expect(initialState.hunger).toBe(50)
      expect(initialState.rage).toBe(0)
    })

    it("should update internal state based on actions", async () => {
      const huntDecision: AIDecision = {
        action: "hunt",
        targetPlayerId: "player1",
        reasoning: "Hunting",
        confidence: 0.8,
        personalityInfluence: "Aggressive",
      }

      const mockController = {
        getDecision: vi.fn().mockResolvedValue(huntDecision),
      } as unknown as SharkAIController

      shark.setAIController(mockController)

      // Trigger AI decision
      vi.useFakeTimers()
      vi.advanceTimersByTime(3000)

      shark.update(16, player, {})
      await vi.runAllTimersAsync()

      // Apply decision
      shark.update(16, player, {})

      const state = shark.getAIState()

      // Hunger and rage should increase from hunting
      expect(state.hunger).toBeGreaterThan(50)
      expect(state.rage).toBeGreaterThan(0)

      vi.useRealTimers()
    })
  })

  describe("Bounds and Collision", () => {
    it("should return correct bounds", () => {
      const bounds = shark.getBounds()

      expect(bounds).toEqual({
        x: 280, // 300 - 20
        y: 260, // 300 - 40
        width: 40,
        height: 80,
      })
    })

    it("should detect collision with player", () => {
      // Put player very close
      player.x = 305
      player.y = 305

      // Trigger attack
      shark.update(16, player) // Detect
      for (let i = 0; i < 20; i++) {
        shark.update(16, player) // Chase and attack
      }

      // Shark should move toward player position during attack sequence
      const distanceToPlayer = Math.sqrt(
        Math.pow(shark.x - player.x, 2) + Math.pow(shark.y - player.y, 2)
      )
      // After chasing, shark should be close to player
      expect(distanceToPlayer).toBeLessThan(100)
    })
  })

  describe("AI Thought Display", () => {
    it("should display AI thoughts temporarily", () => {
      vi.useFakeTimers()

      const thoughtText = shark.container.children[3] as any

      // Set a thought
      shark.setPersonality("philosophical")
      expect(thoughtText.text).toContain("philosophical")

      // Advance time
      vi.advanceTimersByTime(6000)

      // Thought should be cleared
      expect(thoughtText.text).toBe("")

      vi.useRealTimers()
    })
  })

  describe("Edge Cases", () => {
    it("should handle AI decision errors gracefully", async () => {
      const mockController = {
        getDecision: vi.fn().mockRejectedValue(new Error("AI Error")),
      } as unknown as SharkAIController

      shark.setAIController(mockController)

      const consoleSpy = vi.spyOn(console, "error")

      vi.useFakeTimers()
      vi.advanceTimersByTime(3000)

      // Should not throw
      expect(() => shark.update(16, player, {})).not.toThrow()

      await vi.runAllTimersAsync()

      expect(consoleSpy).toHaveBeenCalledWith("[Game]", "Error polling AI decision:", expect.any(Error))

      consoleSpy.mockRestore()
      vi.useRealTimers()
    })

    it("should handle missing AI controller", () => {
      // No AI controller set
      expect(() => shark.update(16, player)).not.toThrow()
    })

    it("should continue functioning when stunned regardless of AI", () => {
      const mockController = {
        getDecision: vi.fn().mockResolvedValue({
          action: "hunt",
          targetPlayerId: "test",
          reasoning: "Test",
          confidence: 0.8,
          personalityInfluence: "Test",
        }),
      } as unknown as SharkAIController

      shark.setAIController(mockController)
      shark.stun(1000)

      // Shark should stay stunned even if AI is polled
      vi.useFakeTimers()
      vi.advanceTimersByTime(3000)

      shark.update(16, player)

      // Shark should remain in stunned state (AI decision not applied)
      expect(shark.container.children[2].text).toBe("Stunned")

      vi.useRealTimers()
    })
  })
})
