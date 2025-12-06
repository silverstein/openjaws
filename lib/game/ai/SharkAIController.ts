import { ConvexClient } from "convex/browser"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type { Position, SharkPersonality } from "@/convex/types"
import type { AIDecision } from "../entities/Shark"

interface PlayerInfo {
  position: Position
  health: number
  stamina: number
  archetype: string
  userId: string
}

interface SharkStateInfo {
  position: Position
  currentState: string
  hunger: number
  rage: number
  personality: SharkPersonality
}

interface DecisionContext {
  sharkState: SharkStateInfo
  playerState: PlayerInfo | null
  gameState: any
}

export class SharkAIController {
  private convexClient: ConvexClient
  private gameId: Id<"games">
  private sharkPlayerId: Id<"players">
  private sharkUserId: string
  private decisionCache: AIDecision | null = null
  private memories: Map<string, any> = new Map()
  private patternTracker: Map<string, PatternData> = new Map()
  private useAIBrain: boolean = true // Toggle between AI service and local logic

  constructor(
    convexUrl: string,
    gameId: Id<"games">,
    sharkPlayerId: Id<"players">,
    sharkUserId: string
  ) {
    this.convexClient = new ConvexClient(convexUrl)
    this.gameId = gameId
    this.sharkPlayerId = sharkPlayerId
    this.sharkUserId = sharkUserId
  }

  async initialize(): Promise<void> {
    // Load shark memories from Convex
    const memories = await this.convexClient.query(api.sharkAI.getSharkMemories, {
      sharkUserId: this.sharkUserId,
      limit: 20,
    })

    // Cache memories locally for quick access
    memories.forEach((memory) => {
      this.memories.set(memory.targetUserId, memory)
    })
  }

  async getDecision(context: DecisionContext): Promise<AIDecision | null> {
    try {
      // Try to use the AI brain service first
      if (this.useAIBrain && context.playerState) {
        const aiDecision = await this.getAIBrainDecision(context)
        if (aiDecision) {
          this.decisionCache = aiDecision
          return aiDecision
        }
      }

      // Fallback to Convex recommendations
      const recommendations = await this.convexClient.query(api.aiSync.getAIRecommendations, {
        gameId: this.gameId,
        sharkPlayerId: this.sharkPlayerId,
      })

      if (!recommendations) {
        return this.makeDefaultDecision(context)
      }

      // Analyze context and recommendations
      const decision = this.analyzeAndDecide(context, recommendations)

      // Sync decision with backend
      await this.convexClient.mutation(api.aiSync.syncSharkDecision, {
        gameId: this.gameId,
        sharkPlayerId: this.sharkPlayerId,
        decision: {
          targetPlayerId: context.playerState ? this.sharkPlayerId : undefined, // This needs player ID mapping
          action: decision.action,
          reasoning: decision.reasoning,
          confidence: decision.confidence,
          personalityInfluence: decision.personalityInfluence,
        },
        aiState: {
          hunger: context.sharkState.hunger,
          rage: context.sharkState.rage,
          currentMode: context.sharkState.currentState,
          memoryInfluence: this.getMemoryInfluence(context.playerState?.userId),
        },
      })

      // Track patterns
      if (context.playerState) {
        this.trackPlayerPattern(context.playerState)
      }

      this.decisionCache = decision

      return decision
    } catch (error) {
      console.error("Error getting AI decision:", error)
      return this.makeDefaultDecision(context)
    }
  }

  private analyzeAndDecide(context: DecisionContext, recommendations: any): AIDecision {
    const { sharkState, playerState } = context
    const topTarget = recommendations.recommendations[0]

    // Base decision on personality
    let action: AIDecision["action"] = "patrol"
    let reasoning = "Searching for prey..."
    let confidence = 0.5
    let personalityInfluence = ""

    switch (sharkState.personality) {
      case "methodical":
        // Careful, calculated approach
        if (topTarget && topTarget.opportunityScore > 60) {
          action = "hunt"
          reasoning = "Target identified. Calculating optimal approach vector."
          confidence = topTarget.opportunityScore / 100
          personalityInfluence = "Methodical: Waiting for perfect opportunity"
        } else {
          action = "patrol"
          reasoning = "Insufficient data. Continuing systematic search pattern."
          personalityInfluence = "Methodical: Gathering more information"
        }
        break

      case "theatrical":
        // Dramatic, showy behavior
        if (playerState && topTarget) {
          if (topTarget.distance < 100) {
            action = "taunt"
            reasoning = "Time for a dramatic entrance! *cue Jaws theme*"
            confidence = 0.8
            personalityInfluence = "Theatrical: Making it cinematic"
          } else {
            action = "hunt"
            reasoning = "Setting up for the perfect dramatic reveal..."
            confidence = 0.7
            personalityInfluence = "Theatrical: Building suspense"
          }
        }
        break

      case "vengeful":
        // Focuses on nemesis targets
        if (topTarget && topTarget.memory?.relationship === "nemesis") {
          action = "hunt"
          reasoning = `YOU! You've escaped me ${topTarget.memory.escapes} times. NOT TODAY!`
          confidence = 0.9
          personalityInfluence = "Vengeful: Pursuing old grudges"
        } else if (sharkState.rage > 70) {
          action = "hunt"
          reasoning = "RAGE MODE ACTIVATED. Someone will pay!"
          confidence = 0.85
          personalityInfluence = "Vengeful: Rage-driven pursuit"
        }
        break

      case "philosophical":
        // Contemplative, pattern-focused
        if (topTarget && topTarget.patterns.length > 0) {
          action = "ambush"
          reasoning = `Ah, the patterns reveal themselves. They always go ${topTarget.patterns[0].type}...`
          confidence = topTarget.patterns[0].confidence
          personalityInfluence = "Philosophical: Using pattern knowledge"
        } else {
          action = "patrol"
          reasoning = "The ocean teaches patience. Their patterns will emerge..."
          personalityInfluence = "Philosophical: Observing and learning"
        }
        break

      case "meta":
        // Self-aware, breaks fourth wall
        if (playerState) {
          if (playerState.health < 50) {
            action = "hunt"
            reasoning = "Low health bar detected. Classic video game vulnerability!"
            confidence = 0.8
            personalityInfluence = "Meta: Exploiting game mechanics"
          } else if (sharkState.hunger > 80) {
            action = "hunt"
            reasoning = "My hunger meter is almost full. Time for a snack cutscene!"
            confidence = 0.75
            personalityInfluence = "Meta: Following game logic"
          }
        }
        break
    }

    // Adjust for hunger and rage
    if (sharkState.hunger > 90 && action === "patrol") {
      action = "hunt"
      reasoning += " STARVING!"
      confidence = Math.min(confidence + 0.2, 1)
    }

    if (sharkState.rage > 80) {
      confidence = Math.min(confidence + 0.15, 1)
      reasoning += " *ENRAGED*"
    }

    return {
      action,
      targetPlayerId: playerState?.userId,
      reasoning,
      confidence,
      personalityInfluence,
    }
  }

  private makeDefaultDecision(context: DecisionContext): AIDecision {
    // Fallback decision when AI service is unavailable
    const { sharkState } = context

    if (sharkState.hunger > 70) {
      return {
        action: "hunt",
        reasoning: "Hungry... must find food...",
        confidence: 0.6,
        personalityInfluence: "Instinct-driven",
      }
    }

    return {
      action: "patrol",
      reasoning: "Searching the waters...",
      confidence: 0.5,
      personalityInfluence: "Default behavior",
    }
  }

  private getMemoryInfluence(targetUserId?: string): any {
    if (!targetUserId) {
      return undefined
    }

    const memory = this.memories.get(targetUserId)
    if (!memory) {
      return undefined
    }

    return {
      targetUserId,
      patternUsed: memory.patterns[0]?.type || "none",
      grudgeLevel:
        memory.relationship === "nemesis" ? 1 : memory.relationship === "rival" ? 0.5 : 0,
    }
  }

  private trackPlayerPattern(player: PlayerInfo): void {
    const patternKey = `${player.userId}_position`

    if (!this.patternTracker.has(patternKey)) {
      this.patternTracker.set(patternKey, {
        positions: [],
        lastUpdate: Date.now(),
      })
    }

    const pattern = this.patternTracker.get(patternKey)!
    pattern.positions.push(player.position)

    // Keep only last 10 positions
    if (pattern.positions.length > 10) {
      pattern.positions.shift()
    }

    // Analyze for patterns
    if (pattern.positions.length >= 5) {
      this.analyzeMovementPattern(player.userId, pattern.positions)
    }
  }

  private analyzeMovementPattern(userId: string, positions: Position[]): void {
    // Simple pattern detection - check for circular movement
    const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length
    const centerY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length

    const avgDistance =
      positions.reduce((sum, p) => {
        const dx = p.x - centerX
        const dy = p.y - centerY
        return sum + Math.sqrt(dx * dx + dy * dy)
      }, 0) / positions.length

    const variance =
      positions.reduce((sum, p) => {
        const dx = p.x - centerX
        const dy = p.y - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)
        return sum + (distance - avgDistance) ** 2
      }, 0) / positions.length

    // Low variance suggests circular movement
    if (variance < 100) {
      this.recordPattern(userId, "circular_movement", {
        center: { x: centerX, y: centerY },
        radius: avgDistance,
      })
    }
  }

  private async recordPattern(userId: string, patternType: string, data: any): Promise<void> {
    try {
      await this.convexClient.mutation(api.sharkAI.updateSharkMemory, {
        sharkUserId: this.sharkUserId,
        targetUserId: userId,
        gameId: this.gameId,
        encounter: {
          type: "hunt",
          success: false,
          pattern: {
            type: patternType,
            data,
            confidence: 0.7,
          },
        },
      })
    } catch (error) {
      console.error("Error recording pattern:", error)
    }
  }

  async recordEncounter(
    targetUserId: string,
    type: "hunt" | "escape" | "taunt",
    success: boolean,
    memorableMoment?: { description: string; intensity: number }
  ): Promise<void> {
    try {
      await this.convexClient.mutation(api.sharkAI.updateSharkMemory, {
        sharkUserId: this.sharkUserId,
        targetUserId,
        gameId: this.gameId,
        encounter: {
          type,
          success,
          memorableMoment,
        },
      })

      // Update local cache
      const memory = await this.convexClient.query(api.sharkAI.getSharkMemoryForPlayer, {
        sharkUserId: this.sharkUserId,
        targetUserId,
      })

      if (memory) {
        this.memories.set(targetUserId, memory)
      }
    } catch (error) {
      console.error("Error recording encounter:", error)
    }
  }

  getMemoryForPlayer(userId: string): any {
    return this.memories.get(userId)
  }

  getCurrentDecision(): AIDecision | null {
    return this.decisionCache
  }

  private async getAIBrainDecision(context: DecisionContext): Promise<AIDecision | null> {
    try {
      // Prepare context for AI brain
      const gameContext = {
        personality: context.sharkState.personality,
        hunger: context.sharkState.hunger,
        rage: context.sharkState.rage,
        waterLevel: context.gameState.waterLevel || "calm",
        roundPhase: "active",
        timeRemaining: context.gameState.timeRemaining || 300,
        nearbyPlayers: context.playerState
          ? [
              {
                id: context.playerState.userId,
                name: `Player_${context.playerState.archetype}`,
                distance: this.calculateDistance(
                  context.sharkState.position,
                  context.playerState.position
                ),
                health: context.playerState.health,
                stamina: context.playerState.stamina,
                archetype: context.playerState.archetype,
                isMoving:
                  Math.abs(context.playerState.position.x) > 0.1 ||
                  Math.abs(context.playerState.position.y) > 0.1,
              },
            ]
          : [],
        memories: Array.from(this.memories.values()),
      }

      const aiResponse = await callSharkBrainAPI(gameContext)

      if (!aiResponse) {
        return null
      }

      // Convert AI response to our decision format
      return {
        action: this.mapAIActionToDecision(aiResponse.action),
        targetPlayerId: context.playerState?.userId,
        reasoning: aiResponse.reasoning || "Hunting...",
        confidence: aiResponse.confidence || 0.7,
        personalityInfluence: `${context.sharkState.personality}: ${aiResponse.personalityNote || "Following instincts"}`,
      }
    } catch (error) {
      console.error("Error getting AI brain decision:", error)
      return null
    }
  }

  private mapAIActionToDecision(aiAction: string): AIDecision["action"] {
    const actionMap: Record<string, AIDecision["action"]> = {
      charge: "hunt",
      stalk: "ambush",
      circle: "taunt",
      investigate: "patrol",
      retreat: "retreat",
    }

    return actionMap[aiAction] || "patrol"
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x
    const dy = pos1.y - pos2.y
    const dz = pos1.z - pos2.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
}

interface PatternData {
  positions: Position[]
  lastUpdate: number
}

// Helper to call the shark brain API
async function callSharkBrainAPI(context: any): Promise<any> {
  try {
    const response = await fetch("/api/shark-brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "decide",
        context,
      }),
    })

    if (!response.ok) {
      throw new Error("Shark brain API error")
    }

    return await response.json()
  } catch (error) {
    console.error("Error calling shark brain API:", error)
    return null
  }
}
