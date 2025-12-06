// Re-export shark types from sharkBrain for convenience
export type {
  SharkPersonality,
  SharkMemory,
  GameContext,
  SharkDecision,
} from "@/lib/ai/sharkBrain"

// Additional shark-related types
export interface Taunt {
  id: string
  text: string
  type: "prediction" | "pattern" | "behavior" | "ability" | "location"
  intensity: "subtle" | "moderate" | "intense"
}

export interface RecognitionLevel {
  level: "familiar" | "known" | "nemesis"
  encounters: number
}
