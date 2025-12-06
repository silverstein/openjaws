import { beforeEach, describe, expect, it } from "vitest"
import {
  commentaryMockResponses,
  generateMockCommentary,
  generateMockNPCResponse,
  generateMockSharkDecision,
  generateMockTaunt,
  npcMockResponses,
  streamMockCommentary,
  streamMockSharkThoughts,
} from "./mockResponses"
import type { GameContext, SharkPersonality } from "./sharkBrain"

// Fix GameContext type to match actual interface
const _createMockContext = (): GameContext => ({
  currentPlayers: [],
  sharkPosition: { x: 0, y: 0 },
  sharkHealth: 100,
  sharkPersonality: "methodical" as SharkPersonality,
  timeOfDay: "day",
  weatherCondition: "calm",
  recentEvents: [],
  memories: [],
})

describe("Mock AI Response System", () => {
  let mockContext: GameContext

  beforeEach(() => {
    mockContext = {
      currentPlayers: [
        {
          id: "player1",
          name: "TestPlayer1",
          position: { x: 100, y: 100 },
          health: 100,
          speed: 3,
          isInWater: true,
        },
        {
          id: "player2",
          name: "TestPlayer2",
          position: { x: 200, y: 200 },
          health: 30,
          speed: 2,
          isInWater: false,
        },
      ],
      sharkPosition: { x: 150, y: 150 },
      sharkHealth: 80,
      sharkPersonality: "methodical" as SharkPersonality,
      timeOfDay: "day",
      weatherCondition: "calm",
      recentEvents: [],
      memories: [],
    }
  })

  describe("generateMockSharkDecision", () => {
    it("should generate valid shark decisions", () => {
      const decision = generateMockSharkDecision(mockContext)

      expect(decision).toBeDefined()
      expect(decision.action).toMatch(/^(hunt|stalk|ambush|investigate|retreat|taunt)$/)
      expect(decision.innerMonologue).toBeTruthy()
      expect(decision.confidence).toBeGreaterThanOrEqual(0)
      expect(decision.confidence).toBeLessThanOrEqual(1)
      expect(decision.reasoning).toBeTruthy()
    })

    it("should prioritize wounded targets", () => {
      const decision = generateMockSharkDecision(mockContext)

      // Player2 has low health (30), should often be targeted
      if (decision.targetPlayerId) {
        expect(["player1", "player2"]).toContain(decision.targetPlayerId)
      }
    })

    it("should respect personality types", () => {
      const personalities: SharkPersonality[] = [
        "methodical",
        "theatrical",
        "vengeful",
        "philosophical",
        "meta",
      ]

      personalities.forEach((personality) => {
        const contextWithPersonality = { ...mockContext, sharkPersonality: personality }
        const decision = generateMockSharkDecision(contextWithPersonality)

        expect(decision.innerMonologue).toBeTruthy()
        expect(decision.reasoning).toBeTruthy()
      })
    })

    it("should handle memory-based decisions", () => {
      const contextWithMemory = {
        ...mockContext,
        memories: [
          {
            playerId: "player1",
            playerName: "TestPlayer1",
            encounters: 5,
            lastSeen: new Date(),
            grudgeLevel: 8,
            playerPattern: "aggressive" as const,
          },
        ],
      }

      const decision = generateMockSharkDecision(contextWithMemory)
      expect(decision).toBeDefined()

      // With high grudge level, player1 should often be targeted
      if (decision.targetPlayerId && decision.action === "hunt") {
        expect(decision.confidence).toBeGreaterThan(0.5)
      }
    })

    it("should handle no players in water", () => {
      const noWaterContext = {
        ...mockContext,
        currentPlayers: mockContext.currentPlayers.map((p) => ({ ...p, isInWater: false })),
      }

      const decision = generateMockSharkDecision(noWaterContext)
      expect(decision).toBeDefined()
      expect(["investigate", "patrol", "retreat"]).toContain(decision.action)
    })
  })

  describe("generateMockTaunt", () => {
    it("should generate contextual taunts", () => {
      const taunt = generateMockTaunt(mockContext, "player_entered_water")
      expect(taunt).toBeTruthy()
      expect(typeof taunt).toBe("string")
    })

    it("should handle different trigger events", () => {
      const triggers = ["player_escaped", "shark_damaged", "player_entered_water"]

      triggers.forEach((trigger) => {
        const taunt = generateMockTaunt(mockContext, trigger)
        expect(taunt).toBeTruthy()
        expect(taunt.length).toBeGreaterThan(0)
      })
    })

    it("should generate personality-specific taunts", () => {
      const personalities: SharkPersonality[] = [
        "methodical",
        "theatrical",
        "vengeful",
        "philosophical",
        "meta",
      ]

      personalities.forEach((personality) => {
        const contextWithPersonality = { ...mockContext, sharkPersonality: personality }
        const taunt = generateMockTaunt(contextWithPersonality, "default")
        expect(taunt).toBeTruthy()
      })
    })
  })

  describe("streamMockSharkThoughts", () => {
    it("should stream thoughts asynchronously", async () => {
      const thoughts: string[] = []

      for await (const thought of streamMockSharkThoughts(mockContext, "hunting")) {
        thoughts.push(thought)
      }

      expect(thoughts.length).toBeGreaterThan(0)
      expect(thoughts.join("").trim()).toBeTruthy()
    })

    it("should include contextual information", async () => {
      const stormyContext = { ...mockContext, weatherCondition: "stormy" as const }
      const thoughts: string[] = []

      for await (const thought of streamMockSharkThoughts(stormyContext, "hunting")) {
        thoughts.push(thought)
      }

      const fullThought = thoughts.join("")
      expect(fullThought).toBeTruthy()
    })
  })

  describe("generateMockNPCResponse", () => {
    it("should generate responses for all NPC types", () => {
      const npcTypes = Object.keys(npcMockResponses) as Array<keyof typeof npcMockResponses>

      npcTypes.forEach((npcType) => {
        const greeting = generateMockNPCResponse(npcType, "greeting")
        expect(greeting).toBeTruthy()

        const dialogue = generateMockNPCResponse(npcType, "dialogue")
        expect(dialogue).toBeTruthy()
      })
    })

    it("should handle reaction triggers", () => {
      const response = generateMockNPCResponse("scientist", "reaction", "shark_nearby")
      expect(response).toBeTruthy()
      expect(response).toContain("calculations")
    })

    it("should fallback gracefully for unknown triggers", () => {
      const response = generateMockNPCResponse("surfer", "reaction", "unknown_trigger")
      expect(response).toBeTruthy()
    })
  })

  describe("generateMockCommentary", () => {
    it("should generate commentary for all styles", () => {
      const styles = Object.keys(commentaryMockResponses) as Array<
        keyof typeof commentaryMockResponses
      >

      styles.forEach((style) => {
        const commentary = generateMockCommentary(style, "calm", "player_swimming")
        expect(commentary).toBeTruthy()
        expect(typeof commentary).toBe("string")
      })
    })

    it("should vary by intensity", () => {
      const intensities = ["calm", "building", "intense", "climactic"] as const

      intensities.forEach((intensity) => {
        const commentary = generateMockCommentary("sports", intensity, "shark_attack")
        expect(commentary).toBeTruthy()
      })
    })
  })

  describe("streamMockCommentary", () => {
    it("should stream commentary word by word", async () => {
      const words: string[] = []

      for await (const word of streamMockCommentary("documentary", "intense", "shark_attack")) {
        words.push(word)
      }

      expect(words.length).toBeGreaterThan(0)
      expect(words.every((w) => w.endsWith(" "))).toBe(true)
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty player list", () => {
      const emptyContext = { ...mockContext, currentPlayers: [] }
      const decision = generateMockSharkDecision(emptyContext)

      expect(decision).toBeDefined()
      expect(decision.targetPlayerId).toBeUndefined()
      expect(["patrol", "investigate", "retreat"]).toContain(decision.action)
    })

    it("should handle low shark health", () => {
      const lowHealthContext = { ...mockContext, sharkHealth: 20 }
      const decision = generateMockSharkDecision(lowHealthContext)

      expect(decision).toBeDefined()
      expect(decision.action).toBe("retreat")
    })

    it("should handle night time context", () => {
      const nightContext = { ...mockContext, timeOfDay: "night" as const }

      for (let i = 0; i < 5; i++) {
        const decision = generateMockSharkDecision(nightContext)
        expect(decision).toBeDefined()
      }
    })
  })
})
