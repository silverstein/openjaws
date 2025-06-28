'use client'

import { useEffect, useRef, useState } from 'react'
import { Application, Graphics, Assets, Sprite, Container, FederatedPointerEvent, Text } from 'pixi.js'
import { Player } from '@/lib/game/entities/Player'
import { Shark } from '@/lib/game/entities/Shark'
import { SharkAIController } from '@/lib/game/ai/SharkAIController'
import { createWaterShader } from '@/lib/game/shaders/WaterShader'
import { ChromaticAberrationFilter } from '@/lib/game/filters/ChromaticAberration'
import { useSharkMemory } from '@/hooks/useSharkMemory'
import { AIDecisionDisplay } from './AIDecisionDisplay'
import { SharkCommentary } from '@/components/ai/SharkCommentary'
import { RecognitionMoment } from './RecognitionMoment'
import { PersonalizedTaunts, TAUNT_TEMPLATES } from '@/components/ai/PersonalizedTaunts'
import { PsychologicalEffects, AchievementTrigger } from '@/lib/game/effects/PsychologicalEffects'
import type { SharkPersonality } from '@/lib/ai/sharkBrain'
import { ObjectiveSystem } from '@/lib/game/systems/ObjectiveSystem'

// Game color palette from docs
const COLORS = {
  hotPink: 0xFF6B6B,
  electricBlue: 0x4ECDC4,
  warningOrange: 0xFFA07A,
  sand: 0xF4E6D9,
  darkWater: 0x2A7F7E,
  lightWater: 0x5BCDCD
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
  const [aiThoughts, setAIThoughts] = useState<string>('')
  const [sharkAIState, setSharkAIState] = useState({
    personality: 'theatrical' as const,
    hunger: 50,
    rage: 0,
    currentTarget: null as string | null
  })
  const [patternRecognized, setPatternRecognized] = useState<{ type: string; confidence: number } | undefined>()
  const { loadMemories, saveObservation, checkPattern, getMemoryForPlayer } = useSharkMemory()
  
  // Psychological warfare state
  const [isSharkThinking, setIsSharkThinking] = useState(false)
  const [sharkCommentary, setSharkCommentary] = useState<string>('')
  const [currentTaunt, setCurrentTaunt] = useState<any>()
  const [recognitionMoment, setRecognitionMoment] = useState<{
    active: boolean
    playerName: string
    memories: any[]
    level: 'first' | 'familiar' | 'nemesis'
  }>({
    active: false,
    playerName: '',
    memories: [],
    level: 'first'
  })
  const [playerRecognition, setPlayerRecognition] = useState<{
    level: 'familiar' | 'known' | 'nemesis'
    encounters: number
  } | undefined>()
  
  const psychEffectsRef = useRef<PsychologicalEffects | null>(null)
  const achievementRef = useRef<AchievementTrigger>(new AchievementTrigger())
  const lastRecognitionRef = useRef<number>(0)
  const predictionCountRef = useRef<number>(0)
  const lastAIDecisionRef = useRef<number>(0)
  const [isAIThinking, setIsAIThinking] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize Pixi Application
    const app = new Application()
    appRef.current = app

    const initGame = async () => {
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: COLORS.electricBlue,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      if (!canvasRef.current) return
      canvasRef.current.appendChild(app.canvas)

      // Create game layers
      const backgroundLayer = new Container()
      const entityLayer = new Container()
      const uiLayer = new Container()

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
        water.rect(0, waterY + (i * (app.screen.height * 0.7) / 20), app.screen.width, (app.screen.height * 0.7) / 20)
        water.fill({ color, alpha })
      }
      backgroundLayer.addChild(water)

      // Apply water shader effect
      // TODO: Fix shader for Pixi.js v8 compatibility
      // const waterShader = createWaterShader()
      // if (waterShader) {
      //   water.filters = [waterShader]
      // }

      // Apply chromatic aberration to the whole stage for that retro feel
      // TODO: Fix filter for Pixi.js v8 compatibility
      // const chromaFilter = new ChromaticAberrationFilter()
      // app.stage.filters = [chromaFilter]
      
      // Initialize psychological effects
      psychEffectsRef.current = new PsychologicalEffects(app)
      
      // Initialize objective system
      const objectiveSystem = new ObjectiveSystem()
      objectiveSystemRef.current = objectiveSystem
      uiLayer.addChild(objectiveSystem.getContainer())

      // Create player with a mock userId for now
      const player = new Player(app.screen.width / 2, app.screen.height / 2, 'influencer', 'player_1')
      playerRef.current = player
      entityLayer.addChild(player.container)

      // Create shark
      const shark = new Shark(app.screen.width * 0.8, app.screen.height * 0.6)
      sharkRef.current = shark
      entityLayer.addChild(shark.container)
      console.log('Shark created at:', shark.x, shark.y)
      
      // Set shark personality without AI controller for now
      shark.setPersonality('theatrical') // Start with theatrical personality
      
      // We'll use the AI SDK directly in the game loop instead of through the controller
      console.log('Shark initialized with theatrical personality')

      // Handle keyboard input
      const keys: { [key: string]: boolean } = {}
      
      window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase()
        keys[key] = true
        console.log('Key down:', key)
        
        // Activate ability on space
        if (e.key === ' ' && player) {
          e.preventDefault() // Prevent page scroll
          player.activateAbility()
        }
        
        // Take selfie on F
        if (e.key === 'f' && player && shark && objectiveSystem) {
          e.preventDefault()
          console.log('Attempting selfie...')
          
          const success = objectiveSystem.attemptSelfie(
            player.x, player.y,
            shark.x, shark.y
          )
          
          if (success) {
            console.log('Selfie successful!')
            // Make shark angry after selfie
            if (shark) {
              shark.rage = Math.min(shark.rage + 50, 100)
            }
          } else {
            // Show "too far" message
            const tooFarText = new Text({
              text: '📸 Too far from shark!',
              style: {
                fontSize: 20,
                fill: 0xFF0000,
                fontWeight: 'bold'
              }
            })
            tooFarText.x = player.x - 80
            tooFarText.y = player.y - 50
            app.stage.addChild(tooFarText)
            
            setTimeout(() => {
              app.stage.removeChild(tooFarText)
            }, 1000)
          }
        }
        
        // Return to lobby on ESC
        if (e.key === 'Escape') {
          window.location.href = '/lobby'
        }
      })
      
      window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false
      })

      // Game loop
      app.ticker.add((ticker) => {
        const delta = ticker.deltaTime

        // Update water shader time
        // if (waterShader) {
        //   waterShader.time += 0.01
        // }
        
        // Update objective system
        if (objectiveSystemRef.current) {
          objectiveSystemRef.current.updateTimer(delta)
        }

        // Update player movement
        if (player) {
          const speed = 2
          let dx = 0
          let dy = 0

          if (keys['w'] || keys['arrowup']) dy -= speed
          if (keys['s'] || keys['arrowdown']) dy += speed
          if (keys['a'] || keys['arrowleft']) dx -= speed
          if (keys['d'] || keys['arrowright']) dx += speed

          // Debug log movement
          if (dx !== 0 || dy !== 0) {
            console.log('Moving:', { dx, dy, keys })
          }

          // Check if player is in water (below beach line)
          const isInWater = player.y > app.screen.height * 0.3
          player.update(delta, dx, dy, isInWater)

          // Keep player on screen
          player.x = Math.max(20, Math.min(app.screen.width - 20, player.x))
          player.y = Math.max(20, Math.min(app.screen.height - 20, player.y))
          
          // Check for game over
          if (player.health <= 0) {
            // Game over screen
            const gameOverBg = new Graphics()
            gameOverBg.rect(0, 0, app.screen.width, app.screen.height)
            gameOverBg.fill({ color: 0x000000, alpha: 0.8 })
            app.stage.addChild(gameOverBg)
            
            const gameOverText = new Text({
              text: '🦈 GAME OVER 🦈\n\nThe shark got you!\n\nPress ESC to return to lobby',
              style: {
                fontSize: 40,
                fill: 0xFF0000,
                align: 'center',
                fontWeight: 'bold',
                dropShadow: true,
                dropShadowDistance: 3
              }
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
            waterLevel: 'calm',
            timeRemaining: 300,
            playerCount: 1,
            boundaries: {
              minX: 40,
              maxX: app.screen.width - 40,
              minY: app.screen.height * 0.3 + 40,
              maxY: app.screen.height - 40
            }
          }
          
          // Simple AI: move shark towards player
          const dx = player.x - shark.x
          const dy = player.y - shark.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance > 50) {
            // Shark gets faster when angry
            const baseSpeed = 1.5
            const rageBonus = (shark.rage || 0) / 100 * 1.5 // Up to 1.5x speed bonus
            const sharkSpeed = baseSpeed + rageBonus
            
            const moveX = (dx / distance) * sharkSpeed
            const moveY = (dy / distance) * sharkSpeed
            shark.x += moveX
            shark.y += moveY
          }
          
          shark.update(delta, player, gameState)

          // Keep shark in water only
          shark.y = Math.max(app.screen.height * 0.3 + 40, Math.min(app.screen.height - 40, shark.y))
          shark.x = Math.max(40, Math.min(app.screen.width - 40, shark.x))
          
          // Check for collisions and record encounters
          const sharkBounds = shark.getBounds()
          const playerBounds = player.getBounds()
          
          if (checkCollision(sharkBounds, playerBounds)) {
            player.takeDamage(20)
            
            // Visual feedback for bite
            const biteText = new Text({
              text: '💥 CHOMP!',
              style: {
                fontSize: 30,
                fill: 0xFF0000,
                fontWeight: 'bold',
                dropShadow: true,
                dropShadowDistance: 2
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
              aiControllerRef.current.recordEncounter(
                player.userId || 'unknown',
                'hunt',
                true,
                {
                  description: 'Successful bite attack!',
                  intensity: 0.8
                }
              )
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
              currentPlayers: [{
                id: player.userId || 'player_1',
                name: 'The Influencer',
                position: { x: player.x, y: player.y },
                health: player.health,
                speed: 2,
                isInWater: player.y > app.screen.height * 0.3
              }],
              sharkPosition: { x: shark.x, y: shark.y },
              sharkHealth: 100,
              sharkPersonality: 'theatrical',
              timeOfDay: 'day',
              weatherCondition: 'calm',
              recentEvents: [
                distance < 100 ? 'Player very close!' : '',
                shark.rage > 0 ? 'Still angry from selfie!' : ''
              ].filter(e => e),
              memories: []
            }
            
            // Make AI decision via API
            fetch('/api/shark-brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'decide', context })
            })
              .then(res => res.json())
              .then(decision => {
                setAIThoughts(decision.innerMonologue)
                setIsAIThinking(false)
                
                // Update shark behavior based on AI decision
                if (decision.action === 'taunt') {
                  setSharkCommentary(decision.innerMonologue)
                }
              })
              .catch(err => {
                console.log('AI decision failed, using fallback:', err)
                setIsAIThinking(false)
                // Fallback to simple thoughts
                const thoughts = 
                  distance < 100 ? "So close... I can almost taste the influencer!" :
                  distance < 200 ? "Come closer, my little content creator..." :
                  distance < 300 ? "Swimming in circles, plotting dramatically..." :
                  "Patrolling my domain with theatrical flair..."
                setAIThoughts(thoughts)
              })
          }
          
          setSharkAIState({
            personality: 'theatrical',
            hunger: 50,
            rage: shark.rage || 0,
            currentTarget: 'player_1'
          })
          
          if (aiControllerRef.current) {
            const decision = aiControllerRef.current.getCurrentDecision()
            if (decision) {
              setAIThoughts(decision.reasoning)
              
              // Update shark commentary based on AI thoughts
              if (decision.reasoning.includes('hunting') || decision.reasoning.includes('stalking')) {
                setIsSharkThinking(true)
                setSharkCommentary(decision.reasoning)
              }
            }
            
            // Check for pattern recognition and psychological warfare
            if (player.userId) {
              const memory = getMemoryForPlayer(player.userId)
              const pattern = checkPattern(player.userId, {
                position: { x: player.x, y: player.y, z: 0 },
                action: 'move'
              })
              
              // Handle recognition moments
              if (memory && Date.now() - lastRecognitionRef.current > 30000) {
                const encounters = memory.encounters || 0
                let recognitionLevel: 'first' | 'familiar' | 'nemesis' = 'first'
                let playerRecLevel: 'familiar' | 'known' | 'nemesis' = 'familiar'
                
                if (encounters > 10) {
                  recognitionLevel = 'nemesis'
                  playerRecLevel = 'nemesis'
                } else if (encounters > 5) {
                  recognitionLevel = 'familiar'
                  playerRecLevel = 'known'
                }
                
                // Trigger recognition moment
                if (encounters > 0) {
                  lastRecognitionRef.current = Date.now()
                  setRecognitionMoment({
                    active: true,
                    playerName: 'Player',
                    memories: [
                      { encounter: 'First blood...', outcome: 'You escaped barely', timestamp: '2 games ago' },
                      { encounter: 'The shallow water trick', outcome: 'I learned', timestamp: 'Last game' }
                    ],
                    level: recognitionLevel
                  })
                  
                  setPlayerRecognition({
                    level: playerRecLevel,
                    encounters: encounters
                  })
                  
                  // Trigger effects
                  psychEffectsRef.current?.screenShake(500, 15)
                  psychEffectsRef.current?.recognitionFlash()
                  psychEffectsRef.current?.setTension(0.6)
                  
                  // Achievement check
                  if (encounters === 1) {
                    achievementRef.current.trigger('first_recognition')
                  } else if (encounters > 10) {
                    achievementRef.current.trigger('nemesis_status')
                  }
                  
                  // Special commentary for recognition
                  setSharkCommentary(`I remember you... ${encounters} times we've danced this dance.`)
                }
              }
              
              // Handle pattern-based taunts
              if (pattern) {
                setPatternRecognized({
                  type: pattern.type,
                  confidence: pattern.confidence
                })
                
                predictionCountRef.current++
                
                // Generate personalized taunt
                const tauntType = pattern.type === 'hiding_spot' ? 'location' : 
                               pattern.type === 'escape_route' ? 'pattern' : 'behavior'
                const taunts = TAUNT_TEMPLATES[tauntType]
                const taunt = taunts[Math.floor(Math.random() * taunts.length)]
                  .replace('{name}', 'Player')
                
                setCurrentTaunt({
                  id: `taunt_${Date.now()}`,
                  text: taunt,
                  type: 'prediction',
                  intensity: pattern.confidence > 0.8 ? 'intense' : 'moderate'
                })
                
                // Psychological effects
                psychEffectsRef.current?.showWatchedIndicator(shark.x, shark.y - 50, pattern.confidence)
                if (pattern.confidence > 0.8) {
                  psychEffectsRef.current?.predatorVision(2000)
                }
                
                // Achievement for predictions
                if (predictionCountRef.current >= 3) {
                  achievementRef.current.trigger('predictable_prey')
                }
                
                // Clear pattern indicator after a few seconds
                setTimeout(() => setPatternRecognized(undefined), 5000)
              }
              
              // Dynamic tension based on proximity
              const distance = Math.sqrt(
                Math.pow(shark.x - player.x, 2) + 
                Math.pow(shark.y - player.y, 2)
              )
              const tension = Math.max(0, 1 - (distance / 500))
              psychEffectsRef.current?.setTension(tension * 0.5)
              
              // Heartbeat when very close
              if (distance < 150 && !achievementRef.current.hasAchievement('shark_knows_name')) {
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
          water.rect(0, waterY + (i * (app.screen.height * 0.7) / 20), app.screen.width, (app.screen.height * 0.7) / 20)
          water.fill({ color, alpha })
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }

    initGame()

    return () => {
      if (appRef.current) {
        try {
          appRef.current.destroy()
          appRef.current = null
        } catch (e) {
          console.error('Error destroying Pixi app:', e)
        }
      }
      if (psychEffectsRef.current) {
        psychEffectsRef.current.destroy()
        psychEffectsRef.current = null
      }
      // Clean up any remaining canvas elements
      if (canvasRef.current) {
        canvasRef.current.innerHTML = ''
      }
    }
  }, [])

  return (
    <div className="relative w-full h-screen">
      <div 
        ref={canvasRef} 
        className="w-full h-screen overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #4ECDC4 100%)' }}
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
          y: sharkRef.current?.y || 0 
        }}
        playerPosition={{ 
          x: playerRef.current?.x || 0, 
          y: playerRef.current?.y || 0 
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
        onComplete={() => setRecognitionMoment(prev => ({ ...prev, active: false }))}
      />
      
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
                  (playerRef.current?.stamina || 100) > 50 ? 'bg-green-500' :
                  (playerRef.current?.stamina || 100) > 25 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${playerRef.current?.stamina || 100}%` }}
              />
            </div>
          </div>
          {playerRef.current?.stamina < 25 && playerRef.current?.isInWater && (
            <div className="text-red-400 text-xs animate-pulse">⚠️ Low stamina!</div>
          )}
        </div>
      </div>
    </div>
  )
}

function checkCollision(a: any, b: any): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}