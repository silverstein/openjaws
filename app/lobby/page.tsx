"use client"

import { useQuery, useMutation } from "convex/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice"
import { useIsLandscape } from "@/hooks/useIsLandscape"
import { useGameAudio } from "@/hooks/useGameAudio"
import { loadHighScores, getStatsLine, type HighScores } from "@/lib/game/HighScores"

const SHARK_PERSONALITIES = [
  { id: "theatrical", name: "Theatrical", emoji: "🎭", desc: "Dramatic flair" },
  { id: "dadJoke", name: "Dad Joke", emoji: "😂", desc: "Terrible puns" },
  { id: "meta", name: "Meta", emoji: "🎮", desc: "Knows it's a game" },
  { id: "philosophical", name: "Philosopher", emoji: "🤔", desc: "Deep thoughts" },
  { id: "vengeful", name: "Vengeful", emoji: "😤", desc: "Holds grudges" },
  { id: "methodical", name: "Methodical", emoji: "🧠", desc: "Calculated" },
] as const

export default function LobbyPage() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState("")
  const [selectedShark, setSelectedShark] = useState("theatrical")
  const [selectedArchetype, setSelectedArchetype] = useState<"influencer" | "boomer_dad" | "surfer_bro" | "lifeguard" | "marine_biologist" | "spring_breaker">("influencer")
  const [creatingGame, setCreatingGame] = useState(false)
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [dismissedLandscapeTip, setDismissedLandscapeTip] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [highScores, setHighScores] = useState<HighScores | null>(null)
  const isTouchDevice = useIsTouchDevice()
  const isLandscape = useIsLandscape()
  const { initializeAudio, playSound, stopAllSounds } = useGameAudio() // Initialize useGameAudio

  // Load high scores on mount
  useEffect(() => {
    setHighScores(loadHighScores())
  }, [])

  // Lazy-start lobby music after first user interaction (avoids autoplay block)
  useEffect(() => {
    let musicId: string | null = null
    let started = false

    const tryStart = async () => {
      if (started) return
      const ok = await initializeAudio()
      if (ok) {
        started = true
        musicId = playSound("lobby_music", { loop: true, volume: 0.5, fadeIn: 2 })
        window.removeEventListener("pointerdown", tryStart)
        window.removeEventListener("keydown", tryStart)
      }
    }

    window.addEventListener("pointerdown", tryStart)
    window.addEventListener("keydown", tryStart)

    return () => {
      window.removeEventListener("pointerdown", tryStart)
      window.removeEventListener("keydown", tryStart)
      if (musicId) stopAllSounds()
    }
  }, [initializeAudio, playSound, stopAllSounds])

  // Get active games
  const activeGames = useQuery(api.games.getActiveGames)

  // Mutations
  const createGame = useMutation(api.games.createGame)
  const joinGame = useMutation(api.games.joinGame)

  // Create a new game
  const handleCreateGame = async () => {
    // Ensure audio is initialized/resumed on user action
    await initializeAudio();

    if (!playerName.trim()) {
      setErrorMessage("Please enter your name!")
      return
    }

    setErrorMessage(null)
    setCreatingGame(true)
    try {
      const gameId = await createGame({
        beachName: `${playerName}'s Beach`,
        maxPlayers: 12,
        aiDifficulty: "local",
        objectivesEnabled: true,
        commentary: true,
      })

      // Join as a swimmer
      const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      await joinGame({
        gameId,
        userId,
        name: playerName,
        role: "swimmer",
        archetype: selectedArchetype,
      })

      // Store gameId and userId in sessionStorage
      sessionStorage.setItem("gameId", gameId)
      sessionStorage.setItem("userId", userId)
      sessionStorage.setItem("playerName", playerName)

      // Navigate to game
      router.push(`/game?gameId=${gameId}&userId=${userId}`)
    } catch (error) {
      console.error("Failed to create game:", error)
      setErrorMessage("Failed to create game. The shark might be busy... try again!")
    } finally {
      setCreatingGame(false)
    }
  }

  // Join an existing game
  const handleJoinGame = async (gameId: Id<"games">) => {
    // Ensure audio is initialized/resumed on user action
    await initializeAudio();

    if (!playerName.trim()) {
      setErrorMessage("Please enter your name!")
      return
    }

    setErrorMessage(null)
    try {
      const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      await joinGame({
        gameId,
        userId,
        name: playerName,
        role: "swimmer",
        archetype: selectedArchetype,
      })

      // Store gameId and userId in sessionStorage
      sessionStorage.setItem("gameId", gameId)
      sessionStorage.setItem("userId", userId)
      sessionStorage.setItem("playerName", playerName)

      // Navigate to game
      router.push(`/game?gameId=${gameId}&userId=${userId}`)
    } catch (error) {
      console.error("Failed to join game:", error)
      setErrorMessage("Couldn't join — game might be full or the shark scared everyone away!")
    }
  }

  const archetypes = [
    { id: "influencer" as const, name: "Influencer", emoji: "📱", desc: "Selfie master" },
    { id: "boomer_dad" as const, name: "Dad", emoji: "👨‍👧", desc: "Slow but tough" },
    { id: "surfer_bro" as const, name: "Surfer", emoji: "🏄", desc: "Fast swimmer" },
    { id: "lifeguard" as const, name: "Lifeguard", emoji: "🏊", desc: "Rescue others" },
    { id: "marine_biologist" as const, name: "Scientist", emoji: "🔬", desc: "Shark expert" },
    { id: "spring_breaker" as const, name: "Partier", emoji: "🎉", desc: "Wild card" },
  ]

  return (
    <main className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-sky-300 via-sky-400 to-blue-600 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Sun */}
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-16 h-16 sm:w-24 sm:h-24 bg-yellow-300 rounded-full blur-sm opacity-80" />

        {/* Waves */}
        <div className="absolute bottom-0 left-0 right-0 h-32 sm:h-48">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
              fill="rgba(255,255,255,0.1)"
              d="M0,64 C480,150 960,-20 1440,64 L1440,120 L0,120 Z"
              className="animate-[wave_8s_ease-in-out_infinite]"
            />
            <path
              fill="rgba(255,255,255,0.15)"
              d="M0,80 C360,20 720,140 1440,80 L1440,120 L0,120 Z"
              className="animate-[wave_6s_ease-in-out_infinite_reverse]"
            />
          </svg>
        </div>

        {/* Swimming shark fin */}
        <div className="absolute top-1/3 animate-[swim_12s_linear_infinite] opacity-60">
          <div className="text-4xl sm:text-5xl transform -scale-x-100">🦈</div>
        </div>
      </div>

      {/* Landscape mode tip for mobile portrait */}
      {isTouchDevice && !isLandscape && !dismissedLandscapeTip && (
        <div className="relative z-20 mx-4 mt-2 mb-0">
          <div className="bg-blue-900/80 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center justify-between gap-3 border border-blue-400/30">
            <div className="flex items-center gap-2 text-white text-sm">
              <span className="text-lg">📱↔️</span>
              <span>Rotate to <strong>landscape</strong> for best gameplay!</span>
            </div>
            <button
              onClick={() => setDismissedLandscapeTip(true)}
              className="text-white/60 hover:text-white text-lg font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-8 pb-safe">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] tracking-tight">
              <span className="text-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">BEACH</span>{" "}
              <span className="text-white">PANIC</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-white/90 mt-1 tracking-wide">
              Jaws Royale
            </p>
            <p className="text-xs sm:text-sm text-white/70 mt-2">
              Survive the shark. Complete challenges. Don&apos;t get eaten.
            </p>
          </header>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Player Setup - takes more space */}
            <div className="lg:col-span-3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6">
              {/* Name input */}
              <div className="mb-4">
                <label htmlFor="playerName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Your Name
                </label>
                <input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all"
                  maxLength={20}
                />
              </div>

              {/* Character selection */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Choose Your Character
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {archetypes.map((archetype) => (
                    <button
                      key={archetype.id}
                      type="button"
                      onClick={() => setSelectedArchetype(archetype.id)}
                      className={`p-2 sm:p-3 rounded-xl border-2 transition-all flex flex-col items-center min-h-[70px] sm:min-h-[80px] ${
                        selectedArchetype === archetype.id
                          ? "border-red-400 bg-red-50 shadow-lg scale-105"
                          : "border-gray-200 hover:border-red-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl">{archetype.emoji}</span>
                      <span className="text-[10px] sm:text-xs font-semibold mt-1 text-gray-700 leading-tight">
                        {archetype.name}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedArchetype && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {archetypes.find(a => a.id === selectedArchetype)?.desc}
                  </p>
                )}
              </div>

              {/* Shark personality picker */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Choose Your Shark 🦈
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {SHARK_PERSONALITIES.map((shark) => (
                    <button
                      key={shark.id}
                      type="button"
                      onClick={() => setSelectedShark(shark.id)}
                      className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center min-h-[60px] ${
                        selectedShark === shark.id
                          ? "border-purple-400 bg-purple-50 shadow-lg scale-105"
                          : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xl">{shark.emoji}</span>
                      <span className="text-[10px] font-semibold mt-0.5 text-gray-700 leading-tight">
                        {shark.name}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1.5 text-center">
                  {SHARK_PERSONALITIES.find(s => s.id === selectedShark)?.desc}
                </p>
              </div>

              {/* High scores */}
              {highScores && highScores.totalGames > 0 && (
                <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">🏆</span>
                    <span className="text-sm font-bold text-gray-700">Your Stats</span>
                  </div>
                  <p className="text-xs text-gray-600">{getStatsLine(highScores)}</p>
                </div>
              )}

              {/* Error message */}
              {errorMessage && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                  <span>🦈</span>
                  <span>{errorMessage}</span>
                  <button type="button" onClick={() => setErrorMessage(null)} className="ml-auto text-red-400 hover:text-red-600 font-bold">✕</button>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <Link
                  href={`/game?archetype=${selectedArchetype}&name=${encodeURIComponent(playerName || "Player")}&shark=${selectedShark}`}
                  onClick={() => {
                    sessionStorage.setItem("selectedArchetype", selectedArchetype)
                    sessionStorage.setItem("playerName", playerName || "Player")
                    sessionStorage.setItem("selectedShark", selectedShark)
                  }}
                  className="block w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl text-center text-base sm:text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  🦈 Play Now
                </Link>

                <button
                  type="button"
                  onClick={handleCreateGame}
                  disabled={creatingGame || !playerName.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-xl text-center text-sm sm:text-base transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none shadow-md"
                >
                  {creatingGame ? "Creating..." : "Create Multiplayer Game"}
                </button>
              </div>

              {/* How to play - collapsible on mobile */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowHowToPlay(!showHowToPlay)}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-xl text-left hover:bg-blue-100 transition-colors"
                >
                  <span className="font-semibold text-sm text-gray-700">How to Play</span>
                  <span className={`transform transition-transform ${showHowToPlay ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${showHowToPlay ? 'max-h-96 mt-2' : 'max-h-0'}`}>
                  <div className="p-3 bg-blue-50/50 rounded-xl">
                    {isTouchDevice ? (
                      /* Touch controls */
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🕹️</span>
                          <span>Joystick to move</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⚡</span>
                          <span>Tap for ability</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📸</span>
                          <span>Tap for selfie</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💬</span>
                          <span>Tap to talk</span>
                        </div>
                      </div>
                    ) : (
                      /* Keyboard controls */
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <kbd className="px-2 py-1 bg-gray-200 rounded text-[10px] font-mono">WASD</kbd>
                          <span>Move</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <kbd className="px-2 py-1 bg-gray-200 rounded text-[10px] font-mono">SPACE</kbd>
                          <span>Ability</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <kbd className="px-2 py-1 bg-gray-200 rounded text-[10px] font-mono">F</kbd>
                          <span>Selfie</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <kbd className="px-2 py-1 bg-gray-200 rounded text-[10px] font-mono">E</kbd>
                          <span>Talk</span>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Complete viral challenges while avoiding the AI shark!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Games - sidebar */}
            <div className="lg:col-span-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Active Games
              </h2>

              {!activeGames ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto" />
                  <p className="mt-3 text-sm text-gray-500">Loading...</p>
                </div>
              ) : activeGames.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">🏖️</div>
                  <p className="text-gray-600 text-sm">No active games</p>
                  <p className="text-gray-400 text-xs mt-1">Create one to start!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] lg:max-h-[400px] overflow-y-auto pr-1">
                  {activeGames.map((game) => (
                    <div
                      key={game._id}
                      className="border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all hover:border-gray-300"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-gray-800 truncate">
                            {game.beachName}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {game.currentPlayers}/{game.maxPlayers} players
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full ml-2 shrink-0">
                          {game.status}
                        </span>
                      </div>

                      <div className="flex gap-1.5 text-[10px] text-gray-500 mb-2 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                          R{game.roundNumber}
                        </span>
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded capitalize">
                          {game.waterLevel}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleJoinGame(game._id)}
                        disabled={!playerName.trim() || game.currentPlayers >= game.maxPlayers}
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all disabled:cursor-not-allowed"
                      >
                        {game.currentPlayers >= game.maxPlayers ? "Full" : "Join"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-6 text-center">
            <p className="text-xs text-white/60">
              AI-powered shark • Real-time multiplayer • Built with Next.js + Convex
            </p>
          </footer>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-25px); }
        }
        @keyframes swim {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(calc(100vw + 100px)); }
        }
      `}</style>
    </main>
  )
}
