import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  type GameContext,
  generateSharkTaunt,
  getAPIUsageStats,
  makeSharkDecision,
  type SharkMemory,
  streamSharkThoughts,
  updateSharkMemory,
} from "@/lib/ai/sharkBrain"
import { sharkLogger } from "@/lib/logger"
import { getClientIP, rateLimit } from "@/lib/rateLimit"

// Input validation schemas
const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

const PlayerSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(50),
  position: PositionSchema,
  health: z.number().min(0).max(100),
  speed: z.number().min(0),
  isInWater: z.boolean(),
})

const SharkMemorySchema = z.object({
  playerId: z.string().max(100),
  playerName: z.string().max(50),
  encounters: z.number().min(0),
  lastSeen: z.string().or(z.date()),
  playerPattern: z.enum(["aggressive", "defensive", "erratic", "predictable"]),
  grudgeLevel: z.number().min(0).max(10),
})

const GameContextSchema = z.object({
  currentPlayers: z.array(PlayerSchema).max(50),
  sharkPosition: PositionSchema,
  sharkHealth: z.number().min(0).max(100),
  sharkPersonality: z.enum(["methodical", "theatrical", "vengeful", "philosophical", "meta"]),
  timeOfDay: z.enum(["dawn", "day", "dusk", "night"]),
  weatherCondition: z.enum(["calm", "stormy", "foggy"]),
  recentEvents: z.array(z.string().max(200)).max(50),
  memories: z.array(SharkMemorySchema).max(100),
})

const DecideActionSchema = z.object({
  action: z.literal("decide"),
  context: GameContextSchema,
})

const UpdateMemoryActionSchema = z.object({
  action: z.literal("updateMemory"),
  context: z.object({
    memories: z.array(SharkMemorySchema).max(100),
    playerId: z.string().max(100),
    playerName: z.string().max(50),
    event: z.enum(["encounter", "escape", "damaged_shark", "killed"]),
  }),
})

const TauntActionSchema = z.object({
  action: z.literal("taunt"),
  context: GameContextSchema.extend({
    trigger: z.string().max(200),
  }),
})

const StatsActionSchema = z.object({
  action: z.literal("stats"),
})

const RequestBodySchema = z.discriminatedUnion("action", [
  DecideActionSchema,
  UpdateMemoryActionSchema,
  TauntActionSchema,
  StatsActionSchema,
])

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(clientIP, 30, 60000)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: Math.ceil(rateLimitResult.resetIn / 1000) },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateLimitResult.resetIn / 1000).toString(),
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(Date.now() + rateLimitResult.resetIn).toISOString(),
          },
        }
      )
    }

    const body = await request.json()

    // Validate request body
    const parseResult = RequestBodySchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.format() },
        { status: 400 }
      )
    }

    const { action, context } = body
    const stats = getAPIUsageStats()

    if (action === "decide") {
      // Make a tactical decision
      const decision = await makeSharkDecision(context as GameContext)
      return NextResponse.json(decision, {
        headers: {
          "X-AI-Mode": stats.currentMode,
          "X-API-Calls-Remaining": stats.remaining.toString(),
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": new Date(Date.now() + rateLimitResult.resetIn).toISOString(),
        },
      })
    }

    if (action === "updateMemory") {
      const { memories, playerId, playerName, event } = context
      const updatedMemories = updateSharkMemory(
        memories as SharkMemory[],
        playerId,
        playerName,
        event
      )
      return NextResponse.json({ memories: updatedMemories })
    }

    if (action === "taunt") {
      const { trigger } = context
      const taunt = await generateSharkTaunt(context as GameContext, trigger)
      return NextResponse.json(
        { taunt },
        {
          headers: {
            "X-AI-Mode": stats.currentMode,
            "X-API-Calls-Remaining": stats.remaining.toString(),
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": new Date(Date.now() + rateLimitResult.resetIn).toISOString(),
          },
        }
      )
    }

    if (action === "stats") {
      return NextResponse.json(stats)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    sharkLogger.error("Shark brain error:", error)
    return NextResponse.json({ error: "Failed to process shark decision" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(clientIP, 30, 60000)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: Math.ceil(rateLimitResult.resetIn / 1000) },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateLimitResult.resetIn / 1000).toString(),
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(Date.now() + rateLimitResult.resetIn).toISOString(),
          },
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const contextStr = searchParams.get("context")
    const recentAction = searchParams.get("action") || "hunting"

    if (!contextStr) {
      return NextResponse.json({ error: "Context required" }, { status: 400 })
    }

    const context = JSON.parse(contextStr) as GameContext

    // Stream shark thoughts
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamSharkThoughts(context, recentAction)) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    const stats = getAPIUsageStats()
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-AI-Mode": stats.currentMode,
        "X-API-Calls-Remaining": stats.remaining.toString(),
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": new Date(Date.now() + rateLimitResult.resetIn).toISOString(),
      },
    })
  } catch (error) {
    sharkLogger.error("Shark thoughts error:", error)
    return NextResponse.json({ error: "Failed to stream shark thoughts" }, { status: 500 })
  }
}
