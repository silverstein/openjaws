"use client"

import { useQuery, useMutation } from "convex/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

export default function LobbyPage() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState("")
  const [selectedArchetype, setSelectedArchetype] = useState<"influencer" | "boomer_dad" | "surfer_bro" | "lifeguard" | "marine_biologist" | "spring_breaker">("influencer")
  const [creatingGame, setCreatingGame] = useState(false)

  // Get active games
  const activeGames = useQuery(api.games.getActiveGames)

  // Mutations
  const createGame = useMutation(api.games.createGame)
  const joinGame = useMutation(api.games.joinGame)

  // Create a new game
  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name")
      return
    }

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
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
      alert("Failed to create game. Please try again.")
    } finally {
      setCreatingGame(false)
    }
  }

  // Join an existing game
  const handleJoinGame = async (gameId: Id<"games">) => {
    if (!playerName.trim()) {
      alert("Please enter your name")
      return
    }

    try {
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
      alert("Failed to join game. Game may be full or already started.")
    }
  }

  const archetypes = [
    { id: "influencer" as const, name: "Influencer", emoji: "📱" },
    { id: "boomer_dad" as const, name: "Boomer Dad", emoji: "👨‍👧" },
    { id: "surfer_bro" as const, name: "Surfer Bro", emoji: "🏄" },
    { id: "lifeguard" as const, name: "Lifeguard", emoji: "🏊" },
    { id: "marine_biologist" as const, name: "Marine Biologist", emoji: "🔬" },
    { id: "spring_breaker" as const, name: "Spring Breaker", emoji: "🎉" },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-200 to-blue-400 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <h1 className="text-6xl font-bold text-white text-center mb-8 drop-shadow-lg">
          Beach Panic: Jaws Royale
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Player Setup */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Player Setup</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Character Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {archetypes.map((archetype) => (
                    <button
                      key={archetype.id}
                      type="button"
                      onClick={() => setSelectedArchetype(archetype.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedArchetype === archetype.id
                          ? "border-pink-500 bg-pink-50 shadow-md"
                          : "border-gray-200 hover:border-pink-300"
                      }`}
                    >
                      <span className="text-2xl mb-1 block">{archetype.emoji}</span>
                      <span className="text-xs font-medium">{archetype.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateGame}
                disabled={creatingGame || !playerName.trim()}
                className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 px-6 rounded-lg text-center text-xl transition-all transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none"
              >
                {creatingGame ? "Creating..." : "Create New Game"}
              </button>

              <Link
                href="/game"
                className="block w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-lg text-center text-xl transition-all transform hover:scale-105"
              >
                Solo Practice Mode
              </Link>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-lg mb-2">How to Play:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Use WASD or Arrow Keys to swim</li>
                <li>Press SPACE to activate your special ability</li>
                <li>Press F to take selfies with the shark</li>
                <li>Press E to talk to beach NPCs</li>
                <li>Complete viral challenges while avoiding the shark</li>
                <li>Press ESC during game to return to lobby</li>
              </ul>
            </div>
          </div>

          {/* Active Games */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Active Games</h2>

            {!activeGames ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
                <p className="mt-4 text-gray-600">Loading games...</p>
              </div>
            ) : activeGames.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-lg">No active games found.</p>
                <p className="text-gray-500 text-sm mt-2">Create a new game to get started!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {activeGames.map((game) => (
                  <div
                    key={game._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{game.beachName}</h3>
                        <p className="text-sm text-gray-600">
                          Players: {game.currentPlayers}/{game.maxPlayers}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        {game.status}
                      </span>
                    </div>

                    <div className="flex gap-2 text-xs text-gray-600 mb-3">
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        Round {game.roundNumber}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {game.waterLevel}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        AI: {game.aiDifficulty}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleJoinGame(game._id)}
                      disabled={!playerName.trim() || game.currentPlayers >= game.maxPlayers}
                      className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all disabled:cursor-not-allowed"
                    >
                      {game.currentPlayers >= game.maxPlayers ? "Full" : "Join Game"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
