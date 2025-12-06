"use client"

import { useEffect, useState } from "react"
import { GameCanvas } from "@/components/game/GameCanvas"

export default function AIDemo() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-600">
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🦈</div>
            <h1 className="text-3xl font-bold text-white mb-2">Initializing Shark AI...</h1>
            <p className="text-white/80">Loading neural networks and pattern recognition systems</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Game Canvas */}
          <GameCanvas />

          {/* Instructions Overlay */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white p-4 rounded-lg">
            <h2 className="text-lg font-bold mb-2">AI Demo Controls</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Movement:</strong> WASD or Arrow Keys
              </div>
              <div>
                <strong>Ability:</strong> Spacebar
              </div>
              <div>
                <strong>Exit:</strong> ESC
              </div>
              <div>
                <strong>Watch AI:</strong> Observe decisions
              </div>
            </div>
          </div>

          {/* AI Features */}
          <div className="absolute top-4 right-1/2 transform translate-x-1/2 bg-black/50 text-white p-3 rounded-lg max-w-md">
            <h3 className="text-sm font-bold mb-1">🧠 AI Features Active</h3>
            <ul className="text-xs space-y-1">
              <li>• Pattern Recognition: Learns your movement habits</li>
              <li>• Memory System: Remembers past encounters</li>
              <li>• Personality Modes: Different hunting strategies</li>
              <li>• Real-time Decisions: Updates every 2.5 seconds</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
