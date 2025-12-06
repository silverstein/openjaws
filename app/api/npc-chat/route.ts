import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAPIUsageStats } from "@/lib/ai/apiTracking"
import {
  generateNPCGreeting,
  generateQuickNPCReaction,
  type NPCContext,
  streamNPCResponse,
} from "@/lib/ai/npcDialogue"
import { getClientIP, rateLimit } from "@/lib/rateLimit"

// Input validation schemas
const NPCTypeSchema = z.enum([
  "beach_vendor",
  "lifeguard",
  "tourist",
  "surfer",
  "scientist",
  "reporter",
  "old_timer",
  "fish_vendor",
])

const NPCContextSchema = z.object({
  npcType: NPCTypeSchema,
  npcName: z.string().min(1).max(50),
  playerName: z.string().min(1).max(50),
  currentEvent: z.enum(["shark_nearby", "player_hurt", "calm", "storm", "shark_attack"]).optional(),
  recentSharkSighting: z.boolean().optional(),
  timeOfDay: z.enum(["dawn", "day", "dusk", "night"]),
  previousMessages: z.array(z.string().max(500)).max(50).optional(),
})

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(500).trim(),
  context: NPCContextSchema,
})

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
    const parseResult = ChatRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.format() },
        { status: 400 }
      )
    }

    const { message, context } = parseResult.data
    const npcContext = context as NPCContext

    // Stream NPC response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamNPCResponse(npcContext, message)) {
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
    console.error("NPC chat error:", error)
    return NextResponse.json({ error: "Failed to generate NPC response" }, { status: 500 })
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
    const action = searchParams.get("action")

    if (action === "greeting") {
      const contextStr = searchParams.get("context")
      if (!contextStr) {
        return NextResponse.json({ error: "Context required for greeting" }, { status: 400 })
      }

      const context = JSON.parse(contextStr) as NPCContext
      const greeting = await generateNPCGreeting(context)
      const stats = getAPIUsageStats()

      return NextResponse.json(
        { greeting },
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

    if (action === "reaction") {
      const npcType = searchParams.get("npcType") as NPCContext["npcType"]
      const event = searchParams.get("event") as Parameters<typeof generateQuickNPCReaction>[1]

      if (!npcType || !event) {
        return NextResponse.json({ error: "NPC type and event required" }, { status: 400 })
      }

      const reaction = generateQuickNPCReaction(npcType, event)
      return NextResponse.json({ reaction })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("NPC action error:", error)
    return NextResponse.json({ error: "Failed to process NPC action" }, { status: 500 })
  }
}
