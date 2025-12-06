import { useConvex, useMutation } from "convex/react"
import { useCallback, useState } from "react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type { MemoryPattern, SharkMemory } from "@/convex/types"

interface PatternObservation {
  playerId: string
  userId: string
  pattern: {
    type: "hiding_spot" | "escape_route" | "ability_timing" | "behavior_pattern"
    data: any
    timestamp: number
  }
}

export function useSharkMemory() {
  const convex = useConvex()
  const [memories, setMemories] = useState<Map<string, SharkMemory>>(new Map())
  const [patterns, setPatterns] = useState<Map<string, MemoryPattern[]>>(new Map())
  const [isLoading, setIsLoading] = useState(false)

  // Mutations
  const updateMemory = useMutation(api.sharkAI.updateSharkMemory)
  const recordPrediction = useMutation(api.aiSync.recordPredictionOutcome)

  // Load memories for a shark user
  const loadMemories = useCallback(
    async (sharkUserId: string) => {
      setIsLoading(true)
      try {
        const sharkMemories = await convex.query(api.sharkAI.getSharkMemories, {
          sharkUserId,
          limit: 50,
        })

        const memoryMap = new Map<string, SharkMemory>()
        const patternMap = new Map<string, MemoryPattern[]>()

        sharkMemories.forEach((memory) => {
          memoryMap.set(memory.targetUserId, memory)
          if (memory.patterns.length > 0) {
            patternMap.set(memory.targetUserId, memory.patterns as MemoryPattern[])
          }
        })

        setMemories(memoryMap)
        setPatterns(patternMap)
      } catch (error) {
        console.error("Error loading shark memories:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [convex]
  )

  // Save a new observation about a player
  const saveObservation = useCallback(
    async (
      sharkUserId: string,
      targetUserId: string,
      gameId: Id<"games">,
      observation: PatternObservation
    ) => {
      try {
        // Analyze observation for patterns
        const pattern = analyzeObservationForPattern(observation)

        await updateMemory({
          sharkUserId,
          targetUserId,
          gameId,
          encounter: {
            type: "hunt",
            success: false,
            pattern: pattern || undefined,
          },
        })

        // Update local state
        const currentMemory = memories.get(targetUserId)
        if (currentMemory && pattern) {
          const updatedPatterns = [...((currentMemory.patterns || []) as MemoryPattern[]), pattern]
          setPatterns((prev) => new Map(prev).set(targetUserId, updatedPatterns))
        }
      } catch (error) {
        console.error("Error saving observation:", error)
      }
    },
    [updateMemory, memories]
  )

  // Get memory for a specific player
  const getMemoryForPlayer = useCallback(
    (userId: string): SharkMemory | undefined => {
      return memories.get(userId)
    },
    [memories]
  )

  // Get patterns for a specific player
  const getPatternsForPlayer = useCallback(
    (userId: string): MemoryPattern[] => {
      return patterns.get(userId) || []
    },
    [patterns]
  )

  // Check if a player behavior matches a known pattern
  const checkPattern = useCallback(
    (userId: string, currentBehavior: { position: any; action: string }): MemoryPattern | null => {
      const playerPatterns = patterns.get(userId) || []

      for (const pattern of playerPatterns) {
        if (pattern.confidence < 0.6) {
          continue // Skip low confidence patterns
        }

        switch (pattern.type) {
          case "hiding_spot":
            if (isNearHidingSpot(currentBehavior.position, pattern.data)) {
              return pattern
            }
            break

          case "escape_route":
            if (matchesEscapeRoute(currentBehavior.position, pattern.data)) {
              return pattern
            }
            break

          case "ability_timing":
            if (matchesAbilityTiming(currentBehavior.action, pattern.data)) {
              return pattern
            }
            break

          case "behavior_pattern":
            if (matchesBehaviorPattern(currentBehavior, pattern.data)) {
              return pattern
            }
            break
        }
      }

      return null
    },
    [patterns]
  )

  // Record whether a pattern prediction was accurate
  const recordPatternAccuracy = useCallback(
    async (
      gameId: Id<"games">,
      sharkUserId: string,
      targetUserId: string,
      pattern: MemoryPattern,
      wasAccurate: boolean
    ) => {
      await recordPrediction({
        gameId,
        sharkUserId,
        targetUserId,
        prediction: {
          type: pattern.type,
          predicted: pattern.data,
          actual: pattern.data, // In real implementation, this would be the actual behavior
          accurate: wasAccurate,
        },
      })
    },
    [recordPrediction]
  )

  return {
    memories,
    patterns,
    isLoading,
    loadMemories,
    saveObservation,
    getMemoryForPlayer,
    getPatternsForPlayer,
    checkPattern,
    recordPatternAccuracy,
  }
}

// Helper functions for pattern analysis
function analyzeObservationForPattern(observation: PatternObservation): MemoryPattern | null {
  const { pattern } = observation

  // Simple pattern detection logic - in a real implementation this would be more sophisticated
  if (pattern.type === "hiding_spot") {
    return {
      type: "hiding_spot",
      data: {
        location: pattern.data.location,
        frequency: 1,
      },
      confidence: 0.5,
    }
  }

  if (pattern.type === "escape_route") {
    return {
      type: "escape_route",
      data: {
        path: pattern.data.path,
        successRate: 0.5,
      },
      confidence: 0.6,
    }
  }

  return null
}

function isNearHidingSpot(position: any, hidingSpotData: any): boolean {
  if (!hidingSpotData.location) {
    return false
  }

  const distance = Math.sqrt(
    (position.x - hidingSpotData.location.x) ** 2 + (position.y - hidingSpotData.location.y) ** 2
  )

  return distance < 50 // Within 50 units of hiding spot
}

function matchesEscapeRoute(position: any, routeData: any): boolean {
  if (!routeData.path || routeData.path.length === 0) {
    return false
  }

  // Check if position is along the escape route path
  for (const waypoint of routeData.path) {
    const distance = Math.sqrt((position.x - waypoint.x) ** 2 + (position.y - waypoint.y) ** 2)

    if (distance < 30) {
      return true
    }
  }

  return false
}

function matchesAbilityTiming(action: string, timingData: any): boolean {
  // Check if ability use matches expected timing pattern
  return action === "ability" && timingData.expectedAction === "ability"
}

function matchesBehaviorPattern(behavior: any, patternData: any): boolean {
  // Check if current behavior matches known pattern
  return patternData.behaviorType === behavior.action
}
