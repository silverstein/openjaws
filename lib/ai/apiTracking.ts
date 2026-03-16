import { apiLogger } from "@/lib/logger"
import { type APIUsageStats, freeTierConfig, getInitialUsageStats } from "./config"
import { responseCache } from "./responseCache"

const STORAGE_KEY = "openjaws_api_usage"

interface StoredUsageStats {
  totalCalls: number
  sharkCalls: number
  npcCalls: number
  commentaryCalls: number
  lastReset: string
  currentMode: "real" | "mock" | "cached"
}

function saveToStorage(stats: APIUsageStats): void {
  try {
    const data: StoredUsageStats = {
      totalCalls: stats.totalCalls,
      sharkCalls: stats.sharkCalls,
      npcCalls: stats.npcCalls,
      commentaryCalls: stats.commentaryCalls,
      lastReset: stats.lastReset.toISOString(),
      currentMode: stats.currentMode,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable (SSR, private browsing) — fall back to in-memory only
  }
}

function loadFromStorage(): APIUsageStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getInitialUsageStats()

    const data: StoredUsageStats = JSON.parse(raw)
    return {
      totalCalls: data.totalCalls ?? 0,
      sharkCalls: data.sharkCalls ?? 0,
      npcCalls: data.npcCalls ?? 0,
      commentaryCalls: data.commentaryCalls ?? 0,
      lastReset: new Date(data.lastReset),
      currentMode: data.currentMode ?? "real",
    }
  } catch {
    return getInitialUsageStats()
  }
}

// Load persisted stats on module init, fall back to fresh stats if unavailable
let apiUsageStats: APIUsageStats =
  typeof window !== "undefined" ? loadFromStorage() : getInitialUsageStats()

// Check if we should reset daily limit
export function checkDailyReset(): void {
  const now = new Date()
  const lastReset = new Date(apiUsageStats.lastReset)

  // Reset if it's been more than 24 hours
  if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
    apiUsageStats = getInitialUsageStats()
    saveToStorage(apiUsageStats)
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

  saveToStorage(apiUsageStats)

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
  saveToStorage(apiUsageStats)
}
