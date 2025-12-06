import type { GameContext, SharkDecision, SharkPersonality } from "./sharkBrain"

interface CachedResponse<T> {
  response: T
  context: string // Serialized context for comparison
  timestamp: number
  useCount: number
  quality: number // 0-1, how well this response was received
}

interface CacheEntry<T> {
  responses: CachedResponse<T>[]
  lastCleanup: number
}

class ResponseCache {
  private sharkDecisionCache: Map<SharkPersonality, CacheEntry<SharkDecision>> = new Map()
  private npcResponseCache: Map<string, CacheEntry<string>> = new Map()
  private tauntCache: Map<string, CacheEntry<string>> = new Map()

  // Configuration
  private readonly MAX_CACHE_SIZE = 100 // Per personality/type
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private readonly SIMILARITY_THRESHOLD = 0.7 // Context similarity required for reuse

  // Context hashing for similarity comparison
  private hashContext(context: GameContext): string {
    const simplified = {
      playerCount: context.currentPlayers.length,
      playersInWater: context.currentPlayers.filter((p) => p.isInWater).length,
      sharkHealthRange: Math.floor(context.sharkHealth / 20) * 20, // Round to nearest 20
      timeOfDay: context.timeOfDay,
      weatherCondition: context.weatherCondition,
      hasGrudgeTarget: context.memories.some((m) => m.grudgeLevel > 5),
      avgPlayerHealth:
        Math.floor(
          context.currentPlayers.reduce((sum, p) => sum + p.health, 0) /
            context.currentPlayers.length /
            10
        ) * 10,
    }
    return JSON.stringify(simplified)
  }

  // Calculate context similarity (0-1)
  private calculateSimilarity(context1: string, context2: string): number {
    try {
      const obj1 = JSON.parse(context1)
      const obj2 = JSON.parse(context2)

      let matches = 0
      let total = 0

      for (const key in obj1) {
        total++
        if (obj1[key] === obj2[key]) {
          matches++
        } else if (typeof obj1[key] === "number" && typeof obj2[key] === "number") {
          // For numeric values, consider them similar if within 20%
          const diff = Math.abs(obj1[key] - obj2[key])
          const avg = (obj1[key] + obj2[key]) / 2
          if (avg > 0 && diff / avg < 0.2) {
            matches += 0.5
          }
        }
      }

      return total > 0 ? matches / total : 0
    } catch {
      return 0
    }
  }

  // Clean expired entries
  private cleanupCache<T>(cache: CacheEntry<T>): CacheEntry<T> {
    const now = Date.now()

    if (now - cache.lastCleanup < 60000) {
      // Cleanup every minute max
      return cache
    }

    cache.responses = cache.responses
      .filter((r) => now - r.timestamp < this.CACHE_DURATION)
      .sort((a, b) => b.quality - a.quality) // Keep highest quality
      .slice(0, this.MAX_CACHE_SIZE)

    cache.lastCleanup = now
    return cache
  }

  // Store a shark decision
  cacheSharkDecision(
    personality: SharkPersonality,
    context: GameContext,
    decision: SharkDecision,
    quality: number = 0.7
  ): void {
    const entry = this.sharkDecisionCache.get(personality) || {
      responses: [],
      lastCleanup: Date.now(),
    }

    const cached: CachedResponse<SharkDecision> = {
      response: decision,
      context: this.hashContext(context),
      timestamp: Date.now(),
      useCount: 0,
      quality,
    }

    entry.responses.push(cached)
    this.sharkDecisionCache.set(personality, this.cleanupCache(entry))
  }

  // Retrieve a cached shark decision
  getCachedSharkDecision(
    personality: SharkPersonality,
    context: GameContext
  ): SharkDecision | null {
    const entry = this.sharkDecisionCache.get(personality)
    if (!entry) {
      return null
    }

    const contextHash = this.hashContext(context)
    const now = Date.now()

    // Find similar contexts
    const candidates = entry.responses.filter((r) => {
      const similarity = this.calculateSimilarity(contextHash, r.context)
      const age = now - r.timestamp
      const ageScore = 1 - age / this.CACHE_DURATION // Prefer newer

      return similarity >= this.SIMILARITY_THRESHOLD && ageScore > 0.3
    })

    if (candidates.length === 0) {
      return null
    }

    // Select best candidate based on quality, similarity, and freshness
    const selected = candidates.reduce((best, current) => {
      const currentSim = this.calculateSimilarity(contextHash, current.context)
      const bestSim = this.calculateSimilarity(contextHash, best.context)

      const currentScore =
        current.quality * 0.5 +
        currentSim * 0.3 +
        (1 - (now - current.timestamp) / this.CACHE_DURATION) * 0.2
      const bestScore =
        best.quality * 0.5 +
        bestSim * 0.3 +
        (1 - (now - best.timestamp) / this.CACHE_DURATION) * 0.2

      return currentScore > bestScore ? current : best
    })

    // Update use count
    selected.useCount++

    // Clone and modify the decision for current context
    const decision = { ...selected.response }

    // Update target if original target is no longer present
    if (decision.targetPlayerId) {
      const targetExists = context.currentPlayers.some((p) => p.id === decision.targetPlayerId)
      if (!targetExists) {
        // Find a similar target (in water, similar health)
        const playersInWater = context.currentPlayers.filter((p) => p.isInWater)
        const firstPlayerInWater = playersInWater[0]
        if (firstPlayerInWater) {
          decision.targetPlayerId = firstPlayerInWater.id
          decision.destination = firstPlayerInWater.position
        }
      }
    }

    return decision
  }

  // Cache NPC response
  cacheNPCResponse(
    npcType: string,
    trigger: string,
    response: string,
    quality: number = 0.7
  ): void {
    const key = `${npcType}:${trigger}`
    const entry = this.npcResponseCache.get(key) || {
      responses: [],
      lastCleanup: Date.now(),
    }

    const cached: CachedResponse<string> = {
      response,
      context: trigger,
      timestamp: Date.now(),
      useCount: 0,
      quality,
    }

    entry.responses.push(cached)
    this.npcResponseCache.set(key, this.cleanupCache(entry))
  }

  // Get cached NPC response
  getCachedNPCResponse(npcType: string, trigger: string): string | null {
    const key = `${npcType}:${trigger}`
    const entry = this.npcResponseCache.get(key)
    if (!entry || entry.responses.length === 0) {
      return null
    }

    // For NPC responses, we can be less strict about context matching
    // Just return a random high-quality response
    const validResponses = entry.responses.filter(
      (r) => Date.now() - r.timestamp < this.CACHE_DURATION && r.quality > 0.5
    )

    if (validResponses.length === 0) {
      return null
    }

    const selected = validResponses[Math.floor(Math.random() * validResponses.length)]
    if (!selected) return null
    selected.useCount++

    return selected.response
  }

  // Cache taunt
  cacheTaunt(
    personality: SharkPersonality,
    situation: string,
    taunt: string,
    quality: number = 0.7
  ): void {
    const key = `${personality}:${situation}`
    const entry = this.tauntCache.get(key) || {
      responses: [],
      lastCleanup: Date.now(),
    }

    const cached: CachedResponse<string> = {
      response: taunt,
      context: situation,
      timestamp: Date.now(),
      useCount: 0,
      quality,
    }

    entry.responses.push(cached)
    this.tauntCache.set(key, this.cleanupCache(entry))
  }

  // Get cached taunt
  getCachedTaunt(personality: SharkPersonality, situation: string): string | null {
    const key = `${personality}:${situation}`
    const entry = this.tauntCache.get(key)
    if (!entry || entry.responses.length === 0) {
      return null
    }

    const validResponses = entry.responses.filter(
      (r) => Date.now() - r.timestamp < this.CACHE_DURATION
    )

    if (validResponses.length === 0) {
      return null
    }

    // Weight selection by quality and inverse use count (to vary responses)
    const weights = validResponses.map((r) => r.quality * (1 / (r.useCount + 1)))
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)

    let random = Math.random() * totalWeight
    for (let i = 0; i < validResponses.length; i++) {
      const weight = weights[i] ?? 0
      const response = validResponses[i]
      random -= weight
      if (random <= 0 && response) {
        response.useCount++
        return response.response
      }
    }

    const first = validResponses[0]
    return first?.response ?? null
  }

  // Update response quality based on player feedback/behavior
  updateResponseQuality(
    type: "shark" | "npc" | "taunt",
    key: string,
    responseText: string,
    newQuality: number
  ): void {
    let entries: CachedResponse<any>[] = []

    switch (type) {
      case "shark":
        // For shark decisions, we need to search all personalities
        for (const [_personality, entry] of this.sharkDecisionCache) {
          entries = entries.concat(entry.responses)
        }
        break
      case "npc": {
        const npcEntry = this.npcResponseCache.get(key)
        if (npcEntry) {
          entries = npcEntry.responses
        }
        break
      }
      case "taunt": {
        const tauntEntry = this.tauntCache.get(key)
        if (tauntEntry) {
          entries = tauntEntry.responses
        }
        break
      }
    }

    // Find and update the response
    const response = entries.find(
      (r) => JSON.stringify(r.response) === responseText || r.response === responseText
    )

    if (response) {
      // Weighted average with existing quality
      response.quality =
        (response.quality * response.useCount + newQuality) / (response.useCount + 1)
    }
  }

  // Get cache statistics
  getStats() {
    const stats = {
      sharkDecisions: 0,
      npcResponses: 0,
      taunts: 0,
      totalUses: 0,
      avgQuality: 0,
    }

    let totalQuality = 0
    let totalResponses = 0

    for (const [_, entry] of this.sharkDecisionCache) {
      stats.sharkDecisions += entry.responses.length
      entry.responses.forEach((r) => {
        stats.totalUses += r.useCount
        totalQuality += r.quality
        totalResponses++
      })
    }

    for (const [_, entry] of this.npcResponseCache) {
      stats.npcResponses += entry.responses.length
      entry.responses.forEach((r) => {
        stats.totalUses += r.useCount
        totalQuality += r.quality
        totalResponses++
      })
    }

    for (const [_, entry] of this.tauntCache) {
      stats.taunts += entry.responses.length
      entry.responses.forEach((r) => {
        stats.totalUses += r.useCount
        totalQuality += r.quality
        totalResponses++
      })
    }

    stats.avgQuality = totalResponses > 0 ? totalQuality / totalResponses : 0

    return stats
  }

  // Clear all caches
  clear(): void {
    this.sharkDecisionCache.clear()
    this.npcResponseCache.clear()
    this.tauntCache.clear()
  }
}

// Export singleton instance
export const responseCache = new ResponseCache()
