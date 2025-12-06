import { apiLogger } from "@/lib/logger"
import { type APIUsageStats, freeTierConfig, getInitialUsageStats } from "./config"
import { responseCache } from "./responseCache"

// API usage tracking (stored in memory for demo, should be persisted in production)
let apiUsageStats: APIUsageStats = getInitialUsageStats()

// Check if we should reset daily limit
export function checkDailyReset(): void {
  const now = new Date()
  const lastReset = new Date(apiUsageStats.lastReset)

  // Reset if it's been more than 24 hours
  if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
    apiUsageStats = getInitialUsageStats()
    apiLogger.info("Daily API limit reset")
  }
}

// Determine which mode to use
export function determineAIMode(): "real" | "mock" | "cached" {
  checkDailyReset()

  if (freeTierConfig.FORCE_MOCK_MODE) {
    return "mock"
  }

  if (apiUsageStats.totalCalls >= freeTierConfig.FREE_TIER_LIMIT) {
    return "mock"
  }

  // Check if we have good cached responses available
  const cacheStats = responseCache.getStats()
  if (
    cacheStats.sharkDecisions > 10 &&
    cacheStats.avgQuality > freeTierConfig.MOCK_QUALITY_THRESHOLD
  ) {
    // Randomly use cache to save API calls
    if (Math.random() < 0.3) {
      // 30% chance to use cache
      return "cached"
    }
  }

  return "real"
}

// Track API usage
export function trackAPIUsage(type: "shark" | "npc" | "commentary"): void {
  apiUsageStats.totalCalls++

  switch (type) {
    case "shark":
      apiUsageStats.sharkCalls++
      break
    case "npc":
      apiUsageStats.npcCalls++
      break
    case "commentary":
      apiUsageStats.commentaryCalls++
      break
  }

  // Log warning when approaching limit
  const remaining = freeTierConfig.FREE_TIER_LIMIT - apiUsageStats.totalCalls
  if (remaining > 0 && remaining <= 10) {
    apiLogger.warn(`Only ${remaining} API calls remaining before switching to mock mode`)
  } else if (remaining === 0) {
    apiLogger.info("API limit reached, switching to mock mode")
  }
}

// Get current usage stats
export function getAPIUsageStats(): APIUsageStats & { remaining: number } {
  checkDailyReset()
  return {
    ...apiUsageStats,
    remaining: Math.max(0, freeTierConfig.FREE_TIER_LIMIT - apiUsageStats.totalCalls),
  }
}

// Update current mode
export function updateCurrentMode(mode: "real" | "mock" | "cached"): void {
  apiUsageStats.currentMode = mode
}
