import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// AI decision state for real-time sync
export const sharkAIState = {
  currentTarget: v.optional(v.id("players")),
  huntMode: v.union(
    v.literal("patrol"),
    v.literal("stalking"),
    v.literal("attacking"),
    v.literal("recovering")
  ),
  personality: v.union(
    v.literal("methodical"),
    v.literal("theatrical"),
    v.literal("vengeful"),
    v.literal("philosophical"),
    v.literal("meta")
  ),
  decisionTimestamp: v.number()
};

// Sync shark AI decision with game state
export const syncSharkDecision = mutation({
  args: {
    gameId: v.id("games"),
    sharkPlayerId: v.id("players"),
    decision: v.object({
      targetPlayerId: v.optional(v.id("players")),
      action: v.string(), // "hunt", "patrol", "ambush", "surface", "dive"
      reasoning: v.string(), // AI's reasoning for the decision
      confidence: v.number(), // 0-1
      personalityInfluence: v.string() // How personality affected the decision
    }),
    aiState: v.object({
      hunger: v.number(),
      rage: v.number(),
      currentMode: v.string(),
      memoryInfluence: v.optional(v.object({
        targetUserId: v.string(),
        patternUsed: v.string(),
        grudgeLevel: v.number()
      }))
    })
  },
  handler: async (ctx, args) => {
    const { gameId, sharkPlayerId, decision, aiState } = args;
    
    // Update shark player state
    await ctx.db.patch(sharkPlayerId, {
      sharkHunger: aiState.hunger,
      sharkRage: aiState.rage,
      lastUpdate: Date.now()
    });
    
    // If targeting a specific player, record the action for pattern learning
    if (decision.targetPlayerId) {
      const targetPlayer = await ctx.db.get(decision.targetPlayerId);
      const sharkPlayer = await ctx.db.get(sharkPlayerId);
      
      if (targetPlayer && sharkPlayer) {
        await ctx.db.insert("playerActions", {
          gameId,
          playerId: sharkPlayerId,
          action: {
            type: "shark_decision",
            data: {
              decision: decision.action,
              reasoning: decision.reasoning,
              targetId: decision.targetPlayerId,
              confidence: decision.confidence
            },
            position: sharkPlayer.position
          },
          nearbyPlayers: [decision.targetPlayerId],
          sharkDistance: 0, // Shark is self
          inDanger: false,
          timestamp: Date.now(),
          frameNumber: 0 // Would be provided by game engine
        });
      }
    }
    
    return { success: true };
  }
});

// Get real-time AI recommendations based on game state
export const getAIRecommendations = query({
  args: {
    gameId: v.id("games"),
    sharkPlayerId: v.id("players")
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    const sharkPlayer = await ctx.db.get(args.sharkPlayerId);
    
    if (!game || !sharkPlayer) {
      return null;
    }
    
    // Get all active players in the game
    const players = await ctx.db
      .query("players")
      .withIndex("by_game_status", (q) => 
        q.eq("gameId", args.gameId).eq("status", "alive")
      )
      .collect();
    
    // Get recent player actions for pattern analysis
    const recentActions = await ctx.db
      .query("playerActions")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(50);
    
    // Get shark's memories for each player
    const playerMemories = await Promise.all(
      players
        .filter(p => p.role === "swimmer")
        .map(async (player) => {
          const memory = await ctx.db
            .query("sharkMemories")
            .withIndex("by_shark_target", (q) => 
              q.eq("sharkUserId", sharkPlayer.userId)
              .eq("targetUserId", player.userId)
            )
            .first();
          
          return {
            playerId: player._id,
            userId: player.userId,
            memory,
            currentPosition: player.position,
            archetype: player.archetype,
            health: player.health,
            stamina: player.stamina
          };
        })
    );
    
    // Analyze current game state
    const gameState = {
      waterLevel: game.waterLevel,
      activeEvent: game.activeEvent,
      roundNumber: game.roundNumber,
      timeRemaining: game.timeRemaining
    };
    
    // Calculate threat levels and opportunities
    const targets = playerMemories.map(pm => {
      let threatScore = 0;
      let opportunityScore = 0;
      
      // Base scores on current state
      opportunityScore += (100 - pm.health) * 0.5; // Wounded prey
      opportunityScore += (100 - pm.stamina) * 0.3; // Tired prey
      
      // Apply memory modifiers
      if (pm.memory) {
        if (pm.memory.relationship === "favorite_snack") {
          opportunityScore += 20;
        } else if (pm.memory.relationship === "nemesis") {
          threatScore += 30; // High priority target
          opportunityScore += 10; // But also dangerous
        } else if (pm.memory.relationship === "respected") {
          opportunityScore -= 10; // Less likely to target
        }
        
        // Pattern-based scoring
        const hidePatterns = pm.memory.patterns.filter(p => 
          p.type === "hiding_spot" && p.confidence > 0.6
        );
        if (hidePatterns.length > 0) {
          opportunityScore += 15; // We know their hiding spots
        }
      }
      
      // Distance-based scoring
      const distance = Math.sqrt(
        Math.pow(sharkPlayer.position.x - pm.currentPosition.x, 2) +
        Math.pow(sharkPlayer.position.y - pm.currentPosition.y, 2) +
        Math.pow(sharkPlayer.position.z - pm.currentPosition.z, 2)
      );
      opportunityScore += Math.max(0, 50 - distance);
      
      return {
        playerId: pm.playerId,
        userId: pm.userId,
        threatScore,
        opportunityScore,
        totalScore: threatScore + opportunityScore,
        distance,
        patterns: pm.memory?.patterns || []
      };
    });
    
    // Sort by total score
    targets.sort((a, b) => b.totalScore - a.totalScore);
    
    return {
      recommendations: targets.slice(0, 3), // Top 3 targets
      gameState,
      sharkState: {
        hunger: sharkPlayer.sharkHunger || 50,
        rage: sharkPlayer.sharkRage || 0,
        personality: sharkPlayer.sharkPersonality || "methodical"
      }
    };
  }
});

// Record AI prediction accuracy for learning
export const recordPredictionOutcome = mutation({
  args: {
    gameId: v.id("games"),
    sharkUserId: v.string(),
    targetUserId: v.string(),
    prediction: v.object({
      type: v.string(), // "hiding_location", "escape_route", "ability_use"
      predicted: v.any(),
      actual: v.any(),
      accurate: v.boolean()
    })
  },
  handler: async (ctx, args) => {
    // Update pattern confidence based on prediction accuracy
    await ctx.scheduler.runAfter(0, api.sharkMemory.updatePatternConfidence, {
      sharkUserId: args.sharkUserId,
      targetUserId: args.targetUserId,
      patternType: args.prediction.type,
      validated: args.prediction.accurate
    });
    
    // Log for analysis
    console.log("Prediction outcome:", {
      gameId: args.gameId,
      accurate: args.prediction.accurate,
      type: args.prediction.type
    });
  }
});

// Sync commentary with game events
export const syncCommentary = mutation({
  args: {
    gameId: v.id("games"),
    commentary: v.object({
      text: v.string(),
      style: v.union(
        v.literal("nature_documentary"),
        v.literal("sports_commentary"),
        v.literal("true_crime"),
        v.literal("reality_tv")
      ),
      emotion: v.string(),
      trigger: v.object({
        type: v.string(),
        playerId: v.optional(v.id("players")),
        data: v.any()
      })
    })
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("commentary", {
      gameId: args.gameId,
      style: args.commentary.style,
      text: args.commentary.text,
      emotion: args.commentary.emotion,
      trigger: args.commentary.trigger,
      audioUrl: undefined,
      duration: undefined,
      timestamp: Date.now()
    });
  }
});

// Sync NPC behavior with game state
export const syncNPCBehavior = mutation({
  args: {
    gameId: v.id("games"),
    npcId: v.id("npcs"),
    behavior: v.object({
      activity: v.string(),
      dialogue: v.optional(v.string()),
      awareness: v.number(), // 0-1
      targetPosition: v.optional(v.object({
        x: v.number(),
        y: v.number(),
        z: v.number()
      }))
    })
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.npcId, {
      currentActivity: args.behavior.activity,
      dialogue: args.behavior.dialogue,
      awareness: args.behavior.awareness,
      targetPosition: args.behavior.targetPosition,
      lastUpdate: Date.now()
    });
  }
});

// Get AI sync status for monitoring
export const getAISyncStatus = query({
  args: {
    gameId: v.id("games")
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || !game.sharkPlayerId) {
      return null;
    }
    
    const sharkPlayer = await ctx.db.get(game.sharkPlayerId);
    
    // Get recent AI decisions
    const recentDecisions = game.sharkPlayerId 
      ? await ctx.db
          .query("playerActions")
          .withIndex("by_player", (q) => q.eq("playerId", game.sharkPlayerId!))
          .order("desc")
          .take(10)
      : [];
    
    // Get recent commentary
    const recentCommentary = await ctx.db
      .query("commentary")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(5);
    
    // Get active NPCs
    const activeNPCs = await ctx.db
      .query("npcs")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
    
    return {
      sharkAI: {
        active: !!sharkPlayer,
        personality: sharkPlayer?.sharkPersonality,
        lastUpdate: sharkPlayer?.lastUpdate,
        currentState: {
          hunger: sharkPlayer?.sharkHunger,
          rage: sharkPlayer?.sharkRage
        }
      },
      recentDecisions: recentDecisions.length,
      commentaryActive: recentCommentary.length > 0,
      lastCommentary: recentCommentary[0]?.timestamp,
      activeNPCs: activeNPCs.length,
      npcAwareness: activeNPCs.reduce((sum, npc) => sum + npc.awareness, 0) / (activeNPCs.length || 1)
    };
  }
});