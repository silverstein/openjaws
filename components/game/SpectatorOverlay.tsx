"use client"

import { useState, useEffect } from "react"

type SharkPersonality = "methodical" | "theatrical" | "vengeful" | "philosophical" | "meta" | "dadJoke"

const SPECTATOR_COMMENTARY: Record<SharkPersonality, string[]> = {
  methodical: [
    "The shark calculates its next move with surgical precision...",
    "Patient. Methodical. Every movement has purpose.",
    "It's studying the remaining swimmers like a chess grandmaster.",
    "The water falls silent. The shark is thinking.",
  ],
  theatrical: [
    "And NOW the shark circles dramatically for maximum effect!",
    "Ladies and gentlemen, the show continues!",
    "It's building suspense... the audience is on the edge of their seats!",
    "What a performance! Bravo! BRAVO!",
  ],
  vengeful: [
    "The shark remembers every slight. Every escape. Every harpoon hit.",
    "It circles with singular focus. Someone is going to pay.",
    "Revenge is a dish best served... wet.",
    "The grudge list just got longer.",
  ],
  philosophical: [
    "The shark pauses to contemplate the futility of escape...",
    "Is the ocean the shark's prison, or its kingdom?",
    "It hunts not out of malice, but out of existential necessity.",
    "In the grand tapestry of marine biology, this is but a thread.",
  ],
  meta: [
    "The shark is probably going to clip through that wall. Classic.",
    "It's using the meta strat. Respect.",
    "Patch notes: shark buffed, swimmers nerfed. As usual.",
    "This is what we call a 'skill diff' in the business.",
  ],
  dadJoke: [
    "The shark is thinking of its next pun. This could take a while.",
    "What did the ocean say to the shark? Nothing, it just waved! ...the shark is waving.",
    "The shark swims in circles because it's trying to think of a good joke. It's going in CIRCLES!",
    "Why don't sharks like basketball? They're afraid of the NET!",
  ],
}

interface SpectatorOverlayProps {
  sharkPersonality: SharkPersonality
  visible: boolean
  onReturnToLobby: () => void
  onPlayAgain: () => void
}

export function SpectatorOverlay({ sharkPersonality, visible, onReturnToLobby, onPlayAgain }: SpectatorOverlayProps) {
  const [commentary, setCommentary] = useState("")
  const [, setCommentaryIndex] = useState(0)

  useEffect(() => {
    if (!visible) return

    const lines = SPECTATOR_COMMENTARY[sharkPersonality] || SPECTATOR_COMMENTARY.theatrical

    // Show first commentary immediately
    setCommentary(lines[0] ?? "")
    setCommentaryIndex(0)

    // Rotate commentary every 5 seconds
    const interval = setInterval(() => {
      setCommentaryIndex(prev => {
        const next = (prev + 1) % lines.length
        setCommentary(lines[next] ?? "")
        return next
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [visible, sharkPersonality])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 top-0 z-40 pointer-events-none">
      {/* Spectator banner */}
      <div className="flex justify-center pt-4">
        <div className="bg-black/70 backdrop-blur-sm rounded-full px-6 py-2 flex items-center gap-3 pointer-events-auto">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white font-bold text-sm uppercase tracking-wider">Spectating</span>
          <span className="text-white/50 text-xs">|</span>
          <span className="text-white/70 text-xs">The {sharkPersonality} shark hunts on...</span>
        </div>
      </div>

      {/* Rolling commentary */}
      <div className="flex justify-center mt-3">
        <div className="bg-black/50 backdrop-blur-sm rounded-xl px-5 py-3 max-w-md mx-4 transition-all duration-500">
          <p className="text-white/80 text-sm italic text-center">{commentary}</p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="fixed inset-x-0 bottom-0 flex justify-center pb-6 pointer-events-auto">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-lg"
          >
            🦈 Play Again
          </button>
          <button
            type="button"
            onClick={onReturnToLobby}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all backdrop-blur-sm"
          >
            Lobby
          </button>
        </div>
      </div>
    </div>
  )
}
