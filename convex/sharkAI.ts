import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { SharkDecisionInput, SharkMemory, MemoryPattern } from "./types";

// Make shark AI decision
export const makeSharkDecision = mutation({
  args: {
    gameId: v.id("games"),
    sharkId: v.id("players"),
    targetPlayerId: v.optional(v.id("players")),
    action: v.union(
      v.literal("hunt"),
      v.literal("patrol"),
      v.literal("ambush"),
      v.literal("retreat"),
      v.literal("taunt")
    ),
    reasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shark = await ctx.db.get(args.sharkId);
    if (!shark || shark.role !== "shark") {
      throw new Error("Invalid shark player");
    }

    // Record the AI decision
    await ctx.db.insert("playerActions", {
      gameId: args.gameId,
      playerId: args.sharkId,
      action: {
        type: "ability",
        data: {
          aiAction: args.action,
          targetPlayerId: args.targetPlayerId,
          reasoning: args.reasoning,
        },
        position: shark.position,
      },
      nearbyPlayers: [],
      inDanger: false,
      timestamp: Date.now(),
      frameNumber: 0,
    });

    // Update shark state based on action
    const updates: any = {
      lastUpdate: Date.now(),
    };

    switch (args.action) {
      case "hunt":
        updates.sharkRage = Math.min(100, (shark.sharkRage || 0) + 10);
        break;
      case "retreat":
        updates.sharkRage = Math.max(0, (shark.sharkRage || 0) - 20);
        updates.sharkHunger = Math.max(0, (shark.sharkHunger || 50) - 5);
        break;
      case "taunt":
        updates.sharkRage = Math.min(100, (shark.sharkRage || 0) + 5);
        break;
    }

    await ctx.db.patch(args.sharkId, updates);

    return { success: true };
  },
});

// Update shark memory about a player
export const updateSharkMemory = mutation({
  args: {
    sharkUserId: v.string(),
    targetUserId: v.string(),
    gameId: v.id("games"),
    encounter: v.object({
      type: v.union(v.literal("hunt"), v.literal("escape"), v.literal("taunt")),
      success: v.boolean(),
      pattern: v.optional(v.object({
        type: v.string(),
        data: v.any(),
        confidence: v.number(),
      })),
      memorableMoment: v.optional(v.object({
        description: v.string(),
        intensity: v.number(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    // Find existing memory
    const existingMemory = await ctx.db
      .query("sharkMemories")
      .withIndex("by_shark_target", (q) =>
        q.eq("sharkUserId", args.sharkUserId)
         .eq("targetUserId", args.targetUserId)
      )
      .first();

    if (existingMemory) {
      // Update existing memory
      const updates: any = {
        encounters: existingMemory.encounters + 1,
        lastEncounter: Date.now(),
      };

      if (args.encounter.type === "hunt" && args.encounter.success) {
        updates.successfulHunts = existingMemory.successfulHunts + 1;
      } else if (args.encounter.type === "escape") {
        updates.escapes = existingMemory.escapes + 1;
      }

      // Update patterns if provided
      if (args.encounter.pattern) {
        const patterns = [...existingMemory.patterns];
        const existingPatternIndex = patterns.findIndex(
          p => p.type === args.encounter.pattern!.type
        );

        if (existingPatternIndex >= 0) {
          // Update confidence of existing pattern
          patterns[existingPatternIndex] = {
            ...patterns[existingPatternIndex],
            confidence: Math.min(
              1,
              patterns[existingPatternIndex].confidence + 0.1
            ),
            data: args.encounter.pattern.data,
          };
        } else {
          patterns.push(args.encounter.pattern);
        }

        updates.patterns = patterns;
      }

      // Add memorable moment if provided
      if (args.encounter.memorableMoment) {
        const moments = [...existingMemory.memorableMoments];
        moments.push({
          gameId: args.gameId,
          description: args.encounter.memorableMoment.description,
          intensity: args.encounter.memorableMoment.intensity,
          timestamp: Date.now(),
        });

        // Keep only the 10 most intense moments
        moments.sort((a, b) => b.intensity - a.intensity);
        updates.memorableMoments = moments.slice(0, 10);
      }

      // Update relationship based on encounters
      updates.relationship = calculateRelationship(
        existingMemory.successfulHunts + (args.encounter.type === "hunt" && args.encounter.success ? 1 : 0),
        existingMemory.escapes + (args.encounter.type === "escape" ? 1 : 0),
        existingMemory.encounters + 1
      );

      await ctx.db.patch(existingMemory._id, updates);
    } else {
      // Create new memory
      const newMemory: Omit<SharkMemory, "_id" | "_creationTime"> = {
        sharkUserId: args.sharkUserId,
        targetUserId: args.targetUserId,
        encounters: 1,
        successfulHunts: args.encounter.type === "hunt" && args.encounter.success ? 1 : 0,
        escapes: args.encounter.type === "escape" ? 1 : 0,
        patterns: args.encounter.pattern ? [args.encounter.pattern] : [],
        relationship: "neutral",
        memorableMoments: args.encounter.memorableMoment
          ? [{
              gameId: args.gameId,
              description: args.encounter.memorableMoment.description,
              intensity: args.encounter.memorableMoment.intensity,
              timestamp: Date.now(),
            }]
          : [],
        firstEncounter: Date.now(),
        lastEncounter: Date.now(),
        totalGamesPlayed: 1,
      };

      await ctx.db.insert("sharkMemories", newMemory);
    }

    return { success: true };
  },
});

// Get shark memories for AI decision making
export const getSharkMemories = query({
  args: {
    sharkUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query("sharkMemories")
      .withIndex("by_shark", (q) => q.eq("sharkUserId", args.sharkUserId))
      .order("desc")
      .take(args.limit || 50);

    return memories;
  },
});

// Get specific memory about a player
export const getSharkMemoryForPlayer = query({
  args: {
    sharkUserId: v.string(),
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db
      .query("sharkMemories")
      .withIndex("by_shark_target", (q) =>
        q.eq("sharkUserId", args.sharkUserId)
         .eq("targetUserId", args.targetUserId)
      )
      .first();

    return memory;
  },
});

// Get recent player actions for pattern recognition
export const getRecentPlayerActions = query({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actions = await ctx.db
      .query("playerActions")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .order("desc")
      .take(args.limit || 100);

    return actions;
  },
});

// Update shark personality based on play style
export const updateSharkPersonality = mutation({
  args: {
    sharkId: v.id("players"),
    personality: v.union(
      v.literal("methodical"),
      v.literal("theatrical"),
      v.literal("vengeful"),
      v.literal("philosophical"),
      v.literal("meta")
    ),
  },
  handler: async (ctx, args) => {
    const shark = await ctx.db.get(args.sharkId);
    if (!shark || shark.role !== "shark") {
      throw new Error("Invalid shark player");
    }

    await ctx.db.patch(args.sharkId, {
      sharkPersonality: args.personality,
      lastUpdate: Date.now(),
    });

    return { success: true };
  },
});

// Helper function to calculate relationship based on encounters
function calculateRelationship(
  hunts: number,
  escapes: number,
  totalEncounters: number
): SharkMemory["relationship"] {
  const huntRate = hunts / totalEncounters;
  const escapeRate = escapes / totalEncounters;

  if (totalEncounters < 3) {
    return "neutral";
  }

  if (huntRate > 0.7) {
    return "favorite_snack";
  } else if (escapeRate > 0.7) {
    return "nemesis";
  } else if (totalEncounters > 10 && escapeRate > 0.5) {
    return "respected";
  } else if (totalEncounters > 5 && huntRate < 0.3 && escapeRate < 0.3) {
    return "rival";
  }

  return "neutral";
}