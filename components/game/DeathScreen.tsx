"use client"

import { useState, useEffect } from "react"

type SharkPersonality = "methodical" | "theatrical" | "vengeful" | "philosophical" | "meta" | "dadJoke"

const PERSONALITY_TAUNTS: Record<SharkPersonality, string[]> = {
  methodical: [
    "Target eliminated. Efficiency: 94%.",
    "Predicted your trajectory 3.2 seconds ago.",
    "You zigged. You should have zagged. I calculated both.",
    "Another data point collected. Thank you for your contribution.",
  ],
  theatrical: [
    "AND THE CROWD GOES WILD! WHAT A PERFORMANCE!",
    "That, ladies and gentlemen, was my MASTERPIECE!",
    "I'd like to thank the Academy... and my lunch.",
    "Standing ovation! ...well, you can't stand anymore. But still!",
  ],
  vengeful: [
    "I TOLD you I'd remember. I ALWAYS remember.",
    "That's for last time. And the time before. And the time before THAT.",
    "Cross me once, shame on you. Cross me twice... well, you won't.",
    "Your name just moved to the TOP of my list.",
  ],
  philosophical: [
    "In the end, are we not all consumed by the ocean of existence?",
    "To eat or not to eat... who am I kidding, definitely eat.",
    "You sought the ocean's truth. I delivered it. You're welcome.",
    "As Sartre said: 'Hell is other sharks.' ...wait, I might be misquoting.",
  ],
  meta: [
    "GG EZ. Uninstall.",
    "Skill issue, honestly.",
    "I'd say 'get good' but you literally can't now.",
    "That's going in the highlight reel. Not YOUR highlight reel, obviously.",
    "Respawn in 3... 2... 1... just kidding, go back to the lobby.",
  ],
  dadJoke: [
    "What do you call someone who just got eaten by a shark? LUNCH! 🥁",
    "I'm on a seafood diet. I see food, I eat it! ...that was you. You were the food.",
    "Why did YOU cross the ocean? ...you didn't. I got you first! 😎",
    "What's your favorite music? ...doesn't matter, mine is BITE-hoven! 🦈🎵",
    "I'd say this is the END... but it's really more of a CHOMP-ter ending!",
    "How do sharks greet people? Pleased to EAT you!",
  ],
}

const DEATH_EMOJIS = ["🦈", "💀", "🌊", "😱", "🦴"]

interface DeathScreenProps {
  sharkPersonality: SharkPersonality
  playerName: string
  stats: { damageDealt: number; selfiesTaken: number; deaths: number }
  onReturnToLobby: () => void
  onPlayAgain: () => void
  isTouchDevice: boolean
}

export function DeathScreen({
  sharkPersonality,
  playerName,
  stats,
  onReturnToLobby,
  onPlayAgain,
  isTouchDevice,
}: DeathScreenProps) {
  const [taunt, setTaunt] = useState("")
  const [emoji] = useState(() => DEATH_EMOJIS[Math.floor(Math.random() * DEATH_EMOJIS.length)])

  useEffect(() => {
    const taunts = PERSONALITY_TAUNTS[sharkPersonality] || PERSONALITY_TAUNTS.theatrical
    setTaunt(taunts[Math.floor(Math.random() * taunts.length)] ?? "CHOMP!")
  }, [sharkPersonality])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
      <div className="text-center px-6 max-w-lg">
        {/* Big shark emoji with bounce */}
        <div className="text-7xl mb-4 animate-bounce">{emoji}</div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-black text-red-500 mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          GAME OVER
        </h1>
        <p className="text-white/50 text-sm mb-3">RIP {playerName}</p>

        {/* Personality taunt */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
          <p className="text-white/60 text-xs mb-1 uppercase tracking-wider">
            The {sharkPersonality} shark says:
          </p>
          <p className="text-white text-lg sm:text-xl font-medium italic">
            &ldquo;{taunt}&rdquo;
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex justify-center gap-6 mb-6 text-white/70 text-sm">
          <div>
            <span className="block text-2xl font-bold text-white">{stats.damageDealt}</span>
            damage dealt
          </div>
          <div>
            <span className="block text-2xl font-bold text-white">{stats.selfiesTaken}</span>
            selfies taken
          </div>
          <div>
            <span className="block text-2xl font-bold text-white">{stats.deaths}</span>
            times eaten
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            🦈 Try Again
          </button>
          <button
            type="button"
            onClick={onReturnToLobby}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all"
          >
            Back to Lobby
          </button>
        </div>

        {/* Hint */}
        <p className="text-white/40 text-xs mt-4">
          {isTouchDevice ? "Tap to continue" : "Press ESC for lobby"}
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
