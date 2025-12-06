"use client"

import { useQuery, useMutation } from "convex/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

export interface UseMultiplayerGameProps {
  gameId: Id<"games"> | null
  userId: string
  playerName: string
  onGameEnd?: () => void
}

export function useMultiplayerGame({
  gameId,
  userId,
  playerName,
  onGameEnd,
}: UseMultiplayerGameProps) {
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null)
  const [isHost, setIsHost] = useState(false)
  const lastUpdateRef = useRef<number>(0)

  // Queries - real-time subscriptions
  const gameDetails = useQuery(
    api.games.getGameDetails,
    gameId ? { gameId } : "skip"
  )

  const sharkState = useQuery(
    api.sharks.getSharkState,
    gameId ? { gameId } : "skip"
  )

  const alivePlayers = useQuery(
    api.players.getAlivePlayers,
    gameId ? { gameId } : "skip"
  )

  // Mutations
  const joinGameMutation = useMutation(api.games.joinGame)
  const leaveGameMutation = useMutation(api.games.leaveGame)
  const updatePlayerMovementMutation = useMutation(api.players.updatePlayerMovement)
  const updateSharkStateMutation = useMutation(api.sharks.updateSharkState)
  const useAbilityMutation = useMutation(api.players.useAbility)
  const updatePlayerStatsMutation = useMutation(api.players.updatePlayerStats)
  const playerEatenMutation = useMutation(api.players.playerEaten)

  // Join game as swimmer
  const joinAsSwimmer = useCallback(
    async (archetype: "influencer" | "boomer_dad" | "surfer_bro" | "lifeguard" | "marine_biologist" | "spring_breaker") => {
      if (!gameId) return null

      try {
        const newPlayerId = await joinGameMutation({
          gameId,
          userId,
          name: playerName,
          role: "swimmer",
          archetype,
        })
        setPlayerId(newPlayerId)
        setIsHost(false)
        return newPlayerId
      } catch (error) {
        console.error("Failed to join game:", error)
        throw error
      }
    },
    [gameId, userId, playerName, joinGameMutation]
  )

  // Join game as shark
  const joinAsShark = useCallback(async () => {
    if (!gameId) return null

    try {
      const newPlayerId = await joinGameMutation({
        gameId,
        userId,
        name: playerName,
        role: "shark",
      })
      setPlayerId(newPlayerId)
      setIsHost(true) // First shark is the host
      return newPlayerId
    } catch (error) {
      console.error("Failed to join game as shark:", error)
      throw error
    }
  }, [gameId, userId, playerName, joinGameMutation])

  // Leave game
  const leaveGame = useCallback(async () => {
    if (!playerId) return

    try {
      await leaveGameMutation({ playerId })
      setPlayerId(null)
      setIsHost(false)
    } catch (error) {
      console.error("Failed to leave game:", error)
    }
  }, [playerId, leaveGameMutation])

  // Update player position (throttled)
  const updatePlayerPosition = useCallback(
    async (position: { x: number; y: number; z: number }, velocity: { x: number; y: number; z: number }) => {
      if (!playerId) return

      const now = Date.now()
      // Throttle updates to max 20/sec (50ms)
      if (now - lastUpdateRef.current < 50) {
        return
      }
      lastUpdateRef.current = now

      try {
        await updatePlayerMovementMutation({
          playerId,
          position,
          velocity,
        })
      } catch (error) {
        console.error("Failed to update player position:", error)
      }
    },
    [playerId, updatePlayerMovementMutation]
  )

  // Update shark state (for host only)
  const updateSharkState = useCallback(
    async (
      position: { x: number; y: number; z: number },
      velocity: { x: number; y: number; z: number },
      state: string,
      targetPlayerId?: Id<"players">,
      hunger?: number,
      rage?: number
    ) => {
      if (!playerId || !isHost) return

      const now = Date.now()
      // Throttle shark updates to max 20/sec (50ms)
      if (now - lastUpdateRef.current < 50) {
        return
      }
      lastUpdateRef.current = now

      try {
        await updateSharkStateMutation({
          playerId,
          position,
          velocity,
          state,
          targetPlayerId,
          hunger,
          rage,
        })
      } catch (error) {
        console.error("Failed to update shark state:", error)
      }
    },
    [playerId, isHost, updateSharkStateMutation]
  )

  // Use ability
  const useAbility = useCallback(
    async (targetPosition?: { x: number; y: number; z: number }, targetPlayerId?: Id<"players">) => {
      if (!playerId) return

      try {
        const result = await useAbilityMutation({
          playerId,
          targetPosition,
          targetPlayerId,
        })
        return result
      } catch (error) {
        console.error("Failed to use ability:", error)
        throw error
      }
    },
    [playerId, useAbilityMutation]
  )

  // Update stats
  const updateStats = useCallback(
    async (stats: {
      health?: number
      stamina?: number
      sharkHunger?: number
      sharkRage?: number
    }) => {
      if (!playerId) return

      try {
        await updatePlayerStatsMutation({
          playerId,
          ...stats,
        })
      } catch (error) {
        console.error("Failed to update stats:", error)
      }
    },
    [playerId, updatePlayerStatsMutation]
  )

  // Handle player being eaten
  const handlePlayerEaten = useCallback(
    async (swimmerId: Id<"players">) => {
      if (!playerId || !isHost) return

      try {
        await playerEatenMutation({
          sharkId: playerId,
          swimmerId,
        })
      } catch (error) {
        console.error("Failed to record player eaten:", error)
      }
    },
    [playerId, isHost, playerEatenMutation]
  )

  // Get current player data
  const currentPlayer = gameDetails?.players.find((p) => p._id === playerId)

  // Get other players (for rendering)
  const otherPlayers = gameDetails?.players.filter((p) => p._id !== playerId && p.status === "alive") || []

  // Check if game ended
  useEffect(() => {
    if (gameDetails?.game.status === "finished" || gameDetails?.game.status === "abandoned") {
      onGameEnd?.()
    }
  }, [gameDetails?.game.status, onGameEnd])

  return {
    playerId,
    isHost,
    gameDetails,
    sharkState,
    alivePlayers,
    currentPlayer,
    otherPlayers,
    joinAsSwimmer,
    joinAsShark,
    leaveGame,
    updatePlayerPosition,
    updateSharkState,
    useAbility,
    updateStats,
    handlePlayerEaten,
  }
}
