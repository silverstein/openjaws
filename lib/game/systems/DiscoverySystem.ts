/**
 * DiscoverySystem — Contextual tutorial hints for young players
 * Shows each hint once per session when the player is near a relevant entity.
 */

export interface DiscoveryHint {
  id: string
  text: string
  emoji: string
  /** Check function — returns true when the hint should show */
  condition: (state: DiscoveryState) => boolean
}

export interface DiscoveryState {
  playerX: number
  playerY: number
  playerInWater: boolean
  playerHP: number
  sharkDistance: number
  nearHarpoonStation: boolean
  nearNPC: boolean
  nearFishMarket: boolean
  nearBoat: boolean
  nearBeachHouse: boolean
  nearIceCreamStand: boolean
  hasFish: boolean
  hasHeldItem: boolean
  round: number
  secretRoomUnlocked: boolean
}

const HINTS: DiscoveryHint[] = [
  {
    id: "water_stamina",
    emoji: "🌊",
    text: "Watch your stamina bar in the water! Get back to the beach before it runs out.",
    condition: (s) => s.playerInWater && s.sharkDistance > 200,
  },
  {
    id: "harpoon",
    emoji: "🔱",
    text: "Press F at a harpoon station to shoot the shark!",
    condition: (s) => s.nearHarpoonStation,
  },
  {
    id: "npc_talk",
    emoji: "💬",
    text: "Press E to talk to beach characters!",
    condition: (s) => s.nearNPC,
  },
  {
    id: "fish_market",
    emoji: "🐟",
    text: "Buy fish here! Q/R to browse, E to buy. Use fish as bait with T!",
    condition: (s) => s.nearFishMarket,
  },
  {
    id: "boat_safety",
    emoji: "🚣",
    text: "Press B to board the boat — you're safe from the shark!",
    condition: (s) => s.nearBoat,
  },
  {
    id: "beach_house",
    emoji: "🏠",
    text: "Press X to enter the beach house. Sleep with B to fully heal!",
    condition: (s) => s.nearBeachHouse,
  },
  {
    id: "ice_cream",
    emoji: "🍦",
    text: "Press E at the ice cream stand to heal up!",
    condition: (s) => s.nearIceCreamStand && s.playerHP < 80,
  },
  {
    id: "bait",
    emoji: "🎣",
    text: "Press T in the water to throw fish bait. The shark can't resist!",
    condition: (s) => s.hasFish && s.playerInWater,
  },
  {
    id: "throw_item",
    emoji: "🏖️",
    text: "Press G to pick up beach items, then throw them at the shark!",
    condition: (s) => s.round >= 2 && !s.hasHeldItem && !s.nearHarpoonStation,
  },
  {
    id: "secret_room",
    emoji: "🔓",
    text: "Secret room unlocked! Find it on the beach for a power-up!",
    condition: (s) => s.secretRoomUnlocked,
  },
  {
    id: "low_health",
    emoji: "❤️",
    text: "Health low! Find the ice cream stand or sleep in the beach house!",
    condition: (s) => s.playerHP < 30 && !s.nearIceCreamStand,
  },
  {
    id: "shark_faster",
    emoji: "⚡",
    text: "The shark is getting faster each round... stay sharp!",
    condition: (s) => s.round >= 2,
  },
]

export class DiscoverySystem {
  private shownHints = new Set<string>()
  private activeHint: { id: string; text: string; emoji: string; startTime: number } | null = null
  private readonly displayDurationMs = 4000

  /** Check conditions and return a hint to show (or null) */
  check(state: DiscoveryState): { emoji: string; text: string } | null {
    // Don't show a new hint if one is already showing
    if (this.activeHint) {
      if (Date.now() - this.activeHint.startTime > this.displayDurationMs) {
        this.activeHint = null
      } else {
        return { emoji: this.activeHint.emoji, text: this.activeHint.text }
      }
    }

    // Find first unshown hint whose condition is met
    for (const hint of HINTS) {
      if (this.shownHints.has(hint.id)) continue
      if (hint.condition(state)) {
        this.shownHints.add(hint.id)
        this.activeHint = { id: hint.id, emoji: hint.emoji, text: hint.text, startTime: Date.now() }
        return { emoji: hint.emoji, text: hint.text }
      }
    }

    return null
  }

  /** Get currently active hint (for rendering) */
  getActiveHint(): { emoji: string; text: string } | null {
    if (!this.activeHint) return null
    if (Date.now() - this.activeHint.startTime > this.displayDurationMs) {
      this.activeHint = null
      return null
    }
    return { emoji: this.activeHint.emoji, text: this.activeHint.text }
  }

  /** Reset for new game */
  reset(): void {
    this.shownHints.clear()
    this.activeHint = null
  }
}
