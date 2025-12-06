import { type NextRequest, NextResponse } from "next/server"
import {
  type GameContext,
  generateSharkTaunt,
  getAPIUsageStats,
  makeSharkDecision,
  type SharkMemory,
  streamSharkThoughts,
  updateSharkMemory,
} from "@/lib/ai/sharkBrain"

export async function POST(request: NextRequest) {
  try {
    const { action, context } = await request.json()
    const stats = getAPIUsageStats()

    if (action === "decide") {
      // Make a tactical decision
      const decision = await makeSharkDecision(context as GameContext)
      return NextResponse.json(decision, {
        headers: {
          "X-AI-Mode": stats.currentMode,
          "X-API-Calls-Remaining": stats.remaining.toString(),
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
          },
        }
      )
    }

    if (action === "stats") {
      return NextResponse.json(stats)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Shark brain error:", error)
    return NextResponse.json({ error: "Failed to process shark decision" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
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
      },
    })
  } catch (error) {
    console.error("Shark thoughts error:", error)
    return NextResponse.json({ error: "Failed to stream shark thoughts" }, { status: 500 })
  }
}
