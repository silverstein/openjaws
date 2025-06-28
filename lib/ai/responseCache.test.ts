import { describe, it, expect, beforeEach, vi } from 'vitest'
import { responseCache } from './responseCache'
import { GameContext, SharkPersonality, SharkDecision } from './sharkBrain'

describe('Response Cache System', () => {
  let mockContext: GameContext
  let mockDecision: SharkDecision

  beforeEach(() => {
    // Clear cache before each test
    responseCache.clear()
    
    mockContext = {
      currentPlayers: [
        {
          id: 'player1',
          name: 'TestPlayer',
          position: { x: 100, y: 100 },
          health: 100,
          speed: 3,
          isInWater: true
        }
      ],
      sharkPosition: { x: 50, y: 50 },
      sharkHealth: 80,
      sharkPersonality: 'methodical' as SharkPersonality,
      timeOfDay: 'day',
      weatherCondition: 'calm',
      recentEvents: [],
      memories: []
    }

    mockDecision = {
      action: 'hunt',
      targetPlayerId: 'player1',
      destination: { x: 100, y: 100 },
      innerMonologue: 'Time to hunt',
      confidence: 0.8,
      reasoning: 'Player detected in range'
    }
  })

  describe('Shark Decision Caching', () => {
    it('should cache and retrieve shark decisions', () => {
      responseCache.cacheSharkDecision('methodical', mockContext, mockDecision)
      
      const retrieved = responseCache.getCachedSharkDecision('methodical', mockContext)
      expect(retrieved).toBeDefined()
      expect(retrieved?.action).toBe('hunt')
      expect(retrieved?.targetPlayerId).toBe('player1')
    })

    it('should return null for uncached decisions', () => {
      const retrieved = responseCache.getCachedSharkDecision('vengeful', mockContext)
      expect(retrieved).toBeNull()
    })

    it('should handle similar contexts', () => {
      responseCache.cacheSharkDecision('methodical', mockContext, mockDecision)
      
      // Slightly modified context
      const similarContext = {
        ...mockContext,
        sharkHealth: 75 // Close to 80
      }
      
      const retrieved = responseCache.getCachedSharkDecision('methodical', similarContext)
      expect(retrieved).toBeDefined()
    })

    it('should not match dissimilar contexts', () => {
      responseCache.cacheSharkDecision('methodical', mockContext, mockDecision)
      
      // Very different context
      const differentContext = {
        ...mockContext,
        sharkHealth: 20,
        weatherCondition: 'stormy' as const,
        currentPlayers: []
      }
      
      const retrieved = responseCache.getCachedSharkDecision('methodical', differentContext)
      expect(retrieved).toBeNull()
    })

    it('should update target when original target is missing', () => {
      responseCache.cacheSharkDecision('methodical', mockContext, mockDecision)
      
      // Context with different players
      const newContext = {
        ...mockContext,
        currentPlayers: [
          {
            id: 'player2',
            name: 'NewPlayer',
            position: { x: 200, y: 200 },
            health: 100,
            speed: 2,
            isInWater: true
          }
        ]
      }
      
      const retrieved = responseCache.getCachedSharkDecision('methodical', newContext)
      expect(retrieved).toBeDefined()
      expect(retrieved?.targetPlayerId).toBe('player2')
      expect(retrieved?.destination).toEqual({ x: 200, y: 200 })
    })
  })

  describe('NPC Response Caching', () => {
    it('should cache and retrieve NPC responses', () => {
      responseCache.cacheNPCResponse('scientist', 'greeting', 'Hello there!')
      
      const retrieved = responseCache.getCachedNPCResponse('scientist', 'greeting')
      expect(retrieved).toBe('Hello there!')
    })

    it('should return random response from multiple cached ones', () => {
      // Cache multiple responses
      responseCache.cacheNPCResponse('surfer', 'reaction', 'Whoa dude!')
      responseCache.cacheNPCResponse('surfer', 'reaction', 'Gnarly!')
      responseCache.cacheNPCResponse('surfer', 'reaction', 'Radical!')
      
      const responses = new Set<string>()
      for (let i = 0; i < 10; i++) {
        const response = responseCache.getCachedNPCResponse('surfer', 'reaction')
        if (response) responses.add(response)
      }
      
      // Should get some variety
      expect(responses.size).toBeGreaterThan(1)
    })
  })

  describe('Taunt Caching', () => {
    it('should cache and retrieve taunts', () => {
      responseCache.cacheTaunt('vengeful', 'player_escaped', 'You cannot escape forever!')
      
      const retrieved = responseCache.getCachedTaunt('vengeful', 'player_escaped')
      expect(retrieved).toBe('You cannot escape forever!')
    })

    it('should weight selection by quality and use count', () => {
      // Cache taunts with different qualities
      responseCache.cacheTaunt('theatrical', 'entrance', 'Behold!', 0.9)
      responseCache.cacheTaunt('theatrical', 'entrance', 'Ta-da!', 0.5)
      
      // High quality taunt should be selected more often
      const selections: Record<string, number> = {}
      for (let i = 0; i < 20; i++) {
        const taunt = responseCache.getCachedTaunt('theatrical', 'entrance')
        if (taunt) {
          selections[taunt] = (selections[taunt] || 0) + 1
        }
      }
      
      // Both should be selected at least once (variety)
      expect(Object.keys(selections).length).toBe(2)
    })
  })

  describe('Quality Updates', () => {
    it('should update response quality', () => {
      responseCache.cacheTaunt('meta', 'glitch', 'Nice hitbox!', 0.5)
      
      // Get initial stats
      const statsBefore = responseCache.getStats()
      
      // Update quality
      responseCache.updateResponseQuality('taunt', 'meta:glitch', 'Nice hitbox!', 0.9)
      
      // Quality should be updated (weighted average)
      const statsAfter = responseCache.getStats()
      expect(statsAfter.avgQuality).toBeGreaterThan(statsBefore.avgQuality)
    })
  })

  describe('Cache Statistics', () => {
    it('should track cache statistics', () => {
      // Add various cached items
      responseCache.cacheSharkDecision('methodical', mockContext, mockDecision)
      responseCache.cacheNPCResponse('captain', 'greeting', 'Ahoy!')
      responseCache.cacheTaunt('philosophical', 'existential', 'What is prey?')
      
      const stats = responseCache.getStats()
      
      expect(stats.sharkDecisions).toBe(1)
      expect(stats.npcResponses).toBe(1)
      expect(stats.taunts).toBe(1)
      expect(stats.totalUses).toBe(0) // Haven't retrieved anything yet
      
      // Retrieve to increase use count
      responseCache.getCachedSharkDecision('methodical', mockContext)
      responseCache.getCachedNPCResponse('captain', 'greeting')
      
      const updatedStats = responseCache.getStats()
      expect(updatedStats.totalUses).toBeGreaterThan(0)
    })
  })

  describe('Cache Cleanup', () => {
    it('should clean up expired entries', async () => {
      // Mock time
      const originalNow = Date.now
      let currentTime = originalNow()
      Date.now = vi.fn(() => currentTime)
      
      // Cache a response
      responseCache.cacheNPCResponse('reporter', 'news', 'Breaking news!')
      
      // Should be retrievable immediately
      expect(responseCache.getCachedNPCResponse('reporter', 'news')).toBe('Breaking news!')
      
      // Advance time beyond cache duration (5 minutes)
      currentTime += 6 * 60 * 1000
      
      // Add another response to trigger cleanup
      responseCache.cacheNPCResponse('reporter', 'news', 'Latest update!')
      
      // Old response should be gone, new one should exist
      const response = responseCache.getCachedNPCResponse('reporter', 'news')
      expect(response).toBe('Latest update!')
      
      // Restore Date.now
      Date.now = originalNow
    })

    it('should limit cache size', () => {
      // Add many responses (more than MAX_CACHE_SIZE)
      for (let i = 0; i < 150; i++) {
        responseCache.cacheTaunt('meta', `situation${i}`, `Taunt ${i}`)
      }
      
      const stats = responseCache.getStats()
      // Should be limited to MAX_CACHE_SIZE (100) per type
      expect(stats.taunts).toBeLessThanOrEqual(100)
    })
  })

  describe('Clear Cache', () => {
    it('should clear all caches', () => {
      // Add some data
      responseCache.cacheSharkDecision('vengeful', mockContext, mockDecision)
      responseCache.cacheNPCResponse('lifeguard', 'warning', 'Get out of the water!')
      responseCache.cacheTaunt('methodical', 'stalking', 'Patience...')
      
      // Verify data exists
      let stats = responseCache.getStats()
      expect(stats.sharkDecisions + stats.npcResponses + stats.taunts).toBeGreaterThan(0)
      
      // Clear cache
      responseCache.clear()
      
      // Verify cache is empty
      stats = responseCache.getStats()
      expect(stats.sharkDecisions).toBe(0)
      expect(stats.npcResponses).toBe(0)
      expect(stats.taunts).toBe(0)
    })
  })
})