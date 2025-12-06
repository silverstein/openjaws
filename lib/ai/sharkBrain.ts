import { generateText, streamText } from "ai"
import { determineAIMode, trackAPIUsage, updateCurrentMode } from "./apiTracking"
import { aiConfig, models } from "./config"
import {
  generateMockSharkDecision,
  generateMockTaunt,
  streamMockSharkThoughts,
} from "./mockResponses"
import { responseCache } from "./responseCache"

export type SharkPersonality =
  | "methodical" // Strategic hunter, patterns and patience
  | "theatrical" // Dramatic flair, jump scares
  | "vengeful" // Remembers past defeats, targets specific players
  | "philosophical" // Contemplates existence while hunting
  | "meta" // Aware it's in a game, breaks fourth wall

export interface SharkMemory {
  playerId: string
  playerName: string
  encounters: number
  lastSeen: Date
  playerPattern: "aggressive" | "defensive" | "erratic" | "predictable"
  grudgeLevel: number // 0-10, increases with player success
}

export interface GameContext {
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
  sharkPersonality: SharkPersonality
  timeOfDay: "dawn" | "day" | "dusk" | "night"
  weatherCondition: "calm" | "stormy" | "foggy"
  recentEvents: string[]
  memories: SharkMemory[]
}

export interface SharkDecision {
  action: "hunt" | "stalk" | "ambush" | "retreat" | "taunt" | "investigate"
  targetPlayerId?: string
  destination: { x: number; y: number }
  innerMonologue: string
  confidence: number // 0-1
  reasoning: string
}

const personalityPrompts: Record<SharkPersonality, string> = {
  methodical: `You are a calculating predator. You study patterns, wait for the perfect moment, and strike with precision. Efficiency over spectacle.`,
  theatrical: `You are a showman of the seas. Every attack is a performance, every kill a crescendo. You love dramatic entrances and leaving survivors to tell the tale.`,
  vengeful: `You never forget a face or a slight. Those who escape you once become your obsession. You keep score and hold grudges.`,
  philosophical: `You ponder the nature of predation while you hunt. Are you the villain, or merely playing your role in nature's theater? Your kills are accompanied by existential musings.`,
  meta: `You know you're in a video game. You comment on player strategies, reference other shark media, and occasionally break the fourth wall.`,
}

// Re-export for backward compatibility
export { getAPIUsageStats } from "./apiTracking"

export async function makeSharkDecision(context: GameContext): Promise<SharkDecision> {
  const mode = determineAIMode()
  updateCurrentMode(mode)

  console.log(`[SharkBrain] Making decision in ${mode} mode`)

  // Try cached response first
  if (mode === "cached" || mode === "mock") {
    const cached = responseCache.getCachedSharkDecision(context.sharkPersonality, context)
    if (cached) {
      console.log("[SharkBrain] Using cached decision")
      return cached
    }
  }

  // Use mock response if in mock mode or API limit reached
  if (mode === "mock") {
    console.log("[SharkBrain] Using mock AI response")
    const mockDecision = generateMockSharkDecision(context)
    // Cache the mock response for consistency
    responseCache.cacheSharkDecision(context.sharkPersonality, context, mockDecision, 0.7)
    return mockDecision
  }

  // Real AI call
  const prompt = `You are an intelligent shark with the following personality: ${personalityPrompts[context.sharkPersonality]}

Current situation:
- Your health: ${context.sharkHealth}%
- Your position: (${context.sharkPosition.x}, ${context.sharkPosition.y})
- Time: ${context.timeOfDay}, Weather: ${context.weatherCondition}
- Recent events: ${context.recentEvents.join(", ")}

Players in the game:
${context.currentPlayers
  .map(
    (p) =>
      `- ${p.name} (ID: ${p.id}): Position (${p.position.x}, ${p.position.y}), Health: ${p.health}, ${p.isInWater ? "IN WATER" : "ON BEACH"}, Speed: ${p.speed}`
  )
  .join("\n")}

Your memories of these players:
${context.memories
  .map(
    (m) =>
      `- ${m.playerName}: Encountered ${m.encounters} times, Pattern: ${m.playerPattern}, Grudge Level: ${m.grudgeLevel}/10`
  )
  .join("\n")}

Based on your personality and the current situation, decide your next action. Consider:
1. Which player to target (if any)
2. Your tactical approach
3. Your current health and positioning
4. Player patterns and your memories

Respond with a JSON object containing:
- action: your chosen action
- targetPlayerId: ID of player to target (if applicable)
- destination: {x, y} coordinates to move to
- innerMonologue: your shark's thoughts (1-2 sentences, in character)
- confidence: how confident you are in this decision (0-1)
- reasoning: tactical explanation for this decision`

  try {
    trackAPIUsage("shark")

    // Debug: Check if model is properly initialized
    if (!models.sharkBrain) {
      console.error("[SharkBrain] Model not initialized!")
      throw new Error("Shark brain model not initialized")
    }

    console.log("[SharkBrain] Calling generateText with model:", models.sharkBrain.modelId)

    const result = await generateText({
      model: models.sharkBrain,
      prompt,
      temperature: aiConfig.temperature.shark,
      maxOutputTokens: aiConfig.maxTokens.shark, // v5 uses maxOutputTokens instead of maxTokens
    })

    // Check if result has the expected structure
    if (!result || typeof result.text !== "string") {
      console.error("Invalid generateText result:", result)
      throw new Error("Invalid AI response structure")
    }

    const decision = JSON.parse(result.text)

    // Cache the real AI response
    responseCache.cacheSharkDecision(context.sharkPersonality, context, decision, 0.9)

    return decision
  } catch (error) {
    console.error("Failed to parse shark decision:", error)
    // Fallback to mock response
    const mockDecision = generateMockSharkDecision(context)
    responseCache.cacheSharkDecision(context.sharkPersonality, context, mockDecision, 0.5)
    return mockDecision
  }
}

export async function* streamSharkThoughts(
  context: GameContext,
  recentAction: string
): AsyncGenerator<string> {
  const mode = determineAIMode()

  // Use mock thoughts if in mock mode
  if (mode === "mock" || (mode === "cached" && Math.random() < 0.5)) {
    console.log(`[SharkBrain] Streaming thoughts in ${mode} mode`)
    yield* streamMockSharkThoughts(context, recentAction)
    return
  }

  const prompt = `You are a shark with the personality: ${personalityPrompts[context.sharkPersonality]}

You just performed this action: ${recentAction}

Current state:
- Health: ${context.sharkHealth}%
- Players nearby: ${context.currentPlayers
    .filter((p) => {
      const distance = Math.sqrt(
        (p.position.x - context.sharkPosition.x) ** 2 +
          (p.position.y - context.sharkPosition.y) ** 2
      )
      return distance < 200
    })
    .map((p) => p.name)
    .join(", ")}

Stream your inner thoughts as you ${recentAction}. Stay in character with your personality. Be concise but flavorful.`

  try {
    trackAPIUsage("shark")

    const stream = await streamText({
      model: models.sharkBrain,
      prompt,
      temperature: aiConfig.temperature.shark + 0.1, // Slightly more creative for thoughts
      maxOutputTokens: 150, // v5 uses maxOutputTokens instead of maxTokens
    })

    for await (const chunk of stream.textStream) {
      yield chunk
    }
  } catch (error) {
    console.error("Failed to stream shark thoughts:", error)
    // Fallback to mock thoughts
    yield* streamMockSharkThoughts(context, recentAction)
  }
}

export function updateSharkMemory(
  currentMemories: SharkMemory[],
  playerId: string,
  playerName: string,
  event: "encounter" | "escape" | "damaged_shark" | "killed"
): SharkMemory[] {
  const existingMemory = currentMemories.find((m) => m.playerId === playerId)

  if (existingMemory) {
    const updated = { ...existingMemory }
    updated.encounters++
    updated.lastSeen = new Date()

    // Update grudge level based on event
    switch (event) {
      case "escape":
        updated.grudgeLevel = Math.min(10, updated.grudgeLevel + 2)
        break
      case "damaged_shark":
        updated.grudgeLevel = Math.min(10, updated.grudgeLevel + 3)
        break
      case "killed":
        updated.grudgeLevel = Math.max(0, updated.grudgeLevel - 1)
        break
    }

    return currentMemories.map((m) => (m.playerId === playerId ? updated : m))
  } else {
    // New player memory
    const newMemory: SharkMemory = {
      playerId,
      playerName,
      encounters: 1,
      lastSeen: new Date(),
      playerPattern: "predictable", // Will be updated over time
      grudgeLevel: event === "damaged_shark" ? 3 : 0,
    }

    return [...currentMemories, newMemory]
  }
}

export function analyzePlayerPattern(
  recentPositions: Array<{ x: number; y: number; timestamp: number }>
): SharkMemory["playerPattern"] {
  if (recentPositions.length < 3) {
    return "predictable"
  }

  // Calculate movement variance
  const movements = recentPositions.slice(1).map((pos, i) => {
    const prev = recentPositions[i]!
    return {
      dx: pos.x - prev.x,
      dy: pos.y - prev.y,
      dt: pos.timestamp - prev.timestamp,
    }
  })

  const avgSpeed =
    movements.reduce((sum, m) => sum + Math.sqrt(m.dx * m.dx + m.dy * m.dy) / m.dt, 0) /
    movements.length

  const speedVariance =
    movements.reduce((sum, m) => {
      const speed = Math.sqrt(m.dx * m.dx + m.dy * m.dy) / m.dt
      return sum + (speed - avgSpeed) ** 2
    }, 0) / movements.length

  // Classify based on movement patterns
  if (speedVariance > 100) {
    return "erratic"
  }
  if (avgSpeed > 5) {
    return "aggressive"
  }
  if (avgSpeed < 2) {
    return "defensive"
  }
  return "predictable"
}

// Generate contextual taunts
export async function generateSharkTaunt(context: GameContext, trigger: string): Promise<string> {
  const mode = determineAIMode()

  // Check cache first
  const cached = responseCache.getCachedTaunt(context.sharkPersonality, trigger)
  if (cached && Math.random() < 0.7) {
    // 70% chance to use cache
    console.log("[SharkBrain] Using cached taunt")
    return cached
  }

  // Use mock taunt if in mock mode
  if (mode === "mock") {
    console.log("[SharkBrain] Using mock taunt")
    const taunt = generateMockTaunt(context, trigger)
    responseCache.cacheTaunt(context.sharkPersonality, trigger, taunt, 0.7)
    return taunt
  }

  // Real AI taunt generation
  const prompt = `You are a ${context.sharkPersonality} shark. Generate a short, menacing taunt based on this trigger: ${trigger}
  
Current context:
- Your health: ${context.sharkHealth}%
- Players in water: ${context.currentPlayers.filter((p) => p.isInWater).length}
- Time: ${context.timeOfDay}

Keep it under 10 words. Be creative and personality-appropriate.`

  try {
    trackAPIUsage("shark")

    const { text } = await generateText({
      model: models.sharkBrain,
      prompt,
      temperature: aiConfig.temperature.shark + 0.2, // More creative for taunts
      maxOutputTokens: 50, // v5 uses maxOutputTokens
    })

    const taunt = text.trim()
    responseCache.cacheTaunt(context.sharkPersonality, trigger, taunt, 0.9)
    return taunt
  } catch (error) {
    console.error("Failed to generate taunt:", error)
    // Fallback to mock taunt
    const mockTaunt = generateMockTaunt(context, trigger)
    responseCache.cacheTaunt(context.sharkPersonality, trigger, mockTaunt, 0.5)
    return mockTaunt
  }
}
