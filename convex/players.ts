import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { PlayerMovementInput, ABILITY_COOLDOWNS } from "./types";

// Update player position and movement
export const updatePlayerMovement = mutation({
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
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    if (player.status !== "alive") {
      throw new Error("Player is not alive");
    }

    // Update position and velocity
    await ctx.db.patch(args.playerId, {
      position: args.position,
      velocity: args.velocity,
      lastUpdate: Date.now(),
    });

    // Record the movement action for AI learning
    const game = await ctx.db.get(player.gameId);
    if (game && game.status === "active") {
      // Get nearby players for context
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_game", (q) => q.eq("gameId", player.gameId))
        .filter((q) => q.eq(q.field("status"), "alive"))
        .collect();

      const nearbyPlayers = allPlayers
        .filter(p => p._id !== args.playerId)
        .filter(p => {
          const distance = Math.sqrt(
            Math.pow(p.position.x - args.position.x, 2) +
            Math.pow(p.position.y - args.position.y, 2)
          );
          return distance < 50; // Within 50 units
        })
        .map(p => p._id);

      // Calculate shark distance if applicable
      let sharkDistance: number | undefined;
      if (player.role === "swimmer" && game.sharkPlayerId) {
        const shark = await ctx.db.get(game.sharkPlayerId);
        if (shark && shark.status === "alive") {
          sharkDistance = Math.sqrt(
            Math.pow(shark.position.x - args.position.x, 2) +
            Math.pow(shark.position.y - args.position.y, 2)
          );
        }
      }

      await ctx.db.insert("playerActions", {
        gameId: player.gameId,
        playerId: args.playerId,
        action: {
          type: "move",
          data: { velocity: args.velocity },
          position: args.position,
        },
        nearbyPlayers,
        sharkDistance,
        inDanger: sharkDistance !== undefined && sharkDistance < 30,
        timestamp: Date.now(),
        frameNumber: 0, // This would come from the client
      });
    }

    return { success: true };
  },
});

// Use player ability
export const useAbility = mutation({
  args: {
    playerId: v.id("players"),
    targetPosition: v.optional(v.object({
      x: v.number(),
      y: v.number(),
      z: v.number(),
    })),
    targetPlayerId: v.optional(v.id("players")),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    if (player.status !== "alive") {
      throw new Error("Player is not alive");
    }

    if (!player.abilityReady) {
      throw new Error("Ability is on cooldown");
    }

    // Get cooldown based on archetype
    const cooldown = player.archetype 
      ? ABILITY_COOLDOWNS[player.archetype]
      : 30; // Default cooldown for shark

    // Mark ability as used
    await ctx.db.patch(args.playerId, {
      abilityReady: false,
      abilityCooldown: cooldown,
      lastUpdate: Date.now(),
    });

    // Record ability usage
    await ctx.db.insert("playerActions", {
      gameId: player.gameId,
      playerId: args.playerId,
      action: {
        type: "ability",
        data: {
          archetype: player.archetype || "shark",
          targetPosition: args.targetPosition,
          targetPlayerId: args.targetPlayerId,
        },
        position: player.position,
      },
      nearbyPlayers: [],
      inDanger: false,
      timestamp: Date.now(),
      frameNumber: 0,
    });

    return { 
      success: true,
      cooldown,
    };
  },
});

// Update player stats (health, stamina, etc)
export const updatePlayerStats = mutation({
  args: {
    playerId: v.id("players"),
    health: v.optional(v.number()),
    stamina: v.optional(v.number()),
    sharkHunger: v.optional(v.number()),
    sharkRage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const updates: any = {
      lastUpdate: Date.now(),
    };

    if (args.health !== undefined) {
      updates.health = Math.max(0, Math.min(100, args.health));
      
      // Check if player died
      if (updates.health === 0) {
        updates.status = player.role === "shark" ? "spectating" : "eaten";
      }
    }

    if (args.stamina !== undefined) {
      updates.stamina = Math.max(0, Math.min(100, args.stamina));
    }

    if (player.role === "shark") {
      if (args.sharkHunger !== undefined) {
        updates.sharkHunger = Math.max(0, Math.min(100, args.sharkHunger));
      }
      if (args.sharkRage !== undefined) {
        updates.sharkRage = Math.max(0, Math.min(100, args.sharkRage));
      }
    }

    await ctx.db.patch(args.playerId, updates);

    return { success: true };
  },
});

// Handle player being eaten by shark
export const playerEaten = mutation({
  args: {
    sharkId: v.id("players"),
    swimmerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const shark = await ctx.db.get(args.sharkId);
    const swimmer = await ctx.db.get(args.swimmerId);

    if (!shark || !swimmer) {
      throw new Error("Player not found");
    }

    if (shark.role !== "shark") {
      throw new Error("Only shark can eat swimmers");
    }

    if (swimmer.role !== "swimmer") {
      throw new Error("Can only eat swimmers");
    }

    if (swimmer.status !== "alive") {
      throw new Error("Swimmer is not alive");
    }

    // Update swimmer status
    await ctx.db.patch(args.swimmerId, {
      status: "eaten",
      lastUpdate: Date.now(),
    });

    // Update shark stats
    const newHunger = Math.min(100, (shark.sharkHunger || 50) + 25);
    const newRage = Math.max(0, (shark.sharkRage || 0) - 10);

    await ctx.db.patch(args.sharkId, {
      sharkHunger: newHunger,
      sharkRage: newRage,
      lastUpdate: Date.now(),
    });

    // Update shark memory
    const existingMemory = await ctx.db
      .query("sharkMemories")
      .withIndex("by_shark_target", (q) => 
        q.eq("sharkUserId", shark.userId)
         .eq("targetUserId", swimmer.userId)
      )
      .first();

    if (existingMemory) {
      await ctx.db.patch(existingMemory._id, {
        encounters: existingMemory.encounters + 1,
        successfulHunts: existingMemory.successfulHunts + 1,
        lastEncounter: Date.now(),
      });
    } else {
      await ctx.db.insert("sharkMemories", {
        sharkUserId: shark.userId,
        targetUserId: swimmer.userId,
        encounters: 1,
        successfulHunts: 1,
        escapes: 0,
        patterns: [],
        relationship: "favorite_snack",
        memorableMoments: [{
          gameId: shark.gameId,
          description: `First successful hunt of ${swimmer.name}`,
          intensity: 7,
          timestamp: Date.now(),
        }],
        firstEncounter: Date.now(),
        lastEncounter: Date.now(),
        totalGamesPlayed: 1,
      });
    }

    return { success: true };
  },
});

// Update ability cooldowns (called periodically by the game)
export const updateCooldowns = mutation({
  args: {
    gameId: v.id("games"),
    deltaTime: v.number(), // Time passed in seconds
  },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("status"), "alive"))
      .collect();

    for (const player of players) {
      if (player.abilityCooldown > 0) {
        const newCooldown = Math.max(0, player.abilityCooldown - args.deltaTime);
        
        await ctx.db.patch(player._id, {
          abilityCooldown: newCooldown,
          abilityReady: newCooldown === 0,
        });
      }
    }

    return { success: true };
  },
});

// Get player by user ID in a game
export const getPlayerByUserId = query({
  args: {
    gameId: v.id("games"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    return player;
  },
});

// Get all alive players in a game
export const getAlivePlayers = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_game_status", (q) => 
        q.eq("gameId", args.gameId)
         .eq("status", "alive")
      )
      .collect();

    return players;
  },
});