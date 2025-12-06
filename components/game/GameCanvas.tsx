"use client"

import { Application, Container, Graphics, Text } from "pixi.js"
import { useEffect, useRef, useState } from "react"
import { NPCDialogue } from "@/components/ai/NPCDialogue"
import { PersonalizedTaunts, TAUNT_TEMPLATES } from "@/components/ai/PersonalizedTaunts"
import { SharkCommentary } from "@/components/ai/SharkCommentary"
import { VolumeControl } from "@/components/ui/VolumeControl"
import { useGameAudio } from "@/hooks/useGameAudio"
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice"
import { useSharkMemory } from "@/hooks/useSharkMemory"
import { assetLoader } from "@/lib/game/AssetLoader"
import type { SharkAIController } from "@/lib/game/ai/SharkAIController"
import { AchievementTrigger, PsychologicalEffects } from "@/lib/game/effects/PsychologicalEffects"
import { Harpoon } from "@/lib/game/entities/Harpoon"
import { createHarpoonStations, HarpoonStation } from "@/lib/game/entities/HarpoonStation"
import { createIceCreamStand, IceCreamStand } from "@/lib/game/entities/IceCreamStand"
import { BaitZone } from "@/lib/game/entities/BaitZone"
import { FISH_CATALOG, type FishType } from "@/lib/game/entities/Fish"
import { createFishMarket, FishMarket } from "@/lib/game/entities/FishMarket"
import { createDock, Dock } from "@/lib/game/entities/Dock"
import { createBoat, Boat } from "@/lib/game/entities/Boat"
import { createBeachHouse, BeachHouse } from "@/lib/game/entities/BeachHouse"
import { createSecretRoom, SecretRoom } from "@/lib/game/entities/SecretRoom"
import { createOrangeBuff, OrangeBuff } from "@/lib/game/effects/OrangeBuff"
import { createDeepWaterZone, DeepWaterZone } from "@/lib/game/systems/DeepWaterZone"
import { BeachItemSpawner } from "@/lib/game/systems/BeachItemSpawner"
import type { BeachItem } from "@/lib/game/entities/BeachItem"
import { ThrownItem } from "@/lib/game/entities/ThrownItem"
import { createBeachNPCs, NPC, repositionNPCs } from "@/lib/game/entities/NPC"
import { Player } from "@/lib/game/entities/Player"
import { Shark } from "@/lib/game/entities/Shark"
import { ChromaticAberrationFilter } from "@/lib/game/filters/ChromaticAberration"
import { createWaterShader, WaterShader } from "@/lib/game/shaders/WaterShader"
import { ObjectiveSystem } from "@/lib/game/systems/ObjectiveSystem"
import { SharkHealthBar } from "@/lib/game/systems/SharkHealthBar"
import { AIDecisionDisplay } from "./AIDecisionDisplay"
import { RecognitionMoment } from "./RecognitionMoment"
import { TouchControls } from "./TouchControls"
import { SharkHealthBar as SharkHealthBarUI } from "./SharkHealthBar"
import { VictoryScreen } from "./VictoryScreen"
import { TouchActionButtons } from "./TouchActionButtons"
import Minimap from "./Minimap"
import { DeepWaterIndicator } from "@/lib/game/entities/DeepWaterIndicator"

// Game color palette from docs
const COLORS = {
  hotPink: 0xff6b6b,
  electricBlue: 0x4ecdc4,
  warningOrange: 0xffa07a,
  sand: 0xf4e6d9,
  darkWater: 0x2a7f7e,
  lightWater: 0x5bcdcd,
}

// Local type for AI context
interface GameContext {
  currentPlayers: Array<{
    id: string
    name: string
    position: { x: number; y: number }
    health: number
    speed: number
    isInWater: boolean
  }>
  sharkPosition: { x: number; y: number }
  sharkHealth: number
  sharkPersonality: string
  timeOfDay: string
  weatherCondition: string
  recentEvents: string[]
  memories: any[]
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const playerRef = useRef<Player | null>(null)
  const sharkRef = useRef<Shark | null>(null)
  const aiControllerRef = useRef<SharkAIController | null>(null)
  const objectiveSystemRef = useRef<ObjectiveSystem | null>(null)
  const waterShaderRef = useRef<WaterShader | null>(null)
  const npcsRef = useRef<NPC[]>([])
  const sharkHealthBarRef = useRef<SharkHealthBar | null>(null)
  const harpoonStationsRef = useRef<HarpoonStation[]>([])
  const harpoonsRef = useRef<Harpoon[]>([])
  const entityLayerRef = useRef<Container | null>(null)
  const iceCreamStandRef = useRef<IceCreamStand | null>(null)
  const fishMarketRef = useRef<FishMarket | null>(null)
  const baitZonesRef = useRef<BaitZone[]>([])
  const dockRef = useRef<Dock | null>(null)
  const boatRef = useRef<Boat | null>(null)
  const beachHouseRef = useRef<BeachHouse | null>(null)
  const secretRoomRef = useRef<SecretRoom | null>(null)
  const orangeBuffRef = useRef<OrangeBuff | null>(null)
  const orangeBuffWasActiveRef = useRef<boolean>(false)
  const deepWaterZoneRef = useRef<DeepWaterZone | null>(null)
  const beachItemSpawnerRef = useRef<BeachItemSpawner | null>(null)
  const heldBeachItemRef = useRef<BeachItem | null>(null)
  const thrownItemsRef = useRef<ThrownItem[]>([])
  const deepWaterIndicatorRef = useRef<DeepWaterIndicator | null>(null)
  const aiAbortControllerRef = useRef<AbortController | null>(null)

  // Player economy state
  const [playerPoints, setPlayerPoints] = useState(100) // Start with some points
  const [playerFishInventory, setPlayerFishInventory] = useState<FishType[]>([])
  const [orangeBuffActive, setOrangeBuffActive] = useState(false)
  const [orangeBuffTimeLeft, setOrangeBuffTimeLeft] = useState(0)
  const playerPointsRef = useRef(playerPoints)
  const playerFishInventoryRef = useRef(playerFishInventory)

  // Track 10 UI state
  const [sharkHP, setSharkHP] = useState({ current: 150, max: 150 })
  const [lastSharkDamage, setLastSharkDamage] = useState<number | undefined>()
  const [victoryScreenVisible, setVictoryScreenVisible] = useState(false)
  const [playerStats, setPlayerStats] = useState({ damageDealt: 0, selfiesTaken: 0, deaths: 0 })
  const [minimapVisible, setMinimapVisible] = useState(true)
  const [canPickupItem, setCanPickupItem] = useState(false)
  const playerStatsRef = useRef(playerStats)
  playerStatsRef.current = playerStats

  // Keep refs in sync with state (for use inside closures)
  playerPointsRef.current = playerPoints
  playerFishInventoryRef.current = playerFishInventory

  // Asset loading state
  const [assetsLoaded, setAssetsLoaded] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Touch device detection
  const isTouchDevice = useIsTouchDevice()

  // Touch controls state
  const touchMovement = useRef({ dx: 0, dy: 0 })

  // Audio system
  const { playSound, stopSound, autoplayBlocked } = useGameAudio()
  const audioRefs = useRef({
    oceanAmbience: null as string | null,
    sharkTension: null as string | null,
  })

  // NPC dialogue state
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null)
  const [nearbyNPC, setNearbyNPC] = useState<NPC | null>(null)
  const [npcEvent, setNpcEvent] = useState<"shark_nearby" | "player_hurt" | "calm" | "storm" | "shark_attack">("calm")
  const [aiThoughts, setAIThoughts] = useState<string>("")
  const [sharkAIState, setSharkAIState] = useState({
    personality: "theatrical" as const,
    hunger: 50,
    rage: 0,
    currentTarget: null as string | null,
  })
  const [patternRecognized, setPatternRecognized] = useState<
    { type: string; confidence: number } | undefined
  >()
  const { checkPattern, getMemoryForPlayer } = useSharkMemory()

  // Psychological warfare state
  const [isSharkThinking, setIsSharkThinking] = useState(false)
  const [sharkCommentary, setSharkCommentary] = useState<string>("")
  const [currentTaunt, setCurrentTaunt] = useState<any>()
  const [recognitionMoment, setRecognitionMoment] = useState<{
    active: boolean
    playerName: string
    memories: any[]
    level: "first" | "familiar" | "nemesis"
  }>({
    active: false,
    playerName: "",
    memories: [],
    level: "first",
  })
  const [playerRecognition, setPlayerRecognition] = useState<
    | {
        level: "familiar" | "known" | "nemesis"
        encounters: number
      }
    | undefined
  >()

  const psychEffectsRef = useRef<PsychologicalEffects | null>(null)
  const achievementRef = useRef<AchievementTrigger>(new AchievementTrigger())
  const lastRecognitionRef = useRef<number>(0)
  const predictionCountRef = useRef<number>(0)
  const lastAIDecisionRef = useRef<number>(0)
  const [isAIThinking, setIsAIThinking] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) {
      return
    }

    // Initialize Pixi Application
    const app = new Application()
    appRef.current = app

    const initGame = async () => {
      // Load game assets first
      await assetLoader.loadAssets((progress) => {
        setLoadingProgress(Math.round(progress * 100))
      })
      setAssetsLoaded(true)

      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: COLORS.electricBlue,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      if (!canvasRef.current) {
        return
      }
      canvasRef.current.appendChild(app.canvas)

      // Create game layers
      const backgroundLayer = new Container()
      const entityLayer = new Container()
      const uiLayer = new Container()
      entityLayerRef.current = entityLayer

      app.stage.addChild(backgroundLayer)
      app.stage.addChild(entityLayer)
      app.stage.addChild(uiLayer)

      // Create beach background
      const beach = new Graphics()
      beach.rect(0, 0, app.screen.width, app.screen.height * 0.3)
      beach.fill(COLORS.sand)
      backgroundLayer.addChild(beach)

      // Create water with gradient
      const water = new Graphics()
      const waterY = app.screen.height * 0.3

      // Create gradient effect for water depth
      for (let i = 0; i < 20; i++) {
        const alpha = 0.8 + (i / 20) * 0.2
        const color = i < 10 ? COLORS.lightWater : COLORS.darkWater
        water.rect(
          0,
          waterY + (i * (app.screen.height * 0.7)) / 20,
          app.screen.width,
          (app.screen.height * 0.7) / 20
        )
        water.fill({ color, alpha })
      }
      backgroundLayer.addChild(water)

      // Apply water shader effect (Pixi.js v8 compatible)
      const waterShader = createWaterShader()
      if (waterShader) {
        water.filters = [waterShader]
        waterShaderRef.current = waterShader
      }

      // Apply chromatic aberration to the whole stage for that retro feel
      try {
        const chromaFilter = new ChromaticAberrationFilter()
        app.stage.filters = [chromaFilter]
      } catch (error) {
        console.warn("Could not apply chromatic aberration filter:", error)
      }

      // Initialize psychological effects
      psychEffectsRef.current = new PsychologicalEffects(app)

      // Initialize objective system
      const objectiveSystem = new ObjectiveSystem()
      objectiveSystemRef.current = objectiveSystem
      uiLayer.addChild(objectiveSystem.getContainer())

      // Initialize shark health bar
      const sharkHealthBar = new SharkHealthBar()
      sharkHealthBarRef.current = sharkHealthBar
      uiLayer.addChild(sharkHealthBar.getContainer())

      // Create player with a mock userId for now
      const player = new Player(
        app.screen.width / 2,
        app.screen.height / 2,
        "influencer",
        "player_1"
      )
      playerRef.current = player
      entityLayer.addChild(player.container)

      // Create shark
      const shark = new Shark(app.screen.width * 0.8, app.screen.height * 0.6)
      sharkRef.current = shark
      entityLayer.addChild(shark.container)
      console.log("Shark created at:", shark.x, shark.y)

      // Set shark personality without AI controller for now
      shark.setPersonality("theatrical") // Start with theatrical personality

      // We'll use the AI SDK directly in the game loop instead of through the controller
      console.log("Shark initialized with theatrical personality")

      // Create beach NPCs
      const npcs = createBeachNPCs(app.screen.width, app.screen.height)
      npcsRef.current = npcs
      npcs.forEach((npc) => {
        entityLayer.addChild(npc.container)
      })
      console.log(`Created ${npcs.length} beach NPCs`)

      // Create harpoon stations
      const harpoonStations = createHarpoonStations(app.screen.width, app.screen.height)
      harpoonStationsRef.current = harpoonStations
      harpoonStations.forEach((station) => {
        entityLayer.addChild(station.container)
      })
      console.log(`Created ${harpoonStations.length} harpoon stations`)

      // Create ice cream stand (healing station)
      const iceCreamStand = createIceCreamStand(app.screen.width, app.screen.height)
      iceCreamStandRef.current = iceCreamStand
      entityLayer.addChild(iceCreamStand.container)
      console.log("Created ice cream stand")

      // Create fish market (shop for bait)
      const fishMarket = createFishMarket(app.screen.width, app.screen.height)
      fishMarketRef.current = fishMarket
      entityLayer.addChild(fishMarket.container)
      console.log("Created fish market")

      // Create dock (extends into water - safe walking zone)
      const dock = createDock(app.screen.width, app.screen.height)
      dockRef.current = dock
      entityLayer.addChild(dock.container)
      console.log("Created dock")

      // Create boat at end of dock (safe zone in water)
      const dockEnd = dock.getEndPosition()
      const boat = createBoat(dockEnd.x, dockEnd.y)
      boatRef.current = boat
      entityLayer.addChild(boat.container)
      console.log("Created boat at dock end")

      // Create beach house (rest and storage)
      const beachHouse = createBeachHouse(app.screen.width, app.screen.height)
      beachHouseRef.current = beachHouse
      entityLayer.addChild(beachHouse.container)
      console.log("Created beach house")

      // Create secret room (unlocks after 5 shark hits)
      const secretRoom = createSecretRoom(app.screen.width, app.screen.height)
      secretRoomRef.current = secretRoom
      entityLayer.addChild(secretRoom.container)
      console.log("Created secret room")

      // Create orange buff manager
      const orangeBuff = createOrangeBuff()
      orangeBuffRef.current = orangeBuff

      // Create deep water zone with treasures
      const deepWaterZone = createDeepWaterZone(app.screen.width, app.screen.height)
      deepWaterZoneRef.current = deepWaterZone
      deepWaterZone.spawnTreasures()
      console.log("Created deep water zone")

      // Create deep water visual indicator (behind other entities)
      const waterLineY = app.screen.height * 0.3
      const deepWaterIndicator = new DeepWaterIndicator(app.screen.width, app.screen.height, waterLineY)
      deepWaterIndicatorRef.current = deepWaterIndicator
      backgroundLayer.addChild(deepWaterIndicator.container) // Add to background so it's behind entities
      console.log("Created deep water indicator")

      // Create beach item spawner
      const beachItemSpawner = new BeachItemSpawner(app.screen.width, app.screen.height)
      beachItemSpawnerRef.current = beachItemSpawner
      beachItemSpawner.spawnInitialItems()
      // Add beach items to entity layer
      for (const item of beachItemSpawner.getItems()) {
        entityLayer.addChild(item.container)
      }
      console.log("Created beach item spawner")

      // Start ocean ambience (if audio is initialized)
      if (!autoplayBlocked) {
        const oceanId = playSound("ocean_ambience", { loop: true, volume: 0.4, fadeIn: 2 })
        if (oceanId) {
          audioRefs.current.oceanAmbience = oceanId
        }
      }

      // Handle keyboard input
      const keys: { [key: string]: boolean } = {}

      const handleKeyDown = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase()
        keys[key] = true

        // Activate ability on space
        if (e.key === " " && player) {
          e.preventDefault() // Prevent page scroll
          player.activateAbility()
          playSound("ability_activate", { volume: 0.6 })
        }

        // Fire harpoon or take selfie on F
        if (e.key === "f" && player && shark) {
          e.preventDefault()

          // First check if near a harpoon station
          let firedHarpoon = false
          for (const station of harpoonStationsRef.current) {
            if (station.canFire()) {
              const result = station.fire()
              if (result) {
                // Create and launch harpoon toward shark
                const harpoon = new Harpoon(
                  result.startX,
                  result.startY,
                  shark.x,
                  shark.y,
                  result.damage
                )
                harpoonsRef.current.push(harpoon)
                entityLayer.addChild(harpoon.container)
                playSound("item_throw", { volume: 0.7 })
                console.log("Harpoon fired!")
                firedHarpoon = true
                break
              }
            }
          }

          // If no harpoon fired, try selfie
          if (!firedHarpoon && objectiveSystem) {
            console.log("Attempting selfie...")

            const success = objectiveSystem.attemptSelfie(player.x, player.y, shark.x, shark.y)

            if (success) {
              console.log("Selfie successful!")
              playSound("selfie_camera", { volume: 0.7 })
              // Track selfie for stats
              setPlayerStats(prev => ({ ...prev, selfiesTaken: prev.selfiesTaken + 1 }))
              // Make shark angry after selfie
              if (shark) {
                shark.setRage(shark.getRage() + 50)
              }
            } else {
              // Show "too far" message
              const tooFarText = new Text({
                text: "📸 Too far from shark!",
                style: {
                  fontSize: 20,
                  fill: 0xff0000,
                  fontWeight: "bold",
                },
              })
              tooFarText.x = player.x - 80
              tooFarText.y = player.y - 50
              app.stage.addChild(tooFarText)

              setTimeout(() => {
                app.stage.removeChild(tooFarText)
              }, 1000)
            }
          }
        }

        // Return to lobby on ESC
        if (e.key === "Escape") {
          window.location.href = "/lobby"
        }

        // Interact with ice cream stand, fish market, secret room, or NPC on E
        if (e.key === "e" && player) {
          e.preventDefault()
          const playerId = player.userId || "player_1"

          // First check secret room for orange power-up
          if (secretRoomRef.current && secretRoomRef.current.canTakeOrange(playerId)) {
            const taken = secretRoomRef.current.takeOrange(playerId)
            if (taken && orangeBuffRef.current) {
              orangeBuffRef.current.activate(playerId)
              playSound("orange_buff_activate", { volume: 0.7 })
              console.log("Orange buff activated! 2x swim speed!")

              // Visual feedback
              const orangeText = new Text({
                text: "🍊 VITAMIN C BOOST!\n2x Swim Speed!",
                style: {
                  fontSize: 20,
                  fill: 0xff8c00,
                  fontWeight: "bold",
                  align: "center",
                  dropShadow: {
                    distance: 2,
                    color: 0x000000,
                    alpha: 0.7
                  }
                }
              })
              orangeText.anchor.set(0.5)
              orangeText.x = player.x
              orangeText.y = player.y - 50
              app.stage.addChild(orangeText)

              let orangeAlpha = 1
              const orangeFade = setInterval(() => {
                orangeAlpha -= 0.02
                orangeText.alpha = orangeAlpha
                orangeText.y -= 1
                if (orangeAlpha <= 0) {
                  app.stage.removeChild(orangeText)
                  clearInterval(orangeFade)
                }
              }, 30)
              return
            }
          }

          // Then check ice cream stand for healing
          if (iceCreamStandRef.current && iceCreamStandRef.current.canHeal(playerId)) {
            const result = iceCreamStandRef.current.heal(playerId)
            if (result.healed) {
              // Heal the player
              player.health = Math.min(100, player.health + result.amount)
              playSound("ability_activate", { volume: 0.6 })
              console.log(`Healed for ${result.amount} HP!`)

              // Visual feedback
              const healText = new Text({
                text: `+${result.amount} HP`,
                style: {
                  fontSize: 24,
                  fill: 0x44ff44,
                  fontWeight: "bold",
                  dropShadow: {
                    distance: 2,
                    color: 0x000000,
                    alpha: 0.7
                  }
                }
              })
              healText.anchor.set(0.5)
              healText.x = player.x
              healText.y = player.y - 40
              app.stage.addChild(healText)

              // Animate and remove
              let healAlpha = 1
              const healFade = setInterval(() => {
                healAlpha -= 0.03
                healText.alpha = healAlpha
                healText.y -= 1
                if (healAlpha <= 0) {
                  app.stage.removeChild(healText)
                  clearInterval(healFade)
                }
              }, 30)
              return // Don't also trigger other interactions
            }
          }

          // Then check fish market for shopping
          if (fishMarketRef.current && fishMarketRef.current.canShop()) {
            const fishType = fishMarketRef.current.purchaseFish(playerPointsRef.current)
            const price = fishMarketRef.current.getCurrentPrice()

            if (fishType) {
              // Successful purchase
              setPlayerPoints(prev => prev - price)
              setPlayerFishInventory(prev => [...prev, fishType])
              playSound("item_pickup", { volume: 0.6 })
              console.log(`Bought ${fishType} for ${price} points!`)

              // Visual feedback
              const purchaseText = new Text({
                text: `🐟 Bought ${fishType}!\n-${price} points`,
                style: {
                  fontSize: 18,
                  fill: 0xffd700,
                  fontWeight: "bold",
                  align: "center",
                  dropShadow: {
                    distance: 2,
                    color: 0x000000,
                    alpha: 0.7
                  }
                }
              })
              purchaseText.anchor.set(0.5)
              purchaseText.x = fishMarketRef.current.x
              purchaseText.y = fishMarketRef.current.y - 100
              app.stage.addChild(purchaseText)

              // Animate and remove
              let purchaseAlpha = 1
              const purchaseFade = setInterval(() => {
                purchaseAlpha -= 0.02
                purchaseText.alpha = purchaseAlpha
                purchaseText.y -= 1
                if (purchaseAlpha <= 0) {
                  app.stage.removeChild(purchaseText)
                  clearInterval(purchaseFade)
                }
              }, 30)
              return
            } else {
              // Not enough points
              const failText = new Text({
                text: `💰 Need ${price} points!\nYou have: ${playerPointsRef.current}`,
                style: {
                  fontSize: 16,
                  fill: 0xff4444,
                  fontWeight: "bold",
                  align: "center",
                  dropShadow: {
                    distance: 1,
                    color: 0x000000,
                    alpha: 0.7
                  }
                }
              })
              failText.anchor.set(0.5)
              failText.x = fishMarketRef.current.x
              failText.y = fishMarketRef.current.y - 100
              app.stage.addChild(failText)

              setTimeout(() => {
                app.stage.removeChild(failText)
              }, 1500)
              return
            }
          }

          // Then check for NPC interaction
          if (npcsRef.current) {
            const foundNPC = npcsRef.current.find((npc) =>
              npc.isPlayerNearby(player.x, player.y)
            )
            if (foundNPC) {
              console.log(`Interacting with ${foundNPC.npcName}`)
              playSound("npc_chime", { volume: 0.5 })
              setActiveNPC(foundNPC)
              foundNPC.setInteracting(true)
            }
          }
        }

        // Navigate fish market selection with Q/R keys (prev/next)
        if (e.key === "q" && fishMarketRef.current && fishMarketRef.current.canShop()) {
          fishMarketRef.current.selectPreviousFish()
        }
        if (e.key === "r" && fishMarketRef.current && fishMarketRef.current.canShop()) {
          fishMarketRef.current.selectNextFish()
        }

        // Throw fish bait with T key (must be in water and have fish)
        if (e.key === "t" && player && entityLayer) {
          e.preventDefault()
          const isInWater = player.y > app.screen.height * 0.3

          if (!isInWater) {
            // Can only throw bait in water
            const waterText = new Text({
              text: "🚫 Go into water to throw bait!",
              style: {
                fontSize: 16,
                fill: 0xff6666,
                fontWeight: "bold"
              }
            })
            waterText.anchor.set(0.5)
            waterText.x = player.x
            waterText.y = player.y - 40
            app.stage.addChild(waterText)
            setTimeout(() => app.stage.removeChild(waterText), 1500)
            return
          }

          // Check if player has fish
          if (playerFishInventoryRef.current.length === 0) {
            const noFishText = new Text({
              text: "🐟 No fish! Buy at market",
              style: {
                fontSize: 16,
                fill: 0xffaa00,
                fontWeight: "bold"
              }
            })
            noFishText.anchor.set(0.5)
            noFishText.x = player.x
            noFishText.y = player.y - 40
            app.stage.addChild(noFishText)
            setTimeout(() => app.stage.removeChild(noFishText), 1500)
            return
          }

          // Use the first fish in inventory
          const fishToThrow = playerFishInventoryRef.current[0]
          if (!fishToThrow) return

          setPlayerFishInventory(prev => prev.slice(1)) // Remove first fish

          // Get fish data from catalog
          const fishData = FISH_CATALOG[fishToThrow]
          if (!fishData) return

          // Create bait zone at player position (slightly ahead)
          const throwDistance = 50
          const throwX = player.x + (shark ? Math.sign(shark.x - player.x) * throwDistance : throwDistance)
          const throwY = player.y

          const baitZone = new BaitZone(throwX, throwY, fishData)
          baitZonesRef.current.push(baitZone)
          entityLayer.addChild(baitZone.container)

          playSound("item_throw", { volume: 0.5 })
          console.log(`Threw ${fishToThrow} bait at (${throwX}, ${throwY})`)

          // Visual feedback
          const throwText = new Text({
            text: `🎣 ${fishData.name} thrown!`,
            style: {
              fontSize: 18,
              fill: 0x4ecdc4,
              fontWeight: "bold",
              dropShadow: {
                distance: 1,
                color: 0x000000,
                alpha: 0.7
              }
            }
          })
          throwText.anchor.set(0.5)
          throwText.x = throwX
          throwText.y = throwY - 40
          app.stage.addChild(throwText)

          let throwAlpha = 1
          const throwFade = setInterval(() => {
            throwAlpha -= 0.03
            throwText.alpha = throwAlpha
            throwText.y -= 1
            if (throwAlpha <= 0) {
              app.stage.removeChild(throwText)
              clearInterval(throwFade)
            }
          }, 30)
        }

        // Board/exit boat with B key, or sleep in beach house
        if (e.key === "b" && player) {
          e.preventDefault()
          const playerId = player.userId || "player_1"

          // First check if in beach house - B key sleeps
          if (beachHouseRef.current && beachHouseRef.current.isPlayerInside(playerId)) {
            if (!beachHouseRef.current.isSleeping(playerId)) {
              beachHouseRef.current.useBed(playerId).then((result) => {
                if (result.success) {
                  // Apply recovery to player
                  player.health = 100
                  player.stamina = 100
                  playSound("ability_activate", { volume: 0.7 })
                  console.log("Fully recovered from sleep!")
                }
              })
            }
            return
          }

          // Check if already in boat - exit
          if (boatRef.current && boatRef.current.isPlayerInBoat(playerId)) {
            boatRef.current.eject(playerId)
            playSound("ability_activate", { volume: 0.5 })
            console.log("Exited boat")
            return
          }

          // Check if near boat - board
          if (boatRef.current && boatRef.current.isInBoardingRange(player.x, player.y)) {
            const success = boatRef.current.board(playerId)
            if (success) {
              playSound("ability_activate", { volume: 0.6 })
              console.log("Boarded boat!")
            } else {
              // Boat is full
              const fullText = new Text({
                text: "🚣 Boat is full!",
                style: {
                  fontSize: 16,
                  fill: 0xff6666,
                  fontWeight: "bold"
                }
              })
              fullText.anchor.set(0.5)
              fullText.x = player.x
              fullText.y = player.y - 40
              app.stage.addChild(fullText)
              setTimeout(() => app.stage.removeChild(fullText), 1500)
            }
          }
        }

        // Enter/exit beach house with X key (E is already overloaded)
        if (e.key === "x" && player) {
          e.preventDefault()
          const playerId = player.userId || "player_1"

          // If in beach house, exit
          if (beachHouseRef.current && beachHouseRef.current.isPlayerInside(playerId)) {
            beachHouseRef.current.exit(playerId)
            playSound("ability_activate", { volume: 0.5 })
            console.log("Exited beach house")
            return
          }

          // If near beach house door, enter
          if (beachHouseRef.current && beachHouseRef.current.canEnter(playerId)) {
            beachHouseRef.current.enter(playerId)
            playSound("ability_activate", { volume: 0.6 })
            console.log("Entered beach house!")
          }
        }

        // Pick up beach items with G key
        if (e.key === "g" && player && beachItemSpawnerRef.current && entityLayerRef.current) {
          e.preventDefault()

          // Check if already holding an item
          if (heldBeachItemRef.current) {
            // Drop currently held item
            const heldText = new Text({
              text: "🏖️ Already holding item! Press C to throw",
              style: {
                fontSize: 14,
                fill: 0xffaa00,
                fontWeight: "bold"
              }
            })
            heldText.anchor.set(0.5)
            heldText.x = player.x
            heldText.y = player.y - 40
            app.stage.addChild(heldText)
            setTimeout(() => app.stage.removeChild(heldText), 1500)
            return
          }

          // Try to pick up a nearby item
          const item = beachItemSpawnerRef.current.pickupItem(player.x, player.y)
          if (item) {
            heldBeachItemRef.current = item
            // Hide the item's container (player is now "holding" it)
            item.container.visible = false
            playSound("item_pickup", { volume: 0.5 })

            const pickupText = new Text({
              text: `🏖️ Picked up ${item.type}!`,
              style: {
                fontSize: 16,
                fill: 0x44ff44,
                fontWeight: "bold"
              }
            })
            pickupText.anchor.set(0.5)
            pickupText.x = player.x
            pickupText.y = player.y - 40
            app.stage.addChild(pickupText)
            setTimeout(() => app.stage.removeChild(pickupText), 1500)
          } else {
            // No item nearby
            const noItemText = new Text({
              text: "🏖️ No items nearby",
              style: {
                fontSize: 14,
                fill: 0x888888,
                fontWeight: "bold"
              }
            })
            noItemText.anchor.set(0.5)
            noItemText.x = player.x
            noItemText.y = player.y - 40
            app.stage.addChild(noItemText)
            setTimeout(() => app.stage.removeChild(noItemText), 1000)
          }
        }

        // Toggle minimap with M key
        if (e.key === "m") {
          setMinimapVisible(prev => !prev)
        }

        // Throw held beach item with C key (toward shark)
        if (e.key === "c" && player && shark && entityLayerRef.current && heldBeachItemRef.current) {
          e.preventDefault()

          const heldItem = heldBeachItemRef.current
          const itemType = heldItem.type
          const effect = heldItem.use(shark.x, shark.y)

          // Create thrown item projectile
          const thrownItem = new ThrownItem(
            player.x,
            player.y,
            shark.x,
            shark.y,
            itemType,
            effect
          )
          thrownItemsRef.current.push(thrownItem)
          entityLayerRef.current.addChild(thrownItem.container)

          // Clear held item
          beachItemSpawnerRef.current?.removeItem(heldItem)
          heldBeachItemRef.current = null

          playSound("item_throw", { volume: 0.6 })
          console.log(`Threw ${itemType} at shark!`)

          const throwText = new Text({
            text: `🎯 Threw ${itemType}!`,
            style: {
              fontSize: 18,
              fill: 0xff6b6b,
              fontWeight: "bold"
            }
          })
          throwText.anchor.set(0.5)
          throwText.x = player.x
          throwText.y = player.y - 40
          app.stage.addChild(throwText)
          setTimeout(() => app.stage.removeChild(throwText), 1000)
        }
      }

      const handleKeyUp = (e: KeyboardEvent) => {
        keys[e.key.toLowerCase()] = false
      }

      window.addEventListener("keydown", handleKeyDown)
      window.addEventListener("keyup", handleKeyUp)

      // Game loop
      app.ticker.add((ticker) => {
        const delta = ticker.deltaTime

        // Update water shader time for wave animation
        if (waterShaderRef.current) {
          waterShaderRef.current.time += 0.01
        }

        // Update objective system
        if (objectiveSystemRef.current) {
          objectiveSystemRef.current.updateTimer(delta)
        }

        // Update shark health bar (Pixi version for in-game display)
        if (sharkHealthBarRef.current && shark) {
          sharkHealthBarRef.current.setHealth(shark.getHealth())
          sharkHealthBarRef.current.update(delta)

          // Sync to React state for UI component
          const currentHP = shark.getHealth()
          const maxHP = shark.getMaxHealth ? shark.getMaxHealth() : 150
          setSharkHP({ current: currentHP, max: maxHP })

          // Check for win condition - shark defeated!
          if (shark.isDefeated() && !victoryScreenVisible) {
            playSound("victory_fanfare", { volume: 0.8 })
            setVictoryScreenVisible(true)
            // Stop the game loop
            app.ticker.stop()
          }
        }

        // Update harpoon stations
        if (player && harpoonStationsRef.current.length > 0) {
          for (const station of harpoonStationsRef.current) {
            station.update(delta, player.x, player.y)
          }
        }

        // Update ice cream stand
        if (player && iceCreamStandRef.current) {
          iceCreamStandRef.current.update(delta, player.x, player.y, player.userId || "player_1")
        }

        // Update fish market
        if (player && fishMarketRef.current) {
          fishMarketRef.current.update(delta, player.x, player.y)
        }

        // Update dock
        if (dockRef.current) {
          dockRef.current.update(delta)
        }

        // Update boat
        if (boatRef.current) {
          boatRef.current.update(delta)
        }

        // Update beach house
        if (player && beachHouseRef.current) {
          beachHouseRef.current.update(delta, player.x, player.y, player.userId || "player_1")
        }

        // Update secret room
        if (player && secretRoomRef.current) {
          secretRoomRef.current.update(delta, player.x, player.y, player.userId || "player_1")
        }

        // Update orange buff
        if (orangeBuffRef.current) {
          orangeBuffRef.current.update(delta)

          // Update UI state for orange buff
          const playerId = player?.userId || "player_1"
          const isActive = orangeBuffRef.current.isActive(playerId)
          const timeLeft = orangeBuffRef.current.getRemainingTime(playerId)

          // Detect when buff expires (was active, now inactive)
          if (orangeBuffWasActiveRef.current && !isActive) {
            playSound("orange_buff_expire", { volume: 0.6 })
          }
          orangeBuffWasActiveRef.current = isActive

          setOrangeBuffActive(isActive)
          setOrangeBuffTimeLeft(Math.ceil(timeLeft / 1000))
        }

        // Update deep water zone (handles treasure spawning)
        if (deepWaterZoneRef.current) {
          deepWaterZoneRef.current.update(delta)
        }

        // Update beach item spawner and check for nearby items
        if (beachItemSpawnerRef.current) {
          beachItemSpawnerRef.current.update(delta)

          // Check if player can pick up nearby items (for touch controls)
          if (player && !heldBeachItemRef.current) {
            const nearbyItem = beachItemSpawnerRef.current.getItems().find(item => {
              if (!item || item.isPickedUp) return false
              const dist = Math.sqrt((item.x - player.x) ** 2 + (item.y - player.y) ** 2)
              return dist < 60
            })
            setCanPickupItem(!!nearbyItem)
          } else {
            setCanPickupItem(false)
          }
        }

        // Update thrown items and check for collisions
        if (shark && thrownItemsRef.current.length > 0) {
          thrownItemsRef.current = thrownItemsRef.current.filter(item => {
            item.update(delta)

            // Check collision with shark
            if (item.isAlive() && item.checkCollision(shark.x, shark.y, 50)) {
              // Hit the shark!
              const effect = item.getEffect()

              // Apply damage based on effect type
              if (effect.type === "damage" && effect.value > 0) {
                shark.takeDamage(effect.value)
                // Track damage for stats
                setPlayerStats(prev => ({ ...prev, damageDealt: prev.damageDealt + effect.value }))
                setLastSharkDamage(effect.value)
                setTimeout(() => setLastSharkDamage(undefined), 1000)
              }
              if (effect.type === "stun" && effect.value > 0) {
                shark.stun(effect.value)
              }
              item.hit()

              // Visual feedback
              const damageText = effect.type === "damage" ? `-${effect.value}` : ""
              const stunText = effect.type === "stun" ? "STUNNED!" : ""
              const hitText = new Text({
                text: `🎯 HIT! ${damageText} ${stunText}`.trim(),
                style: {
                  fontSize: 20,
                  fill: 0xff6b6b,
                  fontWeight: "bold",
                  dropShadow: {
                    distance: 2,
                    color: 0x000000,
                    alpha: 0.7
                  }
                }
              })
              hitText.anchor.set(0.5)
              hitText.x = shark.x
              hitText.y = shark.y - 60
              app.stage.addChild(hitText)

              let hitAlpha = 1
              const hitFade = setInterval(() => {
                hitAlpha -= 0.03
                hitText.alpha = hitAlpha
                hitText.y -= 2
                if (hitAlpha <= 0) {
                  app.stage.removeChild(hitText)
                  clearInterval(hitFade)
                }
              }, 30)

              playSound("bite", { volume: 0.6 })
            }

            // Remove dead items - filter out and destroy
            if (!item.isAlive()) {
              item.destroy()
              return false
            }
            return true
          })
        }

        // Update bait zones and check for expired ones
        if (baitZonesRef.current.length > 0) {
          baitZonesRef.current = baitZonesRef.current.filter(zone => {
            zone.update(delta)

            // Remove expired zones - filter out and cleanup
            if (!zone.isActive()) {
              if (entityLayerRef.current) {
                entityLayerRef.current.removeChild(zone.container)
              }
              return false
            }
            return true
          })

          // Have shark check for bait
          if (shark && baitZonesRef.current.length > 0) {
            const activeBaits = baitZonesRef.current.map(zone => ({
              x: zone.x,
              y: zone.y,
              baitPower: zone.baitPower,
              isActive: () => zone.isActive(),
              getAttractionStrength: (sx: number, sy: number) => zone.getAttractionStrength(sx, sy),
              getAttractionVector: (sx: number, sy: number) => zone.getAttractionVector(sx, sy)
            }))
            shark.checkForBait(activeBaits)
          }
        }

        // Update harpoons and check for collisions
        if (shark && harpoonsRef.current.length > 0) {
          harpoonsRef.current = harpoonsRef.current.filter(harpoon => {
            harpoon.update(delta)

            // Check collision with shark
            if (harpoon.isAlive() && harpoon.checkCollision(shark.x, shark.y, 50)) {
              // Check if shark is eating (vulnerable for 2x damage)
              const isComboHit = shark.isVulnerable()
              const damageMultiplier = shark.getVulnerabilityMultiplier()
              const actualDamage = harpoon.damage * damageMultiplier

              // Hit the shark! (damage is applied with multiplier inside takeDamage)
              shark.takeDamage(harpoon.damage)
              harpoon.hit()

              // Track damage dealt for stats and UI
              setLastSharkDamage(actualDamage)
              setPlayerStats(prev => ({ ...prev, damageDealt: prev.damageDealt + actualDamage }))
              setTimeout(() => setLastSharkDamage(undefined), 1000)

              // Record hit for secret room unlock progress
              if (secretRoomRef.current && player) {
                secretRoomRef.current.recordSharkHit(player.userId || "player_1")
                const progress = secretRoomRef.current.getHitProgress(player.userId || "player_1")
                if (progress.current === progress.required) {
                  // Just unlocked!
                  playSound("secret_room_unlock", { volume: 0.8 })
                  const unlockText = new Text({
                    text: "🗝️ SECRET ROOM UNLOCKED!",
                    style: {
                      fontSize: 24,
                      fill: 0xffd700,
                      fontWeight: "bold",
                      dropShadow: {
                        distance: 3,
                        color: 0x000000,
                        alpha: 0.8
                      }
                    }
                  })
                  unlockText.anchor.set(0.5)
                  unlockText.x = app.screen.width / 2
                  unlockText.y = app.screen.height / 3
                  app.stage.addChild(unlockText)

                  let unlockAlpha = 1
                  const unlockFade = setInterval(() => {
                    unlockAlpha -= 0.02
                    unlockText.alpha = unlockAlpha
                    unlockText.y -= 0.5
                    if (unlockAlpha <= 0) {
                      app.stage.removeChild(unlockText)
                      clearInterval(unlockFade)
                    }
                  }, 30)
                }
              }

              // Visual feedback - show combo if shark was eating
              const hitMessage = isComboHit
                ? `🎯🔥 COMBO HIT! -${actualDamage} (2x)`
                : `🎯 HARPOON HIT! -${actualDamage}`
              const hitColor = isComboHit ? 0xffd700 : 0xff4444 // Gold for combo, red for normal

              const hitText = new Text({
                text: hitMessage,
                style: {
                  fontSize: isComboHit ? 28 : 24,
                  fill: hitColor,
                  fontWeight: "bold",
                  dropShadow: {
                    distance: 2,
                    color: 0x000000,
                    alpha: 0.7
                  }
                }
              })
              hitText.anchor.set(0.5)
              hitText.x = shark.x
              hitText.y = shark.y - 70
              app.stage.addChild(hitText)

              // Extra combo effect
              if (isComboHit) {
                playSound("combo_hit", { volume: 0.8 })
                const comboText = new Text({
                  text: "💥 BAIT COMBO! 💥",
                  style: {
                    fontSize: 32,
                    fill: 0xff6b00,
                    fontWeight: "bold",
                    dropShadow: {
                      distance: 3,
                      color: 0x000000,
                      alpha: 0.8
                    }
                  }
                })
                comboText.anchor.set(0.5)
                comboText.x = app.screen.width / 2
                comboText.y = app.screen.height / 3
                app.stage.addChild(comboText)

                let comboAlpha = 1
                const comboFade = setInterval(() => {
                  comboAlpha -= 0.04
                  comboText.alpha = comboAlpha
                  comboText.scale.set(1 + (1 - comboAlpha) * 0.3)
                  if (comboAlpha <= 0) {
                    app.stage.removeChild(comboText)
                    clearInterval(comboFade)
                  }
                }, 30)
              }

              // Animate and remove
              let hitAlpha = 1
              const hitFade = setInterval(() => {
                hitAlpha -= 0.03
                hitText.alpha = hitAlpha
                hitText.y -= 2
                if (hitAlpha <= 0) {
                  app.stage.removeChild(hitText)
                  clearInterval(hitFade)
                }
              }, 30)

              playSound("bite", { volume: 0.8 })
            }

            // Remove dead harpoons - filter out and destroy
            if (!harpoon.isAlive()) {
              harpoon.destroy()
              return false
            }
            return true
          })
        }

        // Update player movement
        if (player) {
          const playerId = player.userId || "player_1"
          let baseSpeed = 2

          // Apply orange buff speed multiplier when in water
          const isInWater = player.y > app.screen.height * 0.3
          if (isInWater && orangeBuffRef.current) {
            baseSpeed *= orangeBuffRef.current.getSpeedMultiplier(playerId)
          }

          let dx = 0
          let dy = 0

          // Keyboard input
          if (keys['w'] || keys['arrowup']) {
            dy -= baseSpeed
          }
          if (keys['s'] || keys['arrowdown']) {
            dy += baseSpeed
          }
          if (keys['a'] || keys['arrowleft']) {
            dx -= baseSpeed
          }
          if (keys['d'] || keys['arrowright']) {
            dx += baseSpeed
          }

          // Add touch input (if no keyboard input)
          if (dx === 0 && dy === 0) {
            dx = touchMovement.current.dx * (baseSpeed / 2) // Scale touch input too
            dy = touchMovement.current.dy * (baseSpeed / 2)
          }

          // Debug log movement
          if (dx !== 0 || dy !== 0) {
            console.log("Moving:", { dx, dy, keys, touch: touchMovement.current })
          }

          // Calculate shark distance for abilities
          let sharkDist: number | undefined
          if (shark) {
            sharkDist = Math.sqrt((shark.x - player.x) ** 2 + (shark.y - player.y) ** 2)
          }

          player.update(delta, dx, dy, isInWater, sharkDist)

          // Process ability effects on shark
          if (shark) {
            const abilityEffect = player.consumeAbilityEffect()
            if (abilityEffect.type === "stun_shark") {
              // Stun the shark and deal some damage
              shark.stun(abilityEffect.duration)
              shark.takeDamage(10) // Knowledge is power!

              // Display the fact/message above the shark
              const factText = new Text({
                text: `💬 "${abilityEffect.fact}"`,
                style: {
                  fontSize: 16,
                  fill: 0x32cd32,
                  fontWeight: "bold",
                  wordWrap: true,
                  wordWrapWidth: 250,
                  align: "center",
                  dropShadow: {
                    distance: 2,
                    color: 0x000000,
                    alpha: 0.7
                  }
                }
              })
              factText.anchor.set(0.5, 1)
              factText.x = shark.x
              factText.y = shark.y - 80
              app.stage.addChild(factText)

              // Fade out and remove after duration
              setTimeout(() => {
                let alpha = 1
                const fadeInterval = setInterval(() => {
                  alpha -= 0.05
                  factText.alpha = alpha
                  if (alpha <= 0) {
                    app.stage.removeChild(factText)
                    clearInterval(fadeInterval)
                  }
                }, 50)
              }, abilityEffect.duration - 500)
            } else if (abilityEffect.type === "throw_item") {
              // Boomer Dad throws item - deal damage if shark is close enough
              const distToShark = Math.sqrt((shark.x - player.x) ** 2 + (shark.y - player.y) ** 2)

              if (distToShark < 200) {
                // Item hits the shark!
                shark.takeDamage(abilityEffect.damage)
                playSound("bite", { volume: 0.6 }) // Reuse bite sound for impact

                // Display hit text
                const hitText = new Text({
                  text: `${abilityEffect.item} 💥 -${abilityEffect.damage}`,
                  style: {
                    fontSize: 20,
                    fill: 0xff6b6b,
                    fontWeight: "bold",
                    dropShadow: {
                      distance: 2,
                      color: 0x000000,
                      alpha: 0.7
                    }
                  }
                })
                hitText.anchor.set(0.5)
                hitText.x = shark.x
                hitText.y = shark.y - 60
                app.stage.addChild(hitText)

                // Animate and remove
                let hitAlpha = 1
                const hitFade = setInterval(() => {
                  hitAlpha -= 0.03
                  hitText.alpha = hitAlpha
                  hitText.y -= 2
                  if (hitAlpha <= 0) {
                    app.stage.removeChild(hitText)
                    clearInterval(hitFade)
                  }
                }, 30)
              } else {
                // Item missed - show miss text
                const missText = new Text({
                  text: `${abilityEffect.item} missed!`,
                  style: {
                    fontSize: 16,
                    fill: 0x888888,
                    fontWeight: "bold"
                  }
                })
                missText.anchor.set(0.5)
                missText.x = player.x + (shark.x - player.x) * 0.5
                missText.y = player.y + (shark.y - player.y) * 0.5
                app.stage.addChild(missText)

                setTimeout(() => {
                  app.stage.removeChild(missText)
                }, 1000)
              }
            }
          }

          // Keep player on screen
          player.x = Math.max(20, Math.min(app.screen.width - 20, player.x))
          player.y = Math.max(20, Math.min(app.screen.height - 20, player.y))

          // Check for treasure collection in deep water
          if (deepWaterZoneRef.current && isInWater) {
            const collected = deepWaterZoneRef.current.collectTreasure(player.x, player.y, playerId)
            if (collected) {
              // Award points
              setPlayerPoints(prev => prev + collected.points)
              playSound("treasure_collect", { volume: 0.6 })
              console.log(`Collected ${collected.type} for ${collected.points} points!`)

              // Visual feedback
              const treasureText = new Text({
                text: `💎 ${collected.type.toUpperCase()}!\n+${collected.points} points`,
                style: {
                  fontSize: 18,
                  fill: collected.type === "chest" ? 0xffd700 :
                        collected.type === "shark_tooth" ? 0xf5f5dc :
                        collected.type === "pearl" ? 0xfff0f5 : 0x4ecdc4,
                  fontWeight: "bold",
                  align: "center",
                  dropShadow: {
                    distance: 2,
                    color: 0x000000,
                    alpha: 0.7
                  }
                }
              })
              treasureText.anchor.set(0.5)
              treasureText.x = player.x
              treasureText.y = player.y - 40
              app.stage.addChild(treasureText)

              let treasureAlpha = 1
              const treasureFade = setInterval(() => {
                treasureAlpha -= 0.02
                treasureText.alpha = treasureAlpha
                treasureText.y -= 1
                if (treasureAlpha <= 0) {
                  app.stage.removeChild(treasureText)
                  clearInterval(treasureFade)
                }
              }, 30)
            }
          }

          // Update NPCs and check for nearby interactions
          if (npcsRef.current.length > 0) {
            let foundNearby: NPC | null = null
            for (const npc of npcsRef.current) {
              const isNear = npc.update(delta, player.x, player.y)
              if (isNear && !activeNPC && !foundNearby) {
                foundNearby = npc
              }
            }
            setNearbyNPC(foundNearby)

            // Update NPC event based on shark proximity
            if (shark) {
              const sharkDist = Math.sqrt(
                (shark.x - player.x) ** 2 + (shark.y - player.y) ** 2
              )
              if (sharkDist < 150) {
                setNpcEvent("shark_nearby")
              } else if (player.health < 50) {
                setNpcEvent("player_hurt")
              } else {
                setNpcEvent("calm")
              }
            }
          }

          // Check for game over
          if (player.health <= 0) {
            // Track death for stats
            setPlayerStats(prev => ({ ...prev, deaths: prev.deaths + 1 }))
            // Play game over sound
            playSound("game_over", { volume: 0.7 })

            // Game over screen
            const gameOverBg = new Graphics()
            gameOverBg.rect(0, 0, app.screen.width, app.screen.height)
            gameOverBg.fill({ color: 0x000000, alpha: 0.8 })
            app.stage.addChild(gameOverBg)

            const gameOverText = new Text("🦈 GAME OVER 🦈\n\nThe shark got you!\n\nPress ESC to return to lobby", {
                fontSize: 40,
                fill: 0xff0000,
                align: "center",
                fontWeight: "bold",
                dropShadow: {
                  distance: 3,
                  angle: Math.PI / 4,
                  blur: 4,
                  color: 0x000000,
                  alpha: 0.5
                },
            })
            gameOverText.anchor.set(0.5)
            gameOverText.x = app.screen.width / 2
            gameOverText.y = app.screen.height / 2
            app.stage.addChild(gameOverText)

            // Stop the game loop
            app.ticker.stop()
          }
        }

        // Update shark AI
        if (shark && player) {
          // Prepare game state for AI
          const gameState = {
            waterLevel: "calm",
            timeRemaining: 300,
            playerCount: 1,
            boundaries: {
              minX: 40,
              maxX: app.screen.width - 40,
              minY: app.screen.height * 0.3 + 40,
              maxY: app.screen.height - 40,
            },
          }

          // Simple AI: move shark towards player
          const dx = player.x - shark.x
          const dy = player.y - shark.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // Play tension music when shark is close
          if (distance < 250) {
            if (!audioRefs.current.sharkTension) {
              const tensionId = playSound("shark_tension", { loop: true, volume: 0.5, fadeIn: 1 })
              if (tensionId) {
                audioRefs.current.sharkTension = tensionId
              }
            }
          } else {
            // Stop tension music when far away
            if (audioRefs.current.sharkTension) {
              stopSound(audioRefs.current.sharkTension, 1.5)
              audioRefs.current.sharkTension = null
            }
          }

          if (distance > 50) {
            // Shark gets faster when angry
            const baseSpeed = 1.5
            const rageBonus = ((shark.getRage() || 0) / 100) * 1.5 // Up to 1.5x speed bonus
            const sharkSpeed = baseSpeed + rageBonus

            const moveX = (dx / distance) * sharkSpeed
            const moveY = (dy / distance) * sharkSpeed
            shark.x += moveX
            shark.y += moveY
          }

          shark.update(delta, player, gameState)

          // Keep shark in water only
          shark.y = Math.max(
            app.screen.height * 0.3 + 40,
            Math.min(app.screen.height - 40, shark.y)
          )
          shark.x = Math.max(40, Math.min(app.screen.width - 40, shark.x))

          // Check for collisions and record encounters
          const sharkBounds = shark.getBounds()
          const playerBounds = player.getBounds()

          // Check if player is in a safe zone
          const playerId = player.userId || "player_1"
          const isOnDock = dockRef.current && dockRef.current.isPointOnDock(player.x, player.y)
          const isInBoat = boatRef.current && boatRef.current.isPlayerInBoat(playerId)
          const isInHouse = beachHouseRef.current && beachHouseRef.current.isPlayerInside(playerId)
          const isInSafeZone = isOnDock || isInBoat || isInHouse

          if (checkCollision(sharkBounds, playerBounds) && !isInSafeZone) {
            const damageApplied = player.takeDamage(20)

            if (damageApplied) {
              // Damage went through
              playSound("bite", { volume: 0.8 })

              // Visual feedback for bite
              const biteText = new Text({
                text: "💥 CHOMP!",
                style: {
                  fontSize: 30,
                  fill: 0xff0000,
                  fontWeight: "bold",
                  dropShadow: {
                    distance: 2,
                    angle: Math.PI / 4,
                    blur: 2,
                    color: 0x000000,
                    alpha: 0.5
                  },
                }
              })
              biteText.x = player.x
              biteText.y = player.y - 50
              app.stage.addChild(biteText)

              // Remove bite text after animation
              setTimeout(() => {
                app.stage.removeChild(biteText)
              }, 1000)

              // Screen shake effect
              app.stage.x = Math.random() * 10 - 5
              app.stage.y = Math.random() * 10 - 5
              setTimeout(() => {
                app.stage.x = 0
                app.stage.y = 0
              }, 100)

              // Record successful hunt
              if (aiControllerRef.current) {
                aiControllerRef.current.recordEncounter(player.userId || "unknown", "hunt", true, {
                  description: "Successful bite attack!",
                  intensity: 0.8,
                })
              }
            } else {
              // Damage was blocked by shield or invincibility
              playSound("ability_activate", { volume: 0.5 })

              const blockText = new Text({
                text: player.isCurrentlyInvincible() ? "✨ INVINCIBLE!" : "🛡️ BLOCKED!",
                style: {
                  fontSize: 28,
                  fill: 0xffd700,
                  fontWeight: "bold",
                  dropShadow: {
                    distance: 2,
                    color: 0x000000,
                    alpha: 0.5
                  },
                }
              })
              blockText.anchor.set(0.5)
              blockText.x = player.x
              blockText.y = player.y - 50
              app.stage.addChild(blockText)

              // Animate and remove
              let blockAlpha = 1
              const blockFade = setInterval(() => {
                blockAlpha -= 0.05
                blockText.alpha = blockAlpha
                blockText.y -= 1
                if (blockAlpha <= 0) {
                  app.stage.removeChild(blockText)
                  clearInterval(blockFade)
                }
              }, 30)

              // Push shark back when blocked
              const pushAngle = Math.atan2(shark.y - player.y, shark.x - player.x)
              shark.x += Math.cos(pushAngle) * 50
              shark.y += Math.sin(pushAngle) * 50
            }
          }

          // Get current AI state for display (using defaults for now)
          // const aiState = shark.getAIState()

          // Call AI for decisions every 2 seconds
          const now = Date.now()
          if (now - lastAIDecisionRef.current > 2000 && !isAIThinking) {
            lastAIDecisionRef.current = now
            setIsAIThinking(true)

            // Prepare context for AI
            const context: GameContext = {
              currentPlayers: [
                {
                  id: player.userId || "player_1",
                  name: "The Influencer",
                  position: { x: player.x, y: player.y },
                  health: player.health,
                  speed: 2,
                  isInWater: player.y > app.screen.height * 0.3,
                },
              ],
              sharkPosition: { x: shark.x, y: shark.y },
              sharkHealth: 100,
              sharkPersonality: "theatrical",
              timeOfDay: "day",
              weatherCondition: "calm",
              recentEvents: [
                distance < 100 ? "Player very close!" : "",
                shark.getRage() > 0 ? "Still angry from selfie!" : "",
              ].filter((e) => e),
              memories: [],
            }

            // Cancel any previous AI request to prevent race conditions
            if (aiAbortControllerRef.current) {
              aiAbortControllerRef.current.abort()
            }
            aiAbortControllerRef.current = new AbortController()

            // Make AI decision via API
            fetch("/api/shark-brain", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "decide", context }),
              signal: aiAbortControllerRef.current.signal,
            })
              .then((res) => res.json())
              .then((decision) => {
                setAIThoughts(decision.innerMonologue)
                setIsAIThinking(false)

                // Update shark behavior based on AI decision
                if (decision.action === "taunt") {
                  setSharkCommentary(decision.innerMonologue)
                }
              })
              .catch((err) => {
                // Don't log AbortError as it's intentional when cancelling stale requests
                if (err.name === "AbortError") {
                  return
                }
                console.log("AI decision failed, using fallback:", err)
                setIsAIThinking(false)
                // Fallback to simple thoughts
                const thoughts =
                  distance < 100
                    ? "So close... I can almost taste the influencer!"
                    : distance < 200
                      ? "Come closer, my little content creator..."
                      : distance < 300
                        ? "Swimming in circles, plotting dramatically..."
                        : "Patrolling my domain with theatrical flair..."
                setAIThoughts(thoughts)
              })
          }

          setSharkAIState({
            personality: "theatrical",
            hunger: 50,
            rage: shark.getRage() || 0,
            currentTarget: "player_1",
          })

          if (aiControllerRef.current) {
            const decision = aiControllerRef.current.getCurrentDecision()
            if (decision) {
              setAIThoughts(decision.reasoning)

              // Update shark commentary based on AI thoughts
              if (
                decision.reasoning.includes("hunting") ||
                decision.reasoning.includes("stalking")
              ) {
                setIsSharkThinking(true)
                setSharkCommentary(decision.reasoning)
              }
            }

            // Check for pattern recognition and psychological warfare
            if (player.userId) {
              const memory = getMemoryForPlayer(player.userId)
              const pattern = checkPattern(player.userId, {
                position: { x: player.x, y: player.y, z: 0 },
                action: "move",
              })

              // Handle recognition moments
              if (memory && Date.now() - lastRecognitionRef.current > 30000) {
                const encounters = memory.encounters || 0
                let recognitionLevel: "first" | "familiar" | "nemesis" = "first"
                let playerRecLevel: "familiar" | "known" | "nemesis" = "familiar"

                if (encounters > 10) {
                  recognitionLevel = "nemesis"
                  playerRecLevel = "nemesis"
                } else if (encounters > 5) {
                  recognitionLevel = "familiar"
                  playerRecLevel = "known"
                }

                // Trigger recognition moment
                if (encounters > 0) {
                  lastRecognitionRef.current = Date.now()
                  setRecognitionMoment({
                    active: true,
                    playerName: "Player",
                    memories: [
                      {
                        encounter: "First blood...",
                        outcome: "You escaped barely",
                        timestamp: "2 games ago",
                      },
                      {
                        encounter: "The shallow water trick",
                        outcome: "I learned",
                        timestamp: "Last game",
                      },
                    ],
                    level: recognitionLevel,
                  })

                  setPlayerRecognition({
                    level: playerRecLevel,
                    encounters: encounters,
                  })

                  // Trigger effects
                  psychEffectsRef.current?.screenShake(500, 15)
                  psychEffectsRef.current?.recognitionFlash()
                  psychEffectsRef.current?.setTension(0.6)

                  // Achievement check
                  if (encounters === 1) {
                    achievementRef.current.trigger("first_recognition")
                  } else if (encounters > 10) {
                    achievementRef.current.trigger("nemesis_status")
                  }

                  // Special commentary for recognition
                  setSharkCommentary(
                    `I remember you... ${encounters} times we've danced this dance.`
                  )
                }
              }

              // Handle pattern-based taunts
              if (pattern) {
                setPatternRecognized({
                  type: pattern.type,
                  confidence: pattern.confidence,
                })

                predictionCountRef.current++

                // Generate personalized taunt
                const tauntType =
                  pattern.type === "hiding_spot"
                    ? "location"
                    : pattern?.type === "escape_route"
                      ? "pattern"
                      : "behavior"
                const taunts = TAUNT_TEMPLATES[tauntType as keyof typeof TAUNT_TEMPLATES]
                if (!taunts || taunts.length === 0) {
                  return // Skip if no taunts available
                }
                const selectedTaunt = taunts[Math.floor(Math.random() * taunts.length)]
                if (!selectedTaunt) {
                  return // Skip if somehow undefined
                }
                const taunt = selectedTaunt.replace("{name}", "Player")

                setCurrentTaunt({
                  id: `taunt_${Date.now()}`,
                  text: taunt,
                  type: "prediction",
                  intensity: pattern.confidence > 0.8 ? "intense" : "moderate",
                })

                // Psychological effects
                psychEffectsRef.current?.showWatchedIndicator(
                  shark.x,
                  shark.y - 50,
                  pattern.confidence
                )
                if (pattern.confidence > 0.8) {
                  psychEffectsRef.current?.predatorVision(2000)
                }

                // Achievement for predictions
                if (predictionCountRef.current >= 3) {
                  achievementRef.current.trigger("predictable_prey")
                }

                // Clear pattern indicator after a few seconds
                setTimeout(() => setPatternRecognized(undefined), 5000)
              }

              // Dynamic tension based on proximity
              const distance = Math.sqrt((shark.x - player.x) ** 2 + (shark.y - player.y) ** 2)
              const tension = Math.max(0, 1 - distance / 500)
              psychEffectsRef.current?.setTension(tension * 0.5)

              // Heartbeat when very close
              if (distance < 150 && !achievementRef.current.hasAchievement("shark_knows_name")) {
                psychEffectsRef.current?.startHeartbeat(120)
              } else {
                psychEffectsRef.current?.stopHeartbeat()
              }
            }
          }
        }
      })

      // Handle resize
      const handleResize = () => {
        app.renderer.resize(window.innerWidth, window.innerHeight)

        // Redraw background
        beach.clear()
        beach.rect(0, 0, app.screen.width, app.screen.height * 0.3)
        beach.fill(COLORS.sand)

        water.clear()
        const waterY = app.screen.height * 0.3
        for (let i = 0; i < 20; i++) {
          const alpha = 0.8 + (i / 20) * 0.2
          const color = i < 10 ? COLORS.lightWater : COLORS.darkWater
          water.rect(
            0,
            waterY + (i * (app.screen.height * 0.7)) / 20,
            app.screen.width,
            (app.screen.height * 0.7) / 20
          )
          water.fill({ color, alpha })
        }

        // Reposition NPCs for new screen size
        if (npcsRef.current.length > 0) {
          repositionNPCs(npcsRef.current, app.screen.width, app.screen.height)
        }

        // Keep player on screen after resize
        if (playerRef.current) {
          playerRef.current.x = Math.max(20, Math.min(app.screen.width - 20, playerRef.current.x))
          playerRef.current.y = Math.max(20, Math.min(app.screen.height - 20, playerRef.current.y))
        }

        // Keep shark in water after resize
        if (sharkRef.current) {
          sharkRef.current.y = Math.max(
            app.screen.height * 0.3 + 40,
            Math.min(app.screen.height - 40, sharkRef.current.y)
          )
          sharkRef.current.x = Math.max(40, Math.min(app.screen.width - 40, sharkRef.current.x))
        }

        // Update shark health bar position
        if (sharkHealthBarRef.current) {
          sharkHealthBarRef.current.onResize()
        }

        // Update deep water indicator
        if (deepWaterIndicatorRef.current) {
          deepWaterIndicatorRef.current.resize(app.screen.width, app.screen.height, app.screen.height * 0.3)
        }
      }

      window.addEventListener("resize", handleResize)

      // Return cleanup function for event listeners
      return () => {
        window.removeEventListener("resize", handleResize)
        window.removeEventListener("keydown", handleKeyDown)
        window.removeEventListener("keyup", handleKeyUp)
      }
    }

    let cleanupGame: (() => void) | undefined

    initGame().then((cleanup) => {
      cleanupGame = cleanup
    })

    return () => {
      // Cancel any pending AI requests
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort()
        aiAbortControllerRef.current = null
      }

      // Call the cleanup function from initGame if it exists
      if (cleanupGame) {
        cleanupGame()
      }

      if (appRef.current) {
        try {
          // Check if destroy method exists and app is initialized
          if (appRef.current.destroy && typeof appRef.current.destroy === "function") {
            appRef.current.destroy(true, { children: true, texture: true })
          }
          appRef.current = null
        } catch (e) {
          console.error("Error destroying Pixi app:", e)
        }
      }
      if (psychEffectsRef.current) {
        psychEffectsRef.current.destroy()
        psychEffectsRef.current = null
      }
      // Clean up any remaining canvas elements
      if (canvasRef.current) {
        while (canvasRef.current.firstChild) {
          canvasRef.current.removeChild(canvasRef.current.firstChild)
        }
      }
    }
  }, [checkPattern, getMemoryForPlayer, isAIThinking])

  // Touch control handlers
  const handleTouchMove = (dx: number, dy: number) => {
    touchMovement.current = { dx, dy }
  }

  const handleAbility = () => {
    if (playerRef.current) {
      playerRef.current.activateAbility()
      playSound("ability_activate", { volume: 0.6 })
    }
  }

  const handleSelfie = () => {
    if (playerRef.current && sharkRef.current && objectiveSystemRef.current) {
      const player = playerRef.current
      const shark = sharkRef.current
      const objectiveSystem = objectiveSystemRef.current

      const success = objectiveSystem.attemptSelfie(player.x, player.y, shark.x, shark.y)

      if (success) {
        console.log("Selfie successful!")
        playSound("selfie_camera", { volume: 0.7 })
        shark.setRage(shark.getRage() + 50)
      }
    }
  }

  const handleTalk = () => {
    if (playerRef.current && npcsRef.current) {
      const player = playerRef.current
      const foundNPC = npcsRef.current.find((npc) => npc.isPlayerNearby(player.x, player.y))
      if (foundNPC) {
        console.log(`Interacting with ${foundNPC.npcName}`)
        playSound("npc_chime", { volume: 0.5 })
        setActiveNPC(foundNPC)
        foundNPC.setInteracting(true)
      }
    }
  }

  return (
    <div className="relative w-full h-screen">
      {/* Loading Screen */}
      {!assetsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-blue-400 to-cyan-500 z-50">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Loading Beach Panic</h2>
            <div className="w-64 h-4 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-white/80 mt-4">{loadingProgress}%</p>
            <p className="text-white/60 text-sm mt-2">Loading sprites and assets...</p>
          </div>
        </div>
      )}

      <div
        ref={canvasRef}
        className="w-full h-screen overflow-hidden"
        style={{ background: "linear-gradient(180deg, #87CEEB 0%, #4ECDC4 100%)" }}
      />

      {/* AI Decision Display */}
      <AIDecisionDisplay
        personality={sharkAIState.personality}
        currentThought={aiThoughts}
        hunger={sharkAIState.hunger}
        rage={sharkAIState.rage}
        currentTarget={sharkAIState.currentTarget}
        patternRecognized={patternRecognized}
      />

      {/* Psychological Warfare Components */}
      <SharkCommentary
        personality={sharkAIState.personality}
        isThinking={isSharkThinking}
        currentThought={sharkCommentary}
        targetName="Player"
        recognition={playerRecognition}
      />

      <PersonalizedTaunts
        sharkPosition={{
          x: sharkRef.current?.x || 0,
          y: sharkRef.current?.y || 0,
        }}
        playerPosition={{
          x: playerRef.current?.x || 0,
          y: playerRef.current?.y || 0,
        }}
        personality={sharkAIState.personality}
        currentTaunt={currentTaunt}
        isActive={!!currentTaunt}
      />

      <RecognitionMoment
        isActive={recognitionMoment.active}
        playerName={recognitionMoment.playerName}
        memories={recognitionMoment.memories}
        recognitionLevel={recognitionMoment.level}
        onComplete={() => setRecognitionMoment((prev) => ({ ...prev, active: false }))}
      />

      {/* Volume Control */}
      <VolumeControl />

      {/* Shark Health Bar UI (React component) */}
      <SharkHealthBarUI
        currentHP={sharkHP.current}
        maxHP={sharkHP.max}
        lastDamage={lastSharkDamage}
        isVisible={!victoryScreenVisible}
      />

      {/* Victory Screen */}
      <VictoryScreen
        visible={victoryScreenVisible}
        stats={playerStats}
        onPlayAgain={() => {
          setVictoryScreenVisible(false)
          window.location.reload() // Simple restart for now
        }}
      />

      {/* Minimap */}
      <Minimap
        playerPos={{ x: playerRef.current?.x || 0, y: playerRef.current?.y || 0 }}
        sharkPos={{ x: sharkRef.current?.x || 0, y: sharkRef.current?.y || 0 }}
        sharkRotation={0}
        stations={harpoonStationsRef.current.map(s => ({ x: s.x, y: s.y }))}
        worldSize={{ width: typeof window !== 'undefined' ? window.innerWidth : 800, height: typeof window !== 'undefined' ? window.innerHeight : 600 }}
        waterLineY={typeof window !== 'undefined' ? window.innerHeight * 0.3 : 180}
        visible={minimapVisible}
        onToggle={() => setMinimapVisible(!minimapVisible)}
      />

      {/* Touch Action Buttons - pickup and throw items */}
      <TouchActionButtons
        canPickup={canPickupItem}
        hasHeldItem={!!heldBeachItemRef.current}
        heldItemType={heldBeachItemRef.current?.type}
        onPickup={() => {
          if (playerRef.current && beachItemSpawnerRef.current && entityLayerRef.current) {
            const player = playerRef.current
            if (heldBeachItemRef.current) return
            const item = beachItemSpawnerRef.current.pickupItem(player.x, player.y)
            if (item) {
              heldBeachItemRef.current = item
              item.container.visible = false
              playSound("ability_activate", { volume: 0.5 })
            }
          }
        }}
        onThrow={() => {
          if (playerRef.current && sharkRef.current && entityLayerRef.current && heldBeachItemRef.current) {
            const player = playerRef.current
            const shark = sharkRef.current
            const heldItem = heldBeachItemRef.current
            const itemType = heldItem.type
            const effect = heldItem.use(shark.x, shark.y)
            const thrownItem = new ThrownItem(player.x, player.y, shark.x, shark.y, itemType, effect)
            thrownItemsRef.current.push(thrownItem)
            entityLayerRef.current!.addChild(thrownItem.container)
            beachItemSpawnerRef.current?.removeItem(heldItem)
            heldBeachItemRef.current = null
            playSound("ability_activate", { volume: 0.6 })
          }
        }}
      />

      {/* NPC Interaction Prompt */}
      {nearbyNPC && !activeNPC && (
        <div className="absolute left-1/2 bottom-32 transform -translate-x-1/2 animate-bounce">
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center backdrop-blur-sm border border-white/20">
            <div className="text-sm font-medium">{nearbyNPC.npcName}</div>
            <div className="text-xs text-cyan-400 mt-1">Press E to talk</div>
          </div>
        </div>
      )}

      {/* NPC Dialogue */}
      {activeNPC && (
        <NPCDialogue
          npcType={activeNPC.npcType}
          npcName={activeNPC.npcName}
          position={activeNPC.getPosition()}
          isPlayerNearby={true}
          playerName={playerRef.current?.name || "Swimmer"}
          onClose={() => {
            if (activeNPC) {
              activeNPC.setInteracting(false)
            }
            setActiveNPC(null)
          }}
          currentEvent={npcEvent}
          recentSharkSighting={npcEvent === "shark_nearby"}
        />
      )}

      {/* Player Status - moved to middle right to avoid overlap */}
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/50 text-white p-4 rounded-lg">
        <h3 className="text-sm font-bold mb-2">Player Status</h3>
        <div className="text-xs space-y-2">
          <div>
            <div className="mb-1">Health: {Math.round(playerRef.current?.health || 100)}%</div>
            <div className="w-32 h-2 bg-gray-700 rounded">
              <div
                className="h-full bg-red-500 rounded transition-all"
                style={{ width: `${playerRef.current?.health || 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1">Stamina: {Math.round(playerRef.current?.stamina || 100)}%</div>
            <div className="w-32 h-2 bg-gray-700 rounded">
              <div
                className={`h-full rounded transition-all ${
                  (playerRef.current?.stamina || 100) > 50
                    ? "bg-green-500"
                    : (playerRef.current?.stamina || 100) > 25
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${(playerRef.current?.stamina ?? 100)}%` }}
              />
            </div>
          </div>
          {playerRef.current && playerRef.current.stamina !== undefined && playerRef.current.stamina < 25 && playerRef.current.isInWater && (
            <div className="text-red-400 text-xs animate-pulse">⚠️ Low stamina!</div>
          )}
          {orangeBuffActive && (
            <div className="text-orange-400 text-xs animate-pulse flex items-center gap-1">
              🍊 Speed Boost! ({orangeBuffTimeLeft}s)
            </div>
          )}
          {heldBeachItemRef.current && (
            <div className="text-cyan-400 text-xs flex items-center gap-1">
              🏖️ Holding: {heldBeachItemRef.current.type}
            </div>
          )}
          <div className="border-t border-white/20 pt-2 mt-2">
            <div className="text-yellow-400 font-bold">💰 {playerPoints} pts</div>
            <div className="text-cyan-400">🐟 {playerFishInventory.length} fish</div>
            {playerFishInventory.length > 0 && (
              <div className="text-xs text-gray-400">
                {playerFishInventory.slice(0, 3).join(", ")}
                {playerFishInventory.length > 3 && `...+${playerFishInventory.length - 3}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Touch Controls - only on touch devices */}
      {isTouchDevice && (
        <TouchControls
          onMove={handleTouchMove}
          onAbility={handleAbility}
          onSelfie={handleSelfie}
          onTalk={handleTalk}
          showTalkButton={!!nearbyNPC}
        />
      )}

      {/* Controls Hint - responsive sizing and content */}
      {!isTouchDevice && (
        <div className="absolute bottom-4 left-4 bg-black/40 text-white p-2 sm:p-3 rounded-lg text-xs sm:text-sm backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1">
            <span className="text-gray-400">Move:</span>
            <span>WASD / Arrows</span>
            <span className="text-gray-400">Ability:</span>
            <span>Space</span>
            <span className="text-gray-400">Selfie/Harpoon:</span>
            <span>F</span>
            <span className="text-gray-400">Interact:</span>
            <span>E</span>
            <span className="text-gray-400">Shop:</span>
            <span>Q/R (prev/next)</span>
            <span className="text-gray-400">Throw Bait:</span>
            <span>T (in water)</span>
            <span className="text-gray-400">Boat/Sleep:</span>
            <span>B</span>
            <span className="text-gray-400">Beach House:</span>
            <span>X (enter/exit)</span>
            <span className="text-gray-400">Beach Items:</span>
            <span>G (pickup) / C (throw)</span>
            <span className="text-gray-400">Minimap:</span>
            <span>M (toggle)</span>
            <span className="text-gray-400">Exit:</span>
            <span>ESC</span>
          </div>
        </div>
      )}
      {isTouchDevice && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/40 text-white px-4 py-2 rounded-lg text-xs backdrop-blur-sm text-center">
          <div className="font-medium">Touch Controls Active</div>
          <div className="text-white/60 mt-1">Use joystick to move, buttons for actions</div>
        </div>
      )}
    </div>
  )
}

interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

function checkCollision(a: Bounds, b: Bounds): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}
