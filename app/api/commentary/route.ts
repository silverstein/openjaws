import { streamText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import {
  determineAIMode,
  getAPIUsageStats,
  trackAPIUsage,
  updateCurrentMode,
} from "@/lib/ai/apiTracking"
import { aiConfig, models } from "@/lib/ai/config"
import { streamMockCommentary } from "@/lib/ai/mockResponses"

interface CommentaryContext {
  event: string
  players: string[]
  sharkHealth: number
  intensity: "calm" | "building" | "intense" | "climactic"
  style: "documentary" | "sports" | "horror" | "comedic"
}

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json()
    const { event, players, sharkHealth, intensity, style } = context as CommentaryContext

    const stylePrompts = {
      documentary:
        "You're David Attenborough narrating a nature documentary about sharks and humans.",
      sports:
        "You're an excited sports commentator calling the action like it's the championship finals.",
      horror: "You're the narrator of a suspenseful horror film, building dread and tension.",
      comedic:
        "You're a comedic narrator finding humor in the chaos while still respecting the danger.",
    }

    const prompt = `${stylePrompts[style]}
    
Current event: ${event}
Players involved: ${players.join(", ")}
Shark health: ${sharkHealth}%
Intensity level: ${intensity}

Provide commentary for this moment. Keep it brief (1-2 sentences) but impactful. Match the intensity level.`

    const mode = determineAIMode()
    updateCurrentMode(mode)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use mock commentary if in mock mode
          if (mode === "mock" || mode === "cached") {
            console.log(`[Commentary] Using ${mode} mode`)

            // Stream mock commentary
            for await (const chunk of streamMockCommentary(style as any, intensity as any, event)) {
              controller.enqueue(encoder.encode(chunk))
            }
            controller.close()
            return
          }

          // Real AI call
          trackAPIUsage("commentary")

          const response = streamText({
            model: models.commentary,
            prompt,
            temperature: aiConfig.temperature.commentary,
            maxOutputTokens: aiConfig.maxTokens.commentary,
          })

          for await (const chunk of response.textStream) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (error) {
          console.error("Commentary streaming error:", error)
          // Fallback to mock on error
          for await (const chunk of streamMockCommentary(style as any, intensity as any, event)) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
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
    console.error("Commentary error:", error)
    return NextResponse.json({ error: "Failed to generate commentary" }, { status: 500 })
  }
}

// Placeholder for future features
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: "Commentary system ready",
    availableStyles: ["documentary", "sports", "horror", "comedic"],
    status: "placeholder",
  })
}
