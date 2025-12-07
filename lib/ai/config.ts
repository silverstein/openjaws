import { createGateway } from "@ai-sdk/gateway"
import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"
import { openai } from "@ai-sdk/openai"

// Gateway configuration (no custom endpoint required; default is ai-gateway.vercel.sh)
const aiGatewayConfig = {
  apiKey: process.env["AI_GATEWAY_API_KEY"] || process.env["VERCEL_AI_GATEWAY_API_KEY"],
  endpoint: process.env["AI_GATEWAY_ENDPOINT"], // optional override; defaults to SDK base URL
}

// Allow overriding the model id via env; prefer current Claude 4.5 naming
const SHARK_MODEL_ID =
  process.env["NEXT_PUBLIC_SHARK_MODEL"] || process.env["SHARK_MODEL"] || "claude-4.5-sonnet"

// If a gateway key is present, use the Gateway provider (default base URL). Otherwise fall back
// to vendor SDK clients. Base URL override is optional and only needed for self-hosted gateway.
const gateway = aiGatewayConfig.apiKey
  ? createGateway({
      apiKey: aiGatewayConfig.apiKey,
      baseURL: aiGatewayConfig.endpoint,
    })
  : null

export const models = {
  // Claude 4.5 - Primary model for shark intelligence
  sharkBrain: gateway ? gateway(SHARK_MODEL_ID as string) : anthropic(SHARK_MODEL_ID as string),

  // Gemini 2.5 Flash - Cost-efficient for NPCs
  npcDialogue: gateway ? gateway("google/gemini-2.5-flash-preview") : google("gemini-2.5-flash-preview"),

  // GPT-5.1 - Backup model for complex scenarios
  complexDecisions: gateway ? gateway("openai/gpt-5.1") : openai("gpt-5.1"),

  // Commentary model (using Gemini for cost efficiency)
  commentary: gateway ? gateway("google/gemini-2.5-flash-preview") : google("gemini-2.5-flash-preview"),
} as const

// Cost-optimized model selection
export function selectModel(purpose: "shark" | "npc" | "commentary" | "complex") {
  switch (purpose) {
    case "shark":
      return models.sharkBrain
    case "npc":
      return models.npcDialogue
    case "commentary":
      return models.commentary
    case "complex":
      return models.complexDecisions
    default:
      return models.npcDialogue // Default to cheapest
  }
}

// Expose gateway config for callers that need to branch
export { aiGatewayConfig }

// Rate limiting and caching configurations
export const aiConfig = {
  maxTokens: {
    shark: 500,
    npc: 200,
    commentary: 300,
  },
  temperature: {
    shark: 0.7, // Balanced creativity
    npc: 0.8, // More varied responses
    commentary: 0.6, // More consistent narration
  },
  streaming: true,
  cacheTimeout: 60 * 1000, // 1 minute cache for similar requests
}

// Free tier and mock mode configurations
export const freeTierConfig = {
  // API call limits
  FREE_TIER_LIMIT: parseInt(process.env["NEXT_PUBLIC_FREE_TIER_LIMIT"] || "100"),
  DAILY_RESET_HOUR: 0, // Reset at midnight UTC

  // Mock mode settings
  MOCK_MODE_ENABLED: process.env["NEXT_PUBLIC_MOCK_MODE_ENABLED"] === "true",
  FORCE_MOCK_MODE: process.env["NEXT_PUBLIC_FORCE_MOCK_MODE"] === "true",

  // Cache settings
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  CACHE_SIMILARITY_THRESHOLD: 0.7, // 70% context similarity required
  MAX_CACHE_ENTRIES: 100, // Per personality/type

  // Response quality settings
  MOCK_QUALITY_THRESHOLD: 0.8, // Quality score above which to prefer cached responses
  PERSONALITY_WEIGHT: 0.8, // How much personality affects responses
  CONTEXT_WEIGHT: 0.7, // How much game context affects responses
  MEMORY_INFLUENCE: 0.6, // How much past encounters affect responses
}

// API usage tracking
export interface APIUsageStats {
  totalCalls: number
  sharkCalls: number
  npcCalls: number
  commentaryCalls: number
  lastReset: Date
  currentMode: "real" | "mock" | "cached"
}

// Initialize usage stats
export function getInitialUsageStats(): APIUsageStats {
  return {
    totalCalls: 0,
    sharkCalls: 0,
    npcCalls: 0,
    commentaryCalls: 0,
    lastReset: new Date(),
    currentMode: "real",
  }
}
