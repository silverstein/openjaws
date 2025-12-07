"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { GameCanvas } from "@/components/game/GameCanvas"
import { MultiplayerGameCanvas } from "@/components/game/MultiplayerGameCanvas"
import type { Id } from "@/convex/_generated/dataModel"

function GamePageContent() {
  const searchParams = useSearchParams()
  const gameId = searchParams.get("gameId") as Id<"games"> | null
  const userId = searchParams.get("userId")
  const playerName = searchParams.get("playerName")
  const [showHelp, setShowHelp] = useState(false)

  // If we have gameId and userId, this is a multiplayer game
  if (gameId && userId) {
    return (
      <main className="w-full h-screen h-[100dvh] overflow-hidden bg-black">
        <MultiplayerGameCanvas
          gameId={gameId}
          userId={userId}
          playerName={playerName || "Player"}
        />
      </main>
    )
  }

  // Otherwise, it's solo mode
  return (
    <main className="w-full h-screen h-[100dvh] overflow-hidden bg-black relative">
      <GameCanvas />

      {/* Game UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Mobile: Compact help button / Desktop: Full instructions */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 pointer-events-auto">
          {/* Mobile: Toggle button */}
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="sm:hidden bg-black/60 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center text-white text-lg"
            aria-label="Toggle help"
          >
            {showHelp ? "✕" : "?"}
          </button>

          {/* Mobile: Expandable help panel */}
          {showHelp && (
            <div className="sm:hidden absolute top-12 left-0 bg-black/80 backdrop-blur-sm rounded-lg p-3 min-w-[200px]">
              <div className="text-white/90 text-xs space-y-1">
                <p>🎮 Use joystick to move</p>
                <p>📸 Tap camera for selfie</p>
                <p>📱 Tap ability button</p>
                <p>🦈 Avoid the shark!</p>
              </div>
            </div>
          )}

        </div>

      </div>
    </main>
  )
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen h-[100dvh] flex items-center justify-center bg-gradient-to-b from-sky-300 to-blue-600">
          <div className="text-center px-4">
            <div className="text-5xl mb-4 animate-bounce">🦈</div>
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-white mx-auto mb-3" />
            <p className="text-white text-base sm:text-lg font-medium">Loading game...</p>
          </div>
        </div>
      }
    >
      <GamePageContent />
    </Suspense>
  )
}
