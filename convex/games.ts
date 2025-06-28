import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { CreateGameInput, JoinGameInput, GAME_CONSTANTS } from "./types";

// Create a new beach game session
export const createGame = mutation({
  args: {
    beachName: v.string(),
    maxPlayers: v.optional(v.number()),
    aiDifficulty: v.optional(v.string()),
    objectivesEnabled: v.optional(v.boolean()),
    commentary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const gameId = await ctx.db.insert("games", {
      beachName: args.beachName,
      status: "lobby",
      maxPlayers: args.maxPlayers ?? GAME_CONSTANTS.MAX_PLAYERS,
      currentPlayers: 0,
      roundNumber: 1,
      timeRemaining: GAME_CONSTANTS.DEFAULT_ROUND_TIME,
      waterLevel: "calm",
      aiDifficulty: args.aiDifficulty ?? "local",
      objectivesEnabled: args.objectivesEnabled ?? true,
      commentary: args.commentary ?? true,
      createdAt: Date.now(),
    });

    return gameId;
  },
});

// Join an existing game
export const joinGame = mutation({
  args: {
    gameId: v.id("games"),
    userId: v.string(),
    name: v.string(),
    role: v.union(v.literal("swimmer"), v.literal("shark")),
    archetype: v.optional(v.union(
      v.literal("influencer"),
      v.literal("boomer_dad"),
      v.literal("surfer_bro"),
      v.literal("lifeguard"),
      v.literal("marine_biologist"),
      v.literal("spring_breaker")
    )),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "lobby") {
      throw new Error("Game already started");
    }

    if (game.currentPlayers >= game.maxPlayers) {
      throw new Error("Game is full");
    }

    // Check if trying to join as shark when one already exists
    if (args.role === "shark") {
      const existingPlayers = await ctx.db
        .query("players")
        .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
        .collect();
      
      const hasShark = existingPlayers.some(p => p.role === "shark");
      if (hasShark) {
        throw new Error("Game already has a shark player");
      }
    }

    // Check if player already in game
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingPlayer) {
      throw new Error("Player already in game");
    }

    // Create player
    const playerId = await ctx.db.insert("players", {
      gameId: args.gameId,
      userId: args.userId,
      name: args.name,
      role: args.role,
      archetype: args.role === "swimmer" ? args.archetype : undefined,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      status: "alive",
      health: 100,
      stamina: 100,
      abilityReady: true,
      abilityCooldown: 0,
      objectivesCompleted: 0,
      survivalTime: 0,
      closeCallsCount: 0,
      sharkHunger: args.role === "shark" ? 50 : undefined,
      sharkRage: args.role === "shark" ? 0 : undefined,
      sharkPersonality: args.role === "shark" ? "methodical" : undefined,
      joinedAt: Date.now(),
      lastUpdate: Date.now(),
    });

    // Update game player count
    await ctx.db.patch(args.gameId, {
      currentPlayers: game.currentPlayers + 1,
      sharkPlayerId: args.role === "shark" ? playerId : game.sharkPlayerId,
    });

    return playerId;
  },
});

// Start the game
export const startGame = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "lobby") {
      throw new Error("Game already started or finished");
    }

    // Check if we have a shark
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    const hasShark = players.some(p => p.role === "shark");
    if (!hasShark) {
      throw new Error("Cannot start game without a shark player");
    }

    // Update game status
    await ctx.db.patch(args.gameId, {
      status: "active",
      startedAt: Date.now(),
    });

    // Spawn initial objectives if enabled
    if (game.objectivesEnabled) {
      const objectiveTypes = [
        "selfie_with_shark",
        "perfect_sandcastle",
        "tiktok_dance",
        "sunscreen_application"
      ];

      for (const type of objectiveTypes.slice(0, 3)) {
        await ctx.db.insert("objectives", {
          gameId: args.gameId,
          type: type as any,
          title: getObjectiveTitle(type),
          description: getObjectiveDescription(type),
          points: getObjectivePoints(type),
          requirements: getObjectiveRequirements(type),
          status: "available",
          createdAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

// Leave a game
export const leaveGame = mutation({
  args: {
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const game = await ctx.db.get(player.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Update player status
    await ctx.db.patch(args.playerId, {
      status: "escaped",
      lastUpdate: Date.now(),
    });

    // Update game player count
    await ctx.db.patch(player.gameId, {
      currentPlayers: Math.max(0, game.currentPlayers - 1),
    });

    // If shark leaves, end the game
    if (player.role === "shark" && game.status === "active") {
      await ctx.db.patch(player.gameId, {
        status: "abandoned",
        endedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get active games
export const getActiveGames = query({
  handler: async (ctx) => {
    const games = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "lobby"))
      .order("desc")
      .take(20);

    return games;
  },
});

// Get game details with players
export const getGameDetails = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return null;
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    return {
      game,
      players,
    };
  },
});

// Helper functions
function getObjectiveTitle(type: string): string {
  const titles: Record<string, string> = {
    selfie_with_shark: "Shark Selfie Challenge",
    perfect_sandcastle: "Sandcastle Under Pressure",
    tiktok_dance: "Viral Dance Move",
    sunscreen_application: "SPF Safety First",
  };
  return titles[type] || "Mystery Challenge";
}

function getObjectiveDescription(type: string): string {
  const descriptions: Record<string, string> = {
    selfie_with_shark: "Take a selfie with the shark visible in frame",
    perfect_sandcastle: "Build a sandcastle while being chased",
    tiktok_dance: "Perform a dance on the platform for 3 seconds",
    sunscreen_application: "Apply sunscreen for 2 seconds of invulnerability",
  };
  return descriptions[type] || "Complete the challenge to earn points";
}

function getObjectivePoints(type: string): number {
  const points: Record<string, number> = {
    selfie_with_shark: 500,
    perfect_sandcastle: 300,
    tiktok_dance: 200,
    sunscreen_application: 150,
  };
  return points[type] || 100;
}

function getObjectiveRequirements(type: string): any {
  const requirements: Record<string, any> = {
    selfie_with_shark: { sharkDistance: 50, duration: 2 },
    perfect_sandcastle: { buildTime: 5, minHeight: 3 },
    tiktok_dance: { duration: 3, platform: true },
    sunscreen_application: { duration: 2, coverage: 0.8 },
  };
  return requirements[type] || {};
}