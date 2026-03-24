import { Container, Graphics, Text } from "pixi.js"

// ---- Types ----

export type ObjectiveType =
  | "selfie"
  | "talk_npc"
  | "survive_water"
  | "buy_fish"
  | "throw_bait"
  | "harpoon_hit"
  | "throw_item"
  | "deal_damage"
  | "survive_deep_water"

export interface Objective {
  id: string
  type: ObjectiveType
  title: string
  description: string
  points: number
  progress: number
  required: number
  completed: boolean
}

/** Game state snapshot passed to checkConditions every frame */
export interface GameConditions {
  playerX: number
  playerY: number
  sharkX: number
  sharkY: number
  playerInWater: boolean
  playerInDeepWater: boolean
  damageDealt: number
  fishCount: number
  sharkHP: number
}

/** Events that happen once (triggered by key presses, not continuous) */
export type GameEvent =
  | { type: "selfie_taken" }
  | { type: "npc_talked"; npcType: string }
  | { type: "fish_bought" }
  | { type: "bait_thrown" }
  | { type: "harpoon_hit" }
  | { type: "item_thrown" }
  | { type: "secret_room_found" }

export type RoundCompleteCallback = (round: number, score: number) => void
export type ObjectiveCompleteCallback = (objective: Objective) => void

// ---- Round Definitions ----

interface RoundDef {
  name: string
  description: string
  objectives: Omit<Objective, "progress" | "completed">[]
}

const ROUNDS: RoundDef[] = [
  {
    name: "Beach Day Basics",
    description: "Learn the ropes before the shark gets serious!",
    objectives: [
      { id: "r1_selfie", type: "selfie", title: "Viral Moment!", description: "Take a selfie with the shark (F key near shark)", points: 100, required: 1 },
      { id: "r1_talk", type: "talk_npc", title: "Make Friends!", description: "Talk to any beach NPC (E key near someone)", points: 75, required: 1 },
      { id: "r1_survive", type: "survive_water", title: "Test the Waters", description: "Survive 15 seconds swimming (watch your stamina!)", points: 150, required: 15 },
    ],
  },
  {
    name: "Beach Explorer",
    description: "The shark is getting hungry. Gear up!",
    objectives: [
      { id: "r2_fish", type: "buy_fish", title: "Gone Fishing!", description: "Buy fish at the fish market (Q/R to browse, E to buy)", points: 100, required: 1 },
      { id: "r2_bait", type: "throw_bait", title: "Here Fishy Fishy!", description: "Throw fish bait to distract the shark (T key in water)", points: 150, required: 1 },
      { id: "r2_harpoon", type: "harpoon_hit", title: "Direct Hit!", description: "Hit the shark with a harpoon (F key at harpoon station)", points: 200, required: 1 },
    ],
  },
  {
    name: "Shark Hunter",
    description: "Time to fight back. The shark won't go down easy.",
    objectives: [
      { id: "r3_throw", type: "throw_item", title: "Beach Bombardment!", description: "Throw a beach item at the shark (G to pick up, aim + throw)", points: 150, required: 1 },
      { id: "r3_damage", type: "deal_damage", title: "Shark Slayer!", description: "Deal 50 total damage to the shark", points: 250, required: 50 },
      { id: "r3_selfie2", type: "selfie", title: "Danger Selfie!", description: "Take ANOTHER selfie with the angry shark!", points: 300, required: 1 },
    ],
  },
]

// Escalation objectives — randomly selected for round 4+
const ESCALATION_OBJECTIVES: Omit<Objective, "id" | "progress" | "completed">[] = [
  { type: "selfie", title: "Extreme Selfie!", description: "Selfie with the shark (it's FAST now!)", points: 400, required: 1 },
  { type: "survive_water", title: "Deep Dive!", description: "Survive 30 seconds in the water", points: 350, required: 30 },
  { type: "survive_deep_water", title: "Abyss Swimmer!", description: "Survive 20 seconds in deep water", points: 500, required: 20 },
  { type: "deal_damage", title: "Heavy Hitter!", description: "Deal 80 damage this round", points: 400, required: 80 },
  { type: "harpoon_hit", title: "Sharpshooter!", description: "Hit the shark with 2 harpoons", points: 350, required: 2 },
  { type: "throw_item", title: "Beach Artillery!", description: "Throw 3 items at the shark", points: 300, required: 3 },
  { type: "throw_bait", title: "Master Baiter!", description: "Use bait to distract the shark twice", points: 250, required: 2 },
  { type: "talk_npc", title: "Social Butterfly!", description: "Talk to 3 different NPCs", points: 200, required: 3 },
]

// ---- ObjectiveSystem ----

export class ObjectiveSystem {
  private container: Container
  private currentObjective: Objective | null = null
  private currentObjectiveIndex = 0
  private currentRound = 1
  private score = 0
  private roundDamageBaseline = 0 // damage at start of round for relative tracking

  // Pixi display elements
  private scoreText: Text
  private objectiveText: Text
  private roundText: Text
  private progressBar: Graphics

  // Continuous condition trackers
  private waterSurviveTimer = 0
  private deepWaterSurviveTimer = 0

  // Callbacks
  private onRoundComplete: RoundCompleteCallback | null = null
  private onObjectiveComplete: ObjectiveCompleteCallback | null = null

  constructor() {
    this.container = new Container()

    this.scoreText = new Text({
      text: "Score: 0",
      style: { fontSize: 22, fill: 0xffffff, fontWeight: "bold", dropShadow: { distance: 2, color: 0x000000, alpha: 0.5 } },
    })
    this.scoreText.x = 20
    this.scoreText.y = typeof window !== "undefined" ? window.innerHeight - 185 : 500

    this.roundText = new Text({
      text: "Round 1: Beach Day Basics",
      style: { fontSize: 16, fill: 0x4ecdc4, fontWeight: "bold", dropShadow: { distance: 1, color: 0x000000, alpha: 0.5 } },
    })
    this.roundText.x = 20
    this.roundText.y = typeof window !== "undefined" ? window.innerHeight - 205 : 480

    this.objectiveText = new Text({
      text: "",
      style: { fontSize: 16, fill: 0xffd700, fontWeight: "bold", dropShadow: { distance: 2, color: 0x000000, alpha: 0.5 } },
    })
    this.objectiveText.x = 20
    this.objectiveText.y = typeof window !== "undefined" ? window.innerHeight - 160 : 520

    this.progressBar = new Graphics()
    this.progressBar.x = 20
    this.progressBar.y = typeof window !== "undefined" ? window.innerHeight - 135 : 545

    this.container.addChild(this.roundText)
    this.container.addChild(this.scoreText)
    this.container.addChild(this.objectiveText)
    this.container.addChild(this.progressBar)

    // Start round 1
    this.startRound(1)
  }

  // ---- Public API ----

  getContainer(): Container { return this.container }
  getScore(): number { return this.score }
  getCurrentRound(): number { return this.currentRound }
  getCurrentObjective(): Objective | null { return this.currentObjective }

  setOnRoundComplete(cb: RoundCompleteCallback): void { this.onRoundComplete = cb }
  setOnObjectiveComplete(cb: ObjectiveCompleteCallback): void { this.onObjectiveComplete = cb }

  /** Called every frame with continuous game state */
  updateConditions(delta: number, conditions: GameConditions): void {
    if (!this.currentObjective || this.currentObjective.completed) return

    const obj = this.currentObjective

    // Timer-based objectives
    if (obj.type === "survive_water" && conditions.playerInWater) {
      this.waterSurviveTimer += delta / 60
      obj.progress = Math.min(this.waterSurviveTimer, obj.required)
      if (obj.progress >= obj.required) this.completeCurrentObjective()
    } else if (obj.type === "survive_water" && !conditions.playerInWater) {
      // Reset if they leave the water (must be continuous)
      this.waterSurviveTimer = Math.max(0, this.waterSurviveTimer - delta / 120)
      obj.progress = this.waterSurviveTimer
    }

    if (obj.type === "survive_deep_water" && conditions.playerInDeepWater) {
      this.deepWaterSurviveTimer += delta / 60
      obj.progress = Math.min(this.deepWaterSurviveTimer, obj.required)
      if (obj.progress >= obj.required) this.completeCurrentObjective()
    } else if (obj.type === "survive_deep_water" && !conditions.playerInDeepWater) {
      this.deepWaterSurviveTimer = Math.max(0, this.deepWaterSurviveTimer - delta / 120)
      obj.progress = this.deepWaterSurviveTimer
    }

    // Cumulative damage tracking
    if (obj.type === "deal_damage") {
      obj.progress = Math.min(conditions.damageDealt - this.roundDamageBaseline, obj.required)
      if (obj.progress >= obj.required) this.completeCurrentObjective()
    }

    this.updateDisplay()
  }

  /** Called when a discrete game event happens */
  handleEvent(event: GameEvent): void {
    if (!this.currentObjective || this.currentObjective.completed) return

    const obj = this.currentObjective

    switch (event.type) {
      case "selfie_taken":
        if (obj.type === "selfie") {
          obj.progress++
          if (obj.progress >= obj.required) this.completeCurrentObjective()
        }
        break
      case "npc_talked":
        if (obj.type === "talk_npc") {
          obj.progress++
          if (obj.progress >= obj.required) this.completeCurrentObjective()
        }
        break
      case "fish_bought":
        if (obj.type === "buy_fish") {
          obj.progress++
          if (obj.progress >= obj.required) this.completeCurrentObjective()
        }
        break
      case "bait_thrown":
        if (obj.type === "throw_bait") {
          obj.progress++
          if (obj.progress >= obj.required) this.completeCurrentObjective()
        }
        break
      case "harpoon_hit":
        if (obj.type === "harpoon_hit") {
          obj.progress++
          if (obj.progress >= obj.required) this.completeCurrentObjective()
        }
        break
      case "item_thrown":
        if (obj.type === "throw_item") {
          obj.progress++
          if (obj.progress >= obj.required) this.completeCurrentObjective()
        }
        break
    }

    this.updateDisplay()
  }

  /** Legacy — used by existing selfie code in GameCanvas */
  checkSelfieCondition(playerX: number, playerY: number, sharkX: number, sharkY: number): boolean {
    const distance = Math.sqrt((playerX - sharkX) ** 2 + (playerY - sharkY) ** 2)
    return distance < 150
  }

  /** Legacy — wraps selfie attempt through the event system */
  attemptSelfie(playerX: number, playerY: number, sharkX: number, sharkY: number): boolean {
    if (!this.checkSelfieCondition(playerX, playerY, sharkX, sharkY)) return false
    this.handleEvent({ type: "selfie_taken" })
    return this.currentObjective?.type === "selfie" && (this.currentObjective?.completed ?? false)
  }

  /** Legacy — no longer needed, updateConditions handles timers */
  updateTimer(_delta: number): void {
    // Kept for backward compatibility — GameCanvas calls this
    // Timer logic now lives in updateConditions
  }

  // ---- Internals ----

  private startRound(round: number): void {
    this.currentRound = round
    this.currentObjectiveIndex = 0
    this.waterSurviveTimer = 0
    this.deepWaterSurviveTimer = 0

    const roundDef = this.getRoundDef(round)
    this.roundText.text = `Round ${round}: ${roundDef.name}`

    this.setNextObjective()
  }

  private getRoundDef(round: number): RoundDef {
    if (round <= ROUNDS.length) {
      return ROUNDS[round - 1]!
    }

    // Escalation rounds: pick 3 random objectives
    const shuffled = [...ESCALATION_OBJECTIVES].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, 3)
    return {
      name: `Shark Frenzy ${round - ROUNDS.length}!`,
      description: `The shark is ${round > 5 ? "FURIOUS" : "really angry"}!`,
      objectives: picked.map((o, i) => ({
        ...o,
        id: `r${round}_esc_${i}`,
        points: Math.round(o.points * (1 + (round - ROUNDS.length) * 0.2)),
      })),
    }
  }

  private setNextObjective(): void {
    const roundDef = this.getRoundDef(this.currentRound)

    if (this.currentObjectiveIndex >= roundDef.objectives.length) {
      // Round complete!
      this.onRoundComplete?.(this.currentRound, this.score)
      return
    }

    const objDef = roundDef.objectives[this.currentObjectiveIndex]!
    this.currentObjective = { ...objDef, progress: 0, completed: false }

    // Reset per-objective trackers
    this.waterSurviveTimer = 0
    this.deepWaterSurviveTimer = 0

    this.updateDisplay()
  }

  private completeCurrentObjective(): void {
    if (!this.currentObjective || this.currentObjective.completed) return

    this.currentObjective.completed = true
    this.score += this.currentObjective.points

    // Success text animation
    this.showFloatingText(
      `✅ ${this.currentObjective.title} +${this.currentObjective.points}`,
      0x00ff00
    )

    this.onObjectiveComplete?.(this.currentObjective)

    // Advance to next objective after a short delay
    setTimeout(() => {
      this.currentObjectiveIndex++
      this.setNextObjective()
    }, 1500)

    this.updateDisplay()
  }

  /** Called by GameCanvas when starting a new round after the banner */
  startNextRound(damageBaseline: number): void {
    this.roundDamageBaseline = damageBaseline
    this.startRound(this.currentRound + 1)
  }

  private showFloatingText(text: string, color: number): void {
    const floater = new Text({
      text,
      style: {
        fontSize: 26,
        fill: color,
        fontWeight: "bold",
        dropShadow: { distance: 2, color: 0x000000, alpha: 0.5 },
      },
    })
    floater.anchor.set(0.5)
    floater.x = typeof window !== "undefined" ? window.innerWidth / 2 : 400
    floater.y = typeof window !== "undefined" ? window.innerHeight / 2 - 50 : 250
    this.container.addChild(floater)

    let alpha = 1
    const fade = setInterval(() => {
      alpha -= 0.02
      floater.alpha = alpha
      floater.y -= 1
      if (alpha <= 0) {
        this.container.removeChild(floater)
        clearInterval(fade)
      }
    }, 16)
  }

  private updateDisplay(): void {
    this.scoreText.text = `Score: ${this.score}`
    this.roundText.text = `Round ${this.currentRound}: ${this.getRoundDef(this.currentRound).name}`

    if (this.currentObjective) {
      const idx = this.currentObjectiveIndex + 1
      const total = this.getRoundDef(this.currentRound).objectives.length
      this.objectiveText.text = `📋 [${idx}/${total}] ${this.currentObjective.description}`

      this.progressBar.clear()
      this.progressBar.rect(0, 0, 200, 16)
      this.progressBar.fill({ color: 0x333333, alpha: 0.8 })

      const progress = Math.min(this.currentObjective.progress / this.currentObjective.required, 1)
      this.progressBar.rect(2, 2, 196 * progress, 12)
      this.progressBar.fill({ color: this.currentObjective.completed ? 0x00ff00 : 0xffd700 })

      this.progressBar.rect(0, 0, 200, 16)
      this.progressBar.stroke({ width: 1.5, color: 0xffffff })
    } else {
      this.objectiveText.text = ""
      this.progressBar.clear()
    }
  }
}
