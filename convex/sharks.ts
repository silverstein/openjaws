import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Update shark position and state
export const updateSharkState = mutation({
  args: {
    playerId: v.id("players"),
    position: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number(),
    }),
    velocity: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number(),
    }),
    state: v.string(), // "hunting", "patrolling", "attacking", "fleeing"
    targetPlayerId: v.optional(v.id("players")),
    hunger: v.optional(v.number()),
    rage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const shark = await ctx.db.get(args.playerId)
    if (!shark) {
      throw new Error("Shark not found")
    }

    if (shark.role !== "shark") {
      throw new Error("Player is not a shark")
    }

    if (shark.status !== "alive") {
      throw new Error("Shark is not alive")
    }

    // Update shark state
    const updates: any = {
      position: args.position,
      velocity: args.velocity,
      lastUpdate: Date.now(),
    }

    if (args.hunger !== undefined) {
      updates.sharkHunger = Math.max(0, Math.min(100, args.hunger))
    }

    if (args.rage !== undefined) {
      updates.sharkRage = Math.max(0, Math.min(100, args.rage))
    }

    await ctx.db.patch(args.playerId, updates)

    // Record the shark action for AI learning
    const game = await ctx.db.get(shark.gameId)
    if (game && game.status === "active") {
      await ctx.db.insert("playerActions", {
        gameId: shark.gameId,
        playerId: args.playerId,
        action: {
          type: "move",
          data: {
            state: args.state,
            targetPlayerId: args.targetPlayerId,
            hunger: args.hunger,
            rage: args.rage,
          },
          position: args.position,
        },
        nearbyPlayers: [],
        inDanger: false,
        timestamp: Date.now(),
        frameNumber: 0,
      })
    }

    return { success: true }
  },
})

// Get shark state for a game
export const getSharkState = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || !game.sharkPlayerId) {
      return null
    }

    const shark = await ctx.db.get(game.sharkPlayerId)
    if (!shark || shark.status !== "alive") {
      return null
    }

    return {
      playerId: shark._id,
      position: shark.position,
      velocity: shark.velocity,
      hunger: shark.sharkHunger || 50,
      rage: shark.sharkRage || 0,
      personality: shark.sharkPersonality || "methodical",
      status: shark.status,
    }
  },
})

// Mark shark as host (controls AI)
export const markSharkAsHost = mutation({
  args: {
    playerId: v.id("players"),
    isHost: v.boolean(),
  },
  handler: async (ctx, args) => {
    const shark = await ctx.db.get(args.playerId)
    if (!shark) {
      throw new Error("Shark not found")
    }

    if (shark.role !== "shark") {
      throw new Error("Player is not a shark")
    }

    // We'll store this in a custom field that we'll add to the schema if needed
    // For now, the first player to join as shark is the host
    return { success: true, isHost: args.isHost }
  },
})
