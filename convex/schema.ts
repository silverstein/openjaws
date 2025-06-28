import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Main game sessions - each beach is a separate game instance
  games: defineTable({
    beachName: v.string(),
    status: v.union(
      v.literal("lobby"),
      v.literal("active"),
      v.literal("finished"),
      v.literal("abandoned")
    ),
    maxPlayers: v.number(), // Usually 12 (11 swimmers + 1 shark)
    currentPlayers: v.number(),
    sharkPlayerId: v.optional(v.id("players")),
    
    // Game state
    roundNumber: v.number(),
    timeRemaining: v.number(), // seconds
    waterLevel: v.string(), // "calm", "choppy", "dangerous"
    
    // Dynamic events
    activeEvent: v.optional(v.object({
      type: v.string(), // "influencer_invasion", "documentary_crew", etc
      startTime: v.number(),
      duration: v.number(),
      data: v.any()
    })),
    
    // Settings
    aiDifficulty: v.string(), // "tourist", "local", "apex"
    objectivesEnabled: v.boolean(),
    commentary: v.boolean(),
    
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number())
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // Player data - both swimmers and shark
  players: defineTable({
    gameId: v.id("games"),
    userId: v.string(), // External user ID
    name: v.string(),
    role: v.union(v.literal("swimmer"), v.literal("shark")),
    
    // Character selection for swimmers
    archetype: v.optional(v.union(
      v.literal("influencer"),
      v.literal("boomer_dad"),
      v.literal("surfer_bro"),
      v.literal("lifeguard"),
      v.literal("marine_biologist"),
      v.literal("spring_breaker")
    )),
    
    // Position and state
    position: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number() // depth for swimming/diving
    }),
    velocity: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number()
    }),
    
    // Status
    status: v.union(
      v.literal("alive"),
      v.literal("eaten"),
      v.literal("escaped"),
      v.literal("spectating")
    ),
    health: v.number(), // 0-100
    stamina: v.number(), // 0-100
    
    // Abilities and cooldowns
    abilityReady: v.boolean(),
    abilityCooldown: v.number(), // seconds remaining
    specialItemHeld: v.optional(v.string()), // "sunscreen", "camera", etc
    
    // Stats for this game
    objectivesCompleted: v.number(),
    survivalTime: v.number(),
    closeCallsCount: v.number(),
    
    // Shark-specific state
    sharkHunger: v.optional(v.number()), // 0-100
    sharkRage: v.optional(v.number()), // 0-100
    sharkPersonality: v.optional(v.union(
      v.literal("methodical"),
      v.literal("theatrical"),
      v.literal("vengeful"),
      v.literal("philosophical"),
      v.literal("meta")
    )),
    
    joinedAt: v.number(),
    lastUpdate: v.number()
  })
    .index("by_game", ["gameId"])
    .index("by_user", ["userId"])
    .index("by_game_status", ["gameId", "status"]),

  // Shark's persistent memory across games
  sharkMemories: defineTable({
    sharkUserId: v.string(), // The shark player's ID
    targetUserId: v.string(), // The swimmer they remember
    
    // Memory data
    encounters: v.number(),
    successfulHunts: v.number(),
    escapes: v.number(),
    
    // Learned patterns
    patterns: v.array(v.object({
      type: v.string(), // "hiding_spot", "escape_route", "ability_timing"
      data: v.any(),
      confidence: v.number() // 0-1
    })),
    
    // Relationship status
    relationship: v.union(
      v.literal("neutral"),
      v.literal("rival"),
      v.literal("nemesis"),
      v.literal("respected"),
      v.literal("favorite_snack")
    ),
    
    // Memorable moments
    memorableMoments: v.array(v.object({
      gameId: v.id("games"),
      description: v.string(),
      intensity: v.number(), // 0-10
      timestamp: v.number()
    })),
    
    firstEncounter: v.number(),
    lastEncounter: v.number(),
    totalGamesPlayed: v.number()
  })
    .index("by_shark", ["sharkUserId"])
    .index("by_target", ["targetUserId"])
    .index("by_shark_target", ["sharkUserId", "targetUserId"]),

  // Player actions for AI learning
  playerActions: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    
    action: v.object({
      type: v.string(), // "move", "ability", "objective", "emote"
      data: v.any(),
      position: v.object({
        x: v.number(),
        y: v.number(),
        z: v.number()
      })
    }),
    
    // Context for AI analysis
    nearbyPlayers: v.array(v.id("players")),
    sharkDistance: v.optional(v.number()),
    inDanger: v.boolean(),
    
    timestamp: v.number(),
    frameNumber: v.number()
  })
    .index("by_game", ["gameId"])
    .index("by_player", ["playerId"])
    .index("by_timestamp", ["timestamp"]),

  // Objectives system
  objectives: defineTable({
    gameId: v.id("games"),
    
    type: v.union(
      v.literal("selfie_with_shark"),
      v.literal("perfect_sandcastle"),
      v.literal("tiktok_dance"),
      v.literal("sunscreen_application"),
      v.literal("beach_volleyball"),
      v.literal("food_delivery"),
      v.literal("find_lost_item")
    ),
    
    // Objective details
    title: v.string(),
    description: v.string(),
    points: v.number(),
    timeLimit: v.optional(v.number()), // seconds
    
    // Location and requirements
    location: v.optional(v.object({
      x: v.number(),
      y: v.number(),
      radius: v.number()
    })),
    requirements: v.any(), // Flexible for different objective types
    
    // Status
    status: v.union(
      v.literal("available"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("expired")
    ),
    
    claimedBy: v.optional(v.id("players")),
    completedBy: v.optional(v.id("players")),
    
    createdAt: v.number(),
    claimedAt: v.optional(v.number()),
    completedAt: v.optional(v.number())
  })
    .index("by_game", ["gameId"])
    .index("by_status", ["status"])
    .index("by_game_status", ["gameId", "status"]),

  // Beach NPCs
  npcs: defineTable({
    gameId: v.id("games"),
    
    type: v.union(
      v.literal("vendor"),
      v.literal("lifeguard"),
      v.literal("tourist"),
      v.literal("influencer"),
      v.literal("documentary_crew")
    ),
    
    name: v.string(),
    personality: v.string(), // Brief personality description
    
    // Position and movement
    position: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number()
    }),
    targetPosition: v.optional(v.object({
      x: v.number(),
      y: v.number(),
      z: v.number()
    })),
    
    // AI state
    currentActivity: v.string(),
    dialogue: v.optional(v.string()),
    awareness: v.number(), // 0-1, how aware they are of danger
    
    // Interaction data
    lastInteraction: v.optional(v.object({
      playerId: v.id("players"),
      type: v.string(),
      timestamp: v.number()
    })),
    
    createdAt: v.number(),
    lastUpdate: v.number()
  })
    .index("by_game", ["gameId"])
    .index("by_type", ["type"]),

  // Dynamic game events
  events: defineTable({
    gameId: v.id("games"),
    
    type: v.string(), // Event type identifier
    title: v.string(),
    description: v.string(),
    
    // Event configuration
    config: v.any(), // Flexible for different event types
    
    // Timing
    triggeredAt: v.number(),
    duration: v.number(), // seconds
    
    // Effects on game
    effects: v.array(v.object({
      target: v.union(v.literal("all"), v.literal("swimmers"), v.literal("shark")),
      type: v.string(),
      value: v.any()
    })),
    
    // Player participation
    participants: v.array(v.id("players")),
    
    completed: v.boolean()
  })
    .index("by_game", ["gameId"])
    .index("by_triggered", ["triggeredAt"]),

  // Documentary commentary
  commentary: defineTable({
    gameId: v.id("games"),
    
    style: v.union(
      v.literal("nature_documentary"),
      v.literal("sports_commentary"),
      v.literal("true_crime"),
      v.literal("reality_tv")
    ),
    
    // Commentary content
    text: v.string(),
    emotion: v.string(), // "excited", "dramatic", "hushed", etc
    
    // What triggered this commentary
    trigger: v.object({
      type: v.string(), // "shark_attack", "objective_complete", etc
      playerId: v.optional(v.id("players")),
      data: v.any()
    }),
    
    // Audio generation data (if implemented)
    audioUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    
    timestamp: v.number()
  })
    .index("by_game", ["gameId"])
    .index("by_timestamp", ["timestamp"])
});