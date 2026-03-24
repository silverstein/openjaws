"use client"

import { useState, useEffect } from "react"

const ROUND_FLAVORS: Record<number, { title: string; subtitle: string; emoji: string }> = {
  1: { title: "Beach Day Basics", subtitle: "Learn the ropes!", emoji: "🏖️" },
  2: { title: "Beach Explorer", subtitle: "The shark is getting hungry. Gear up!", emoji: "🔍" },
  3: { title: "Shark Hunter", subtitle: "Time to fight back!", emoji: "⚔️" },
}

function getEscalationFlavor(round: number) {
  const level = round - 3
  if (level <= 2) return { title: `Shark Frenzy ${level}!`, subtitle: "The shark is ANGRY!", emoji: "🔥" }
  if (level <= 4) return { title: `Shark Rampage ${level}!`, subtitle: "It's getting dangerous...", emoji: "💀" }
  return { title: `MEGA SHARK ${level}!`, subtitle: "HOW IS IT STILL GETTING FASTER?!", emoji: "🌋" }
}

interface RoundBannerProps {
  round: number
  score: number
  visible: boolean
  onCountdownComplete: () => void
}

export function RoundBanner({ round, score, visible, onCountdownComplete }: RoundBannerProps) {
  const [countdown, setCountdown] = useState(3)

  const flavor = ROUND_FLAVORS[round] || getEscalationFlavor(round)
  const speedBoost = round > 1 ? `+${(round - 1) * 10}% speed` : null

  useEffect(() => {
    if (!visible) {
      setCountdown(3)
      return
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setTimeout(onCountdownComplete, 300)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [visible, onCountdownComplete])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center px-6">
        {/* Round number */}
        <div className="text-6xl mb-3 animate-bounce">{flavor.emoji}</div>
        <h1 className="text-5xl sm:text-7xl font-black text-white mb-2 tracking-tight">
          ROUND {round}
        </h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-1">
          {flavor.title}
        </h2>
        <p className="text-white/70 text-lg mb-6">
          {flavor.subtitle}
        </p>

        {/* Stats row */}
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{score}</div>
            <div className="text-white/50 text-sm">Score</div>
          </div>
          {speedBoost && (
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">🦈 {speedBoost}</div>
              <div className="text-white/50 text-sm">Shark buff</div>
            </div>
          )}
        </div>

        {/* Countdown */}
        <div className="text-6xl font-black text-white animate-pulse">
          {countdown > 0 ? countdown : "GO!"}
        </div>
      </div>
    </div>
  )
}
