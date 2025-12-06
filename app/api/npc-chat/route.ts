import { type NextRequest, NextResponse } from "next/server"
import { getAPIUsageStats } from "@/lib/ai/apiTracking"
import {
  generateNPCGreeting,
  generateQuickNPCReaction,
  type NPCContext,
  streamNPCResponse,
} from "@/lib/ai/npcDialogue"

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    if (!context || !message) {
      return NextResponse.json({ error: "Message and context required" }, { status: 400 })
    }

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
      },
    })
  } catch (error) {
    console.error("NPC chat error:", error)
    return NextResponse.json({ error: "Failed to generate NPC response" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
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
