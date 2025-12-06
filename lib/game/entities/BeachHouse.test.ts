import { describe, it, expect, beforeEach, vi } from "vitest"
import { BeachHouse, createBeachHouse } from "./BeachHouse"

describe("BeachHouse", () => {
  let beachHouse: BeachHouse
  const playerId = "test-player-1"

  beforeEach(() => {
    beachHouse = new BeachHouse(100, 100)
    vi.useFakeTimers()
  })

  describe("Initialization", () => {
    it("should create a beach house at the specified position", () => {
      expect(beachHouse.x).toBe(100)
      expect(beachHouse.y).toBe(100)
      expect(beachHouse.container).toBeDefined()
    })

    it("should have no players inside initially", () => {
      expect(beachHouse.getPlayersInside()).toHaveLength(0)
      expect(beachHouse.isPlayerInside(playerId)).toBe(false)
    })

    it("should have empty drawer storage initially", () => {
      expect(beachHouse.getStoredItems()).toHaveLength(0)
      expect(beachHouse.hasDrawerSpace()).toBe(true)
    })
  })

  describe("Door Interaction", () => {
    it("should detect when player is near door", () => {
      // Door is at x + 20, y + 30 from center
      const doorX = 120
      const doorY = 130

      // Player far from door
      beachHouse.update(1, 500, 500, playerId)
      expect(beachHouse.canEnter(playerId)).toBe(false)

      // Player near door (within 80px radius)
      beachHouse.update(1, doorX + 50, doorY, playerId)
      expect(beachHouse.canEnter(playerId)).toBe(true)
    })

    it("should allow player to enter when near door", () => {
      // Position player near door
      beachHouse.update(1, 120, 130, playerId)

      expect(beachHouse.canEnter(playerId)).toBe(true)
      beachHouse.enter(playerId)

      expect(beachHouse.isPlayerInside(playerId)).toBe(true)
      expect(beachHouse.getPlayersInside()).toContain(playerId)
    })

    it("should allow player to exit", () => {
      beachHouse.update(1, 120, 130, playerId)
      beachHouse.enter(playerId)
      expect(beachHouse.isPlayerInside(playerId)).toBe(true)

      beachHouse.exit(playerId)
      expect(beachHouse.isPlayerInside(playerId)).toBe(false)
    })

    it("should not allow entry when player is far from door", () => {
      beachHouse.update(1, 500, 500, playerId)
      expect(beachHouse.canEnter(playerId)).toBe(false)

      beachHouse.enter(playerId)
      expect(beachHouse.isPlayerInside(playerId)).toBe(false)
    })

    it("should not allow entry when already inside", () => {
      beachHouse.update(1, 120, 130, playerId)
      beachHouse.enter(playerId)
      expect(beachHouse.isPlayerInside(playerId)).toBe(true)

      expect(beachHouse.canEnter(playerId)).toBe(false)
    })
  })

  describe("Sleep Mechanic", () => {
    beforeEach(() => {
      // Put player inside house
      beachHouse.update(1, 120, 130, playerId)
      beachHouse.enter(playerId)
    })

    it("should allow player to sleep when inside", async () => {
      const sleepPromise = beachHouse.useBed(playerId)
      expect(beachHouse.isSleeping(playerId)).toBe(true)

      // Fast-forward 3 seconds
      await vi.advanceTimersByTimeAsync(3000)

      const result = await sleepPromise
      expect(result.success).toBe(true)
      expect(result.hp).toBe(100)
      expect(result.stamina).toBe(100)
      expect(beachHouse.isSleeping(playerId)).toBe(false)
    })

    it("should not allow sleep when not inside", async () => {
      beachHouse.exit(playerId)

      const result = await beachHouse.useBed(playerId)
      expect(result.success).toBe(false)
      expect(result.hp).toBe(0)
      expect(result.stamina).toBe(0)
    })

    it("should enforce sleep cooldown", async () => {
      // First sleep
      const firstSleep = beachHouse.useBed(playerId)
      await vi.advanceTimersByTimeAsync(3000)
      await firstSleep

      // Try to sleep again immediately
      const secondSleep = await beachHouse.useBed(playerId)
      expect(secondSleep.success).toBe(false)

      // Check cooldown
      const cooldown = beachHouse.getRemainingCooldown(playerId)
      expect(cooldown).toBeGreaterThan(0)
      expect(cooldown).toBeLessThanOrEqual(60000) // 60 seconds max
    })

    it("should allow sleep after cooldown expires", async () => {
      // First sleep
      const firstSleep = beachHouse.useBed(playerId)
      await vi.advanceTimersByTimeAsync(3000)
      await firstSleep

      // Fast-forward past cooldown (60 seconds)
      await vi.advanceTimersByTimeAsync(60000)

      // Should be able to sleep again
      const secondSleep = beachHouse.useBed(playerId)
      expect(beachHouse.isSleeping(playerId)).toBe(true)

      await vi.advanceTimersByTimeAsync(3000)
      const result = await secondSleep
      expect(result.success).toBe(true)
    })

    it("should not allow multiple simultaneous sleeps", async () => {
      const firstSleep = beachHouse.useBed(playerId)
      expect(beachHouse.isSleeping(playerId)).toBe(true)

      const secondSleep = await beachHouse.useBed(playerId)
      expect(secondSleep.success).toBe(false)

      await vi.advanceTimersByTimeAsync(3000)
      await firstSleep
    })

    it("should track sleep progress", () => {
      beachHouse.useBed(playerId)

      // At start
      expect(beachHouse.getSleepProgress(playerId)).toBe(0)

      // Update with delta (simulate 1 second passing)
      beachHouse.update(60, 120, 130, playerId) // ~1000ms at 60fps
      expect(beachHouse.getSleepProgress(playerId)).toBeGreaterThan(0)
      expect(beachHouse.getSleepProgress(playerId)).toBeLessThan(1)
    })

    it("should stop sleeping when player exits", async () => {
      const sleepPromise = beachHouse.useBed(playerId)
      expect(beachHouse.isSleeping(playerId)).toBe(true)

      beachHouse.exit(playerId)
      expect(beachHouse.isSleeping(playerId)).toBe(false)

      // Sleep should still complete but player is no longer inside
      await vi.advanceTimersByTimeAsync(3000)
      await sleepPromise
    })
  })

  describe("Drawer Storage", () => {
    it("should allow storing fish items", () => {
      const stored = beachHouse.storeItem("tuna")
      expect(stored).toBe(true)
      expect(beachHouse.getStoredItems()).toHaveLength(1)
      expect(beachHouse.getStoredItems()[0]).toBe("tuna")
    })

    it("should allow storing multiple items", () => {
      beachHouse.storeItem("sardine")
      beachHouse.storeItem("mackerel")
      beachHouse.storeItem("tuna")

      const items = beachHouse.getStoredItems()
      expect(items).toHaveLength(3)
      expect(items).toEqual(["sardine", "mackerel", "tuna"])
    })

    it("should enforce drawer capacity (6 items)", () => {
      // Fill drawer to capacity
      for (let i = 0; i < 6; i++) {
        expect(beachHouse.storeItem("sardine")).toBe(true)
      }

      expect(beachHouse.hasDrawerSpace()).toBe(false)

      // Try to add one more
      const stored = beachHouse.storeItem("tuna")
      expect(stored).toBe(false)
      expect(beachHouse.getStoredItems()).toHaveLength(6)
    })

    it("should allow retrieving items by index", () => {
      beachHouse.storeItem("sardine")
      beachHouse.storeItem("mackerel")
      beachHouse.storeItem("tuna")

      const item = beachHouse.retrieveItem(1) // Get mackerel
      expect(item).toBe("mackerel")
      expect(beachHouse.getStoredItems()).toHaveLength(2)
      expect(beachHouse.getStoredItems()).toEqual(["sardine", "tuna"])
    })

    it("should return null for invalid index", () => {
      beachHouse.storeItem("sardine")

      expect(beachHouse.retrieveItem(-1)).toBeNull()
      expect(beachHouse.retrieveItem(5)).toBeNull()
      expect(beachHouse.getStoredItems()).toHaveLength(1) // No change
    })

    it("should free up space after retrieving items", () => {
      // Fill drawer
      for (let i = 0; i < 6; i++) {
        beachHouse.storeItem("sardine")
      }
      expect(beachHouse.hasDrawerSpace()).toBe(false)

      // Remove one item
      beachHouse.retrieveItem(0)
      expect(beachHouse.hasDrawerSpace()).toBe(true)

      // Can store again
      expect(beachHouse.storeItem("tuna")).toBe(true)
    })

    it("should return a copy of stored items array", () => {
      beachHouse.storeItem("sardine")
      beachHouse.storeItem("mackerel")

      const items1 = beachHouse.getStoredItems()
      const items2 = beachHouse.getStoredItems()

      expect(items1).toEqual(items2)
      expect(items1).not.toBe(items2) // Different array instances
    })
  })

  describe("Multiple Players", () => {
    const player1 = "player-1"
    const player2 = "player-2"

    it("should track multiple players inside", () => {
      beachHouse.update(1, 120, 130, player1)
      beachHouse.enter(player1)

      beachHouse.update(1, 120, 130, player2)
      beachHouse.enter(player2)

      expect(beachHouse.getPlayersInside()).toHaveLength(2)
      expect(beachHouse.isPlayerInside(player1)).toBe(true)
      expect(beachHouse.isPlayerInside(player2)).toBe(true)
    })

    it("should maintain separate sleep cooldowns per player", async () => {
      // Both players enter
      beachHouse.update(1, 120, 130, player1)
      beachHouse.enter(player1)
      beachHouse.update(1, 120, 130, player2)
      beachHouse.enter(player2)

      // Player 1 sleeps
      const sleep1 = beachHouse.useBed(player1)
      await vi.advanceTimersByTimeAsync(3000)
      await sleep1

      // Player 1 has cooldown
      expect(beachHouse.getRemainingCooldown(player1)).toBeGreaterThan(0)

      // Player 2 has no cooldown
      expect(beachHouse.getRemainingCooldown(player2)).toBe(0)

      // Player 2 can still sleep
      const sleep2 = beachHouse.useBed(player2)
      expect(beachHouse.isSleeping(player2)).toBe(true)
      await vi.advanceTimersByTimeAsync(3000)
      await sleep2
    })
  })

  describe("Position Helpers", () => {
    it("should return correct house position", () => {
      const pos = beachHouse.getPosition()
      expect(pos.x).toBe(100)
      expect(pos.y).toBe(100)
    })

    it("should return correct door position", () => {
      const doorPos = beachHouse.getDoorPosition()
      expect(doorPos.x).toBe(120) // x + 20
      expect(doorPos.y).toBe(130) // y + 30
    })

    it("should detect when near door", () => {
      beachHouse.update(1, 500, 500, playerId)
      expect(beachHouse.isNearDoor()).toBe(false)

      beachHouse.update(1, 120, 130, playerId)
      expect(beachHouse.isNearDoor()).toBe(true)
    })
  })

  describe("Factory Function", () => {
    it("should create beach house in upper-left area", () => {
      const house = createBeachHouse(1920, 1080)

      expect(house.x).toBe(120)
      expect(house.y).toBe(1080 * 0.15) // 15% down from top
    })
  })

  describe("Update Loop", () => {
    it("should update animation time", () => {
      const initialTime = beachHouse["animationTime"]

      beachHouse.update(1, 100, 100, playerId)
      expect(beachHouse["animationTime"]).toBeGreaterThan(initialTime)
    })

    it("should update door proximity detection", () => {
      // Far from door
      beachHouse.update(1, 500, 500, playerId)
      expect(beachHouse.isNearDoor()).toBe(false)

      // Move near door
      beachHouse.update(1, 120, 130, playerId)
      expect(beachHouse.isNearDoor()).toBe(true)

      // Move away
      beachHouse.update(1, 500, 500, playerId)
      expect(beachHouse.isNearDoor()).toBe(false)
    })

    it("should update sleeping player progress", () => {
      beachHouse.update(1, 120, 130, playerId)
      beachHouse.enter(playerId)
      beachHouse.useBed(playerId)

      const initialProgress = beachHouse.getSleepProgress(playerId)

      // Simulate time passing
      for (let i = 0; i < 30; i++) {
        beachHouse.update(1, 120, 130, playerId) // 30 frames
      }

      const newProgress = beachHouse.getSleepProgress(playerId)
      expect(newProgress).toBeGreaterThan(initialProgress)
    })
  })
})
