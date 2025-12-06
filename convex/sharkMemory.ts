import { v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"

// Store a new shark observation about a player
export const recordObservation = mutation({
  args: {
    sharkUserId: v.string(),
    targetUserId: v.string(),
    observation: v.object({
      type: v.string(), // "hiding_spot", "escape_route", "ability_timing", "movement_pattern"
      data: v.any(),
      position: v.object({
        x: v.number(),
        y: v.number(),
        z: v.number(),
      }),
      gameId: v.id("games"),
      confidence: v.number(), // 0-1
    }),
  },
  handler: async (ctx, args) => {
    const { sharkUserId, targetUserId, observation } = args

    // Get existing memory or create new one
    const existingMemory = await ctx.db
      .query("sharkMemories")
      .withIndex("by_shark_target", (q) =>
        q.eq("sharkUserId", sharkUserId).eq("targetUserId", targetUserId)
      )
      .first()

    if (existingMemory) {
      // Update existing memory with new observation
      const patterns = existingMemory.patterns || []

      // Check if we already have this pattern type
      const existingPatternIndex = patterns.findIndex((p) => p.type === observation.type)

      if (existingPatternIndex >= 0 && patterns[existingPatternIndex]) {
        // Update confidence based on repeated observation
        patterns[existingPatternIndex]!.confidence = Math.min(
          1,
          patterns[existingPatternIndex]!.confidence + 0.1
        )
        patterns[existingPatternIndex]!.data = observation.data
      } else {
        // Add new pattern
        patterns.push({
          type: observation.type,
          data: observation.data,
          confidence: observation.confidence,
        })
      }

      await ctx.db.patch(existingMemory._id, {
        patterns,
        encounters: existingMemory.encounters + 1,
        lastEncounter: Date.now(),
      })

      return existingMemory._id
    } else {
      // Create new memory
      const memoryId = await ctx.db.insert("sharkMemories", {
        sharkUserId,
        targetUserId,
        encounters: 1,
        successfulHunts: 0,
        escapes: 0,
        patterns: [
          {
            type: observation.type,
            data: observation.data,
            confidence: observation.confidence,
          },
        ],
        relationship: "neutral",
        memorableMoments: [],
        firstEncounter: Date.now(),
        lastEncounter: Date.now(),
        totalGamesPlayed: 1,
      })

      return memoryId
    }
  },
})

// Record hunt outcome (success or escape)
export const recordHuntOutcome = mutation({
  args: {
    sharkUserId: v.string(),
    targetUserId: v.string(),
    success: v.boolean(),
    gameId: v.id("games"),
    memorable: v.optional(
      v.object({
        description: v.string(),
        intensity: v.number(), // 0-10
      })
    ),
  },
  handler: async (ctx, args) => {
    const { sharkUserId, targetUserId, success, gameId, memorable } = args

    const memory = await ctx.db
      .query("sharkMemories")
      .withIndex("by_shark_target", (q) =>
        q.eq("sharkUserId", sharkUserId).eq("targetUserId", targetUserId)
      )
      .first()

    if (!memory) {
      throw new Error("No memory found for this shark-target pair")
    }

    const updates: Partial<Doc<"sharkMemories">> = {
      successfulHunts: success ? memory.successfulHunts + 1 : memory.successfulHunts,
      escapes: success ? memory.escapes : memory.escapes + 1,
      lastEncounter: Date.now(),
    }

    // Add memorable moment if provided
    if (memorable) {
      const memorableMoments = [...memory.memorableMoments]
      memorableMoments.push({
        gameId,
        description: memorable.description,
        intensity: memorable.intensity,
        timestamp: Date.now(),
      })
      updates.memorableMoments = memorableMoments
    }

    // Update relationship based on outcomes
    const huntRatio = memory.successfulHunts / (memory.successfulHunts + memory.escapes + 1)
    const totalEncounters = memory.encounters + 1

    if (memory.escapes > memory.successfulHunts && totalEncounters > 5) {
      updates.relationship = "rival"
    } else if (memory.escapes > memory.successfulHunts * 2 && totalEncounters > 10) {
      updates.relationship = "nemesis"
    } else if (huntRatio > 0.8 && totalEncounters > 5) {
      updates.relationship = "favorite_snack"
    } else if (memory.escapes > 3 && huntRatio < 0.3) {
      updates.relationship = "respected"
    }

    await ctx.db.patch(memory._id, updates)
  },
})

// Get player patterns for a specific shark-target pair
export const getPlayerPatterns = query({
  args: {
    sharkUserId: v.string(),
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db
      .query("sharkMemories")
      .withIndex("by_shark_target", (q) =>
        q.eq("sharkUserId", args.sharkUserId).eq("targetUserId", args.targetUserId)
      )
      .first()

    if (!memory) {
      return null
    }

    return {
      patterns: memory.patterns.filter((p) => p.confidence > 0.5), // Only return confident patterns
      relationship: memory.relationship,
      encounters: memory.encounters,
      huntSuccess: memory.successfulHunts / (memory.successfulHunts + memory.escapes || 1),
      memorableMoments: memory.memorableMoments.slice(-5), // Last 5 memorable moments
    }
  },
})

// Get grudge levels for all players the shark has encountered
export const getGrudgeLevels = query({
  args: {
    sharkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query("sharkMemories")
      .withIndex("by_shark", (q) => q.eq("sharkUserId", args.sharkUserId))
      .collect()

    // Calculate grudge level based on escapes and memorable moments
    const grudges = memories.map((memory) => {
      const escapeRatio = memory.escapes / (memory.encounters || 1)
      const memorableIntensity =
        memory.memorableMoments.reduce((sum, moment) => sum + moment.intensity, 0) /
        (memory.memorableMoments.length || 1)

      // Grudge level calculation
      let grudgeLevel = 0
      if (memory.relationship === "nemesis") {
        grudgeLevel = 10
      } else if (memory.relationship === "rival") {
        grudgeLevel = 7
      } else if (memory.relationship === "respected") {
        grudgeLevel = 5
      } else {
        grudgeLevel = escapeRatio * 5 + memorableIntensity * 0.5
      }

      return {
        targetUserId: memory.targetUserId,
        grudgeLevel: Math.min(10, grudgeLevel),
        relationship: memory.relationship,
        lastEncounter: memory.lastEncounter,
        patterns: memory.patterns.filter((p) => p.confidence > 0.7),
      }
    })

    // Sort by grudge level (highest first)
    return grudges.sort((a, b) => b.grudgeLevel - a.grudgeLevel)
  },
})

// Pattern recognition query - find similar patterns across all memories
export const findSimilarPatterns = query({
  args: {
    sharkUserId: v.string(),
    patternType: v.string(),
    threshold: v.optional(v.number()), // Confidence threshold, default 0.6
  },
  handler: async (ctx, args) => {
    const threshold = args.threshold || 0.6

    const memories = await ctx.db
      .query("sharkMemories")
      .withIndex("by_shark", (q) => q.eq("sharkUserId", args.sharkUserId))
      .collect()

    // Collect all patterns of the specified type
    const patterns: Array<{
      targetUserId: string
      pattern: any
      confidence: number
    }> = []

    memories.forEach((memory) => {
      const relevantPatterns = memory.patterns.filter(
        (p) => p.type === args.patternType && p.confidence >= threshold
      )

      relevantPatterns.forEach((pattern) => {
        patterns.push({
          targetUserId: memory.targetUserId,
          pattern: pattern.data,
          confidence: pattern.confidence,
        })
      })
    })

    return patterns
  },
})

// Get comprehensive memory stats for a shark
export const getSharkMemoryStats = query({
  args: {
    sharkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query("sharkMemories")
      .withIndex("by_shark", (q) => q.eq("sharkUserId", args.sharkUserId))
      .collect()

    if (memories.length === 0) {
      return null
    }

    const totalHunts = memories.reduce((sum, m) => sum + m.successfulHunts, 0)
    const totalEscapes = memories.reduce((sum, m) => sum + m.escapes, 0)
    const totalEncounters = memories.reduce((sum, m) => sum + m.encounters, 0)

    const relationships = memories.reduce(
      (acc, m) => {
        acc[m.relationship] = (acc[m.relationship] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const patternTypes = new Set<string>()
    memories.forEach((m) => {
      m.patterns.forEach((p) => patternTypes.add(p.type))
    })

    return {
      totalMemories: memories.length,
      totalHunts,
      totalEscapes,
      totalEncounters,
      successRate: totalHunts / (totalHunts + totalEscapes || 1),
      relationships,
      uniquePatternTypes: Array.from(patternTypes),
      mostMemorableVictim: memories.sort(
        (a, b) => b.memorableMoments.length - a.memorableMoments.length
      )[0]?.targetUserId,
    }
  },
})

// Update pattern confidence based on validation
export const updatePatternConfidence = mutation({
  args: {
    sharkUserId: v.string(),
    targetUserId: v.string(),
    patternType: v.string(),
    validated: v.boolean(), // Whether the pattern prediction was correct
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db
      .query("sharkMemories")
      .withIndex("by_shark_target", (q) =>
        q.eq("sharkUserId", args.sharkUserId).eq("targetUserId", args.targetUserId)
      )
      .first()

    if (!memory) {
      return
    }

    const patterns = [...memory.patterns]
    const patternIndex = patterns.findIndex((p) => p.type === args.patternType)

    if (patternIndex >= 0 && patterns[patternIndex]) {
      // Adjust confidence based on validation
      const adjustment = args.validated ? 0.1 : -0.15
      patterns[patternIndex]!.confidence = Math.max(
        0,
        Math.min(1, patterns[patternIndex]!.confidence + adjustment)
      )

      await ctx.db.patch(memory._id, { patterns })
    }
  },
})
