import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Claim an objective
export const claimObjective = mutation({
  args: {
    objectiveId: v.id("objectives"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const objective = await ctx.db.get(args.objectiveId)
    if (!objective) {
      throw new Error("Objective not found")
    }

    if (objective.status !== "available") {
      throw new Error("Objective is not available")
    }

    const player = await ctx.db.get(args.playerId)
    if (!player || player.status !== "alive") {
      throw new Error("Player must be alive to claim objectives")
    }

    if (player.role !== "swimmer") {
      throw new Error("Only swimmers can claim objectives")
    }

    // Check if player already has an active objective
    const activeObjective = await ctx.db
      .query("objectives")
      .withIndex("by_game", (q) => q.eq("gameId", objective.gameId))
      .filter((q) =>
        q.and(q.eq(q.field("claimedBy"), args.playerId), q.eq(q.field("status"), "in_progress"))
      )
      .first()

    if (activeObjective) {
      throw new Error("Player already has an active objective")
    }

    // Claim the objective
    await ctx.db.patch(args.objectiveId, {
      status: "in_progress",
      claimedBy: args.playerId,
      claimedAt: Date.now(),
    })

    // Record the action
    await ctx.db.insert("playerActions", {
      gameId: objective.gameId,
      playerId: args.playerId,
      action: {
        type: "objective",
        data: {
          objectiveId: args.objectiveId,
          objectiveType: objective.type,
          action: "claim",
        },
        position: player.position,
      },
      nearbyPlayers: [],
      inDanger: false,
      timestamp: Date.now(),
      frameNumber: 0,
    })

    return { success: true }
  },
})

// Complete an objective
export const completeObjective = mutation({
  args: {
    objectiveId: v.id("objectives"),
    playerId: v.id("players"),
    completionData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const objective = await ctx.db.get(args.objectiveId)
    if (!objective) {
      throw new Error("Objective not found")
    }

    if (objective.status !== "in_progress") {
      throw new Error("Objective is not in progress")
    }

    if (objective.claimedBy !== args.playerId) {
      throw new Error("Objective was not claimed by this player")
    }

    const player = await ctx.db.get(args.playerId)
    if (!player || player.status !== "alive") {
      throw new Error("Player must be alive to complete objectives")
    }

    // Validate completion based on objective type
    const isValid = await validateObjectiveCompletion(ctx, objective, player, args.completionData)

    if (!isValid) {
      throw new Error("Objective completion requirements not met")
    }

    // Complete the objective
    await ctx.db.patch(args.objectiveId, {
      status: "completed",
      completedBy: args.playerId,
      completedAt: Date.now(),
    })

    // Update player stats
    await ctx.db.patch(args.playerId, {
      objectivesCompleted: player.objectivesCompleted + 1,
      lastUpdate: Date.now(),
    })

    // Record the action
    await ctx.db.insert("playerActions", {
      gameId: objective.gameId,
      playerId: args.playerId,
      action: {
        type: "objective",
        data: {
          objectiveId: args.objectiveId,
          objectiveType: objective.type,
          action: "complete",
          completionData: args.completionData,
        },
        position: player.position,
      },
      nearbyPlayers: [],
      inDanger: false,
      timestamp: Date.now(),
      frameNumber: 0,
    })

    // Spawn a new objective
    await spawnNewObjective(ctx, objective.gameId)

    return {
      success: true,
      points: objective.points,
    }
  },
})

// Abandon an objective
export const abandonObjective = mutation({
  args: {
    objectiveId: v.id("objectives"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const objective = await ctx.db.get(args.objectiveId)
    if (!objective) {
      throw new Error("Objective not found")
    }

    if (objective.status !== "in_progress") {
      throw new Error("Objective is not in progress")
    }

    if (objective.claimedBy !== args.playerId) {
      throw new Error("Objective was not claimed by this player")
    }

    // Make objective available again
    await ctx.db.patch(args.objectiveId, {
      status: "available",
      claimedBy: undefined,
      claimedAt: undefined,
    })

    return { success: true }
  },
})

// Get available objectives
export const getAvailableObjectives = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const objectives = await ctx.db
      .query("objectives")
      .withIndex("by_game_status", (q) => q.eq("gameId", args.gameId).eq("status", "available"))
      .collect()

    return objectives
  },
})

// Get player's active objective
export const getPlayerActiveObjective = query({
  args: {
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId)
    if (!player) {
      return null
    }

    const objective = await ctx.db
      .query("objectives")
      .withIndex("by_game", (q) => q.eq("gameId", player.gameId))
      .filter((q) =>
        q.and(q.eq(q.field("claimedBy"), args.playerId), q.eq(q.field("status"), "in_progress"))
      )
      .first()

    return objective
  },
})

// Update objective status (for time-based objectives)
export const updateObjectiveStatus = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    // Check for expired objectives
    const objectives = await ctx.db
      .query("objectives")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect()

    for (const objective of objectives) {
      if (objective.timeLimit && objective.claimedAt) {
        const elapsed = (now - objective.claimedAt) / 1000 // Convert to seconds

        if (elapsed > objective.timeLimit) {
          await ctx.db.patch(objective._id, {
            status: "failed",
          })

          // Spawn a new objective
          await spawnNewObjective(ctx, args.gameId)
        }
      }
    }

    return { success: true }
  },
})

// Helper function to validate objective completion
async function validateObjectiveCompletion(
  _ctx: any,
  objective: any,
  _player: any,
  completionData: any
): Promise<boolean> {
  switch (objective.type) {
    case "selfie_with_shark":
      // Check if shark is in frame
      if (!completionData?.sharkInFrame) {
        return false
      }
      break

    case "perfect_sandcastle":
      // Check if sandcastle was built
      if (!completionData?.sandcastleBuilt) {
        return false
      }
      break

    case "tiktok_dance":
      // Check if dance was performed for required duration
      if (!completionData?.danceDuration || completionData.danceDuration < 3) {
        return false
      }
      break

    case "sunscreen_application":
      // Check if sunscreen was applied
      if (!completionData?.sunscreenApplied) {
        return false
      }
      break

    default:
      // Unknown objective type
      return false
  }

  return true
}

// Helper function to spawn new objectives
async function spawnNewObjective(ctx: any, gameId: string) {
  const game = await ctx.db.get(gameId)
  if (!game || !game.objectivesEnabled) {
    return
  }

  // Count current objectives
  const currentObjectives = await ctx.db
    .query("objectives")
    .withIndex("by_game", (q: any) => q.eq("gameId", gameId))
    .filter((q: any) =>
      q.or(q.eq(q.field("status"), "available"), q.eq(q.field("status"), "in_progress"))
    )
    .collect()

  // Maintain a minimum number of objectives
  if (currentObjectives.length < 5) {
    const objectiveTypes = [
      { type: "selfie_with_shark", title: "Shark Selfie Challenge", points: 500 },
      { type: "perfect_sandcastle", title: "Sandcastle Under Pressure", points: 300 },
      { type: "tiktok_dance", title: "Viral Dance Move", points: 200 },
      { type: "sunscreen_application", title: "SPF Safety First", points: 150 },
      { type: "beach_volleyball", title: "Volleyball Champion", points: 250 },
      { type: "food_delivery", title: "Snack Attack", points: 100 },
      { type: "find_lost_item", title: "Lost and Found", points: 200 },
    ]

    // Pick a random objective type
    const randomObjective = objectiveTypes[Math.floor(Math.random() * objectiveTypes.length)]
    if (!randomObjective) return

    await ctx.db.insert("objectives", {
      gameId: gameId as any,
      type: randomObjective.type as any,
      title: randomObjective.title,
      description: `Complete the ${randomObjective.title} challenge`,
      points: randomObjective.points,
      status: "available",
      createdAt: Date.now(),
    })
  }
}
