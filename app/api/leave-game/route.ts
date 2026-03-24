import { type NextRequest, NextResponse } from "next/server"

/**
 * Lightweight endpoint for sendBeacon cleanup when a player closes the tab.
 * The actual game leave logic runs via Convex mutation from the client.
 * This route exists as a fallback — sendBeacon can't call Convex directly.
 *
 * For now, this is a no-op acknowledgment. A proper implementation would
 * use the Convex HTTP client to call the leaveGame mutation server-side.
 */
export async function POST(request: NextRequest) {
  const playerId = new URL(request.url).searchParams.get("playerId")

  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 })
  }

  // TODO: Call Convex leaveGame mutation server-side for reliable cleanup
  // For now, the client-side React unmount handler handles most cases
  return NextResponse.json({ ok: true })
}
