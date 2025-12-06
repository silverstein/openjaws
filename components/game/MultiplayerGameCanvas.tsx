"use client"

import { Application, Container, Graphics, Text } from "pixi.js"
import { useEffect, useRef, useState } from "react"
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame"
import type { Id } from "@/convex/_generated/dataModel"
import { useRouter } from "next/navigation"
import { Player } from "@/lib/game/entities/Player"
import { Shark } from "@/lib/game/entities/Shark"
import { createWaterShader } from "@/lib/game/shaders/WaterShader"
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice"

const COLORS = {
  hotPink: 0xff6b6b,
  electricBlue: 0x4ecdc4,
  warningOrange: 0xffa07a,
  sand: 0xf4e6d9,
  darkWater: 0x2a7f7e,
  lightWater: 0x5bcdcd,
}

interface MultiplayerGameCanvasProps {
  gameId: Id<"games">
  userId: string
  playerName: string
}

export function MultiplayerGameCanvas({ gameId, userId, playerName }: MultiplayerGameCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const localPlayerRef = useRef<Player | null>(null)
  const otherPlayerGraphicsRef = useRef<Map<string, Graphics>>(new Map())
  const sharkRef = useRef<Shark | null>(null)
  const router = useRouter()

  const [joined, setJoined] = useState(false)
  const isTouchDevice = useIsTouchDevice()

  const {
    playerId,
    isHost,
    gameDetails,
    sharkState,
    otherPlayers,
    joinAsSwimmer,
    updatePlayerPosition,
    updateSharkState,
    leaveGame,
  } = useMultiplayerGame({
    gameId,
    userId,
    playerName,
    onGameEnd: () => {
      router.push("/lobby")
    },
  })

  // Auto-join game on mount
  useEffect(() => {
    if (!joined && !playerId) {
      joinAsSwimmer("influencer").then(() => {
        setJoined(true)
      }).catch((err) => {
        console.error("Failed to join game:", err)
        router.push("/lobby")
      })
    }
  }, [joined, playerId, joinAsSwimmer, router])

  // Initialize Pixi.js
  useEffect(() => {
    if (!canvasRef.current || !playerId) return

    const initPixi = async () => {
      const app = new Application()
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: COLORS.sand,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      canvasRef.current?.appendChild(app.canvas)
      appRef.current = app

      // Create containers
      const waterContainer = new Container()
      const gameContainer = new Container()

      app.stage.addChild(waterContainer)
      app.stage.addChild(gameContainer)

      // Add water graphics
      const waterGraphics = new Graphics()
      waterGraphics.rect(0, window.innerHeight / 2, window.innerWidth, window.innerHeight / 2)
      waterGraphics.fill(COLORS.darkWater)
      waterContainer.addChild(waterGraphics)

      // Add water shader
      const waterShader = createWaterShader()
      if (waterShader) {
        waterGraphics.filters = [waterShader]
      }

      // Create local player
      const player = new Player(
        window.innerWidth / 2,
        window.innerHeight / 2,
        "influencer"
      )
      gameContainer.addChild(player.container)
      localPlayerRef.current = player

      // Create shark - ensure minimum spawn distance from player
      const MIN_SHARK_SPAWN_DISTANCE = 350
      const playerSpawnX = window.innerWidth / 2
      const playerSpawnY = window.innerHeight / 2
      const waterLineY = window.innerHeight / 2

      // Spawn shark in water area, far from player
      const sharkSpawnX = Math.min(window.innerWidth - 50, playerSpawnX + MIN_SHARK_SPAWN_DISTANCE * 0.8)
      const sharkSpawnY = Math.min(window.innerHeight - 50, Math.max(waterLineY + 100, playerSpawnY + MIN_SHARK_SPAWN_DISTANCE * 0.6))

      const shark = new Shark(sharkSpawnX, sharkSpawnY)
      gameContainer.addChild(shark.container)
      sharkRef.current = shark

      // Game loop
      let lastTime = Date.now()
      app.ticker.add(() => {
        const now = Date.now()
        const delta = (now - lastTime) / 1000
        lastTime = now

        // Update local player
        if (localPlayerRef.current) {
          // Check if player is in water (below half screen height)
          const inWater = localPlayerRef.current.y > window.innerHeight / 2

          // Calculate normalized input from velocity
          const inputX = localPlayerRef.current.vx / 200
          const inputY = localPlayerRef.current.vy / 200

          localPlayerRef.current.update(delta, inputX, inputY, inWater)

          // Send position to server
          updatePlayerPosition(
            {
              x: localPlayerRef.current.x,
              y: localPlayerRef.current.y,
              z: 0,
            },
            {
              x: localPlayerRef.current.vx,
              y: localPlayerRef.current.vy,
              z: 0,
            }
          )
        }

        // Update shark if host
        if (isHost && sharkRef.current) {
          sharkRef.current.update(delta, localPlayerRef.current || null)

          // Send shark state to server
          updateSharkState(
            {
              x: sharkRef.current.x,
              y: sharkRef.current.y,
              z: 0,
            },
            {
              x: sharkRef.current.vx,
              y: sharkRef.current.vy,
              z: 0,
            },
            "hunting" // Shark state - we'd need a getter in Shark class for actual state
          )
        }

        // Update water shader
        if (waterShader) {
          waterShader.time = now / 1000
        }
      })
    }

    initPixi()

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [playerId, isHost, updatePlayerPosition, updateSharkState])

  // Sync other players from Convex
  useEffect(() => {
    if (!appRef.current || !otherPlayers) return

    const gameContainer = appRef.current.stage.children[1] as Container

    // Remove players who left
    for (const [id, graphics] of otherPlayerGraphicsRef.current.entries()) {
      if (!otherPlayers.find(p => p._id === id)) {
        gameContainer.removeChild(graphics)
        otherPlayerGraphicsRef.current.delete(id)
      }
    }

    // Add/update other players
    for (const player of otherPlayers) {
      let graphics = otherPlayerGraphicsRef.current.get(player._id)

      if (!graphics) {
        graphics = new Graphics()
        graphics.circle(0, 0, 15)
        graphics.fill(player.role === "shark" ? 0xff0000 : COLORS.electricBlue)
        gameContainer.addChild(graphics)
        otherPlayerGraphicsRef.current.set(player._id, graphics)

        // Add name label
        const nameText = new Text({
          text: player.name,
          style: {
            fontSize: 12,
            fill: 0xffffff,
            stroke: { color: 0x000000, width: 2 },
          },
        })
        nameText.anchor.set(0.5)
        nameText.y = -25
        graphics.addChild(nameText)
      }

      // Update position
      graphics.x = player.position.x
      graphics.y = player.position.y
    }
  }, [otherPlayers])

  // Sync shark state from Convex (for non-host clients)
  useEffect(() => {
    if (!sharkRef.current || isHost || !sharkState) return

    sharkRef.current.x = sharkState.position.x
    sharkRef.current.y = sharkState.position.y
    sharkRef.current.vx = sharkState.velocity.x
    sharkRef.current.vy = sharkState.velocity.y
  }, [sharkState, isHost])

  // Handle keyboard input
  useEffect(() => {
    const keys = new Set<string>()

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase())

      if (e.key === "Escape") {
        leaveGame()
        router.push("/lobby")
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase())
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    // Movement loop
    const interval = setInterval(() => {
      if (!localPlayerRef.current) return

      const speed = 200
      let dx = 0
      let dy = 0

      if (keys.has("w") || keys.has("arrowup")) dy -= 1
      if (keys.has("s") || keys.has("arrowdown")) dy += 1
      if (keys.has("a") || keys.has("arrowleft")) dx -= 1
      if (keys.has("d") || keys.has("arrowright")) dx += 1

      if (dx !== 0 || dy !== 0) {
        const magnitude = Math.sqrt(dx * dx + dy * dy)
        dx /= magnitude
        dy /= magnitude

        localPlayerRef.current.vx = dx * speed
        localPlayerRef.current.vy = dy * speed
      } else {
        localPlayerRef.current.vx = 0
        localPlayerRef.current.vy = 0
      }
    }, 16)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      clearInterval(interval)
    }
  }, [leaveGame, router])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!appRef.current) return
      appRef.current.renderer.resize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (!joined || !playerId) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 to-blue-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white text-xl">Joining game...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen">
      <div ref={canvasRef} className="w-full h-full" />

      {/* HUD */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
        <h2 className="font-bold text-lg mb-2">
          {gameDetails?.game.beachName || "Beach Panic"}
        </h2>
        <div className="text-sm space-y-1">
          <p>Players: {gameDetails?.game.currentPlayers}/{gameDetails?.game.maxPlayers}</p>
          <p>Your name: {playerName}</p>
          {isHost && <p className="text-yellow-400">🎮 You control the shark!</p>}
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white max-w-xs">
        <div className="text-sm">
          <p className="font-bold mb-2">Online Players ({otherPlayers.length + 1})</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            <p>• {playerName} (You)</p>
            {otherPlayers.map((player) => (
              <p key={player._id}>
                • {player.name} {player.role === "shark" ? "🦈" : "🏊"}
              </p>
            ))}
          </div>
        </div>
      </div>

      {isTouchDevice ? (
        <button
          type="button"
          onClick={() => router.push("/lobby")}
          className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-transform z-20"
          style={{ paddingTop: "max(8px, env(safe-area-inset-top))" }}
        >
          ← Exit
        </button>
      ) : (
        <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 backdrop-blur-sm rounded-lg p-2">
          Press ESC to leave game
        </div>
      )}
    </div>
  )
}
