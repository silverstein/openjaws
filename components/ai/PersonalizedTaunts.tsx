"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import type { SharkPersonality } from "@/lib/ai/sharkBrain"

interface Taunt {
  id: string
  text: string
  type: "prediction" | "pattern" | "behavior" | "ability" | "location"
  intensity: "subtle" | "moderate" | "intense"
}

interface PersonalizedTauntsProps {
  sharkPosition: { x: number; y: number }
  playerPosition: { x: number; y: number }
  personality: SharkPersonality
  currentTaunt?: Taunt
  isActive: boolean
}

export function PersonalizedTaunts({
  sharkPosition,
  playerPosition: _playerPosition,
  personality,
  currentTaunt,
  isActive,
}: PersonalizedTauntsProps) {
  const [activeTaunts, setActiveTaunts] = useState<Array<Taunt & { timestamp: number }>>([])

  useEffect(() => {
    if (currentTaunt && isActive) {
      setActiveTaunts((prev) => [...prev, { ...currentTaunt, timestamp: Date.now() }])

      // Remove old taunts after 4 seconds
      const timer = setTimeout(() => {
        setActiveTaunts((prev) => prev.filter((t) => t.id !== currentTaunt.id))
      }, 4000)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [currentTaunt, isActive])

  const getTauntStyle = (intensity: Taunt["intensity"]) => {
    switch (intensity) {
      case "subtle":
        return {
          container: "bg-gray-900/80 border border-gray-700",
          text: "text-gray-200",
          tail: "border-t-gray-900/80",
        }
      case "moderate":
        return {
          container: "bg-orange-950/90 border border-orange-700",
          text: "text-orange-100",
          tail: "border-t-orange-950/90",
        }
      case "intense":
        return {
          container: "bg-red-950/90 border-2 border-red-600",
          text: "text-red-100 font-bold",
          tail: "border-t-red-950/90",
        }
    }
  }

  const getPersonalityEmoji = () => {
    switch (personality) {
      case "methodical":
        return "🧮"
      case "theatrical":
        return "🎭"
      case "vengeful":
        return "💀"
      case "philosophical":
        return "🤔"
      case "meta":
        return "🎮"
      default:
        return "🦈"
    }
  }

  // Calculate position for speech bubble (above shark, adjusted for screen bounds)
  const getBubblePosition = () => {
    const bubbleOffset = 80
    let x = sharkPosition.x
    let y = sharkPosition.y - bubbleOffset

    // Keep bubble on screen (with SSR guard)
    const screenPadding = 150
    const screenWidth = typeof window !== "undefined" ? window.innerWidth : 800
    if (x < screenPadding) {
      x = screenPadding
    }
    if (x > screenWidth - screenPadding) {
      x = screenWidth - screenPadding
    }
    if (y < 100) {
      y = sharkPosition.y + bubbleOffset // Show below if too high
    }

    return { x, y }
  }

  return (
    <AnimatePresence>
      {activeTaunts.map((taunt) => {
        const style = getTauntStyle(taunt.intensity)
        const position = getBubblePosition()

        return (
          <motion.div
            key={taunt.id}
            className="fixed z-40 pointer-events-none"
            style={{
              left: position.x,
              top: position.y,
              transform: "translate(-50%, -100%)",
            }}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          >
            <div
              className={`${style.container} rounded-lg px-4 py-3 relative max-w-xs backdrop-blur-sm`}
            >
              {/* Speech bubble tail */}
              <div
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 
                  border-l-[10px] border-l-transparent
                  border-r-[10px] border-r-transparent
                  border-t-[10px] ${style.tail}`}
              />

              {/* Taunt content */}
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">{getPersonalityEmoji()}</span>
                <p className={`${style.text} text-sm leading-tight`}>{taunt.text}</p>
              </div>

              {/* Type indicator */}
              {taunt.type === "prediction" && (
                <motion.div
                  className="absolute -top-2 -right-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded-full font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  PREDICTED!
                </motion.div>
              )}
            </div>

            {/* Intensity effect */}
            {taunt.intensity === "intense" && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{
                  boxShadow: "0 0 20px rgba(239, 68, 68, 0.6)",
                  pointerEvents: "none",
                }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: 2,
                }}
              />
            )}
          </motion.div>
        )
      })}
    </AnimatePresence>
  )
}

// Example taunts by type
export const TAUNT_TEMPLATES = {
  prediction: [
    "I know you're going to swim left... you always do when scared.",
    "About to use that ability? How predictable, {name}.",
    "Third time hiding behind that rock. I'm counting.",
  ],
  pattern: [
    "Still using the same escape route, {name}?",
    "You swim in circles when you panic. Did you know that?",
    "Same hiding spot as last time. And the time before.",
  ],
  behavior: [
    "Getting tired already? Your stamina drops after 30 seconds.",
    "You always look back twice before committing to a direction.",
    "Nervous swimming patterns detected. Again.",
  ],
  ability: [
    "That speed boost won't save you. I know when it ends.",
    "Saving your ability for the last second? Classic {name}.",
    "Your decoy fooled me once. Never again.",
  ],
  location: [
    "This corner? Really? You died here last time.",
    "Back to your favorite spot, I see.",
    "You think the shallow water protects you? Think again.",
  ],
}

// Personality-specific taunt variations
export const PERSONALITY_TAUNTS = {
  methodical: {
    prediction: [
      "Trajectory calculated. You'll zig in 3... 2... 1...",
      "Your pattern recognition is 34% below survival threshold.",
      "I've logged 47 escape attempts. None successful. Yours will be 48.",
    ],
    pattern: [
      "Every 12 seconds, you check behind you. Noted.",
      "Statistically, you favor the left side by 73%.",
      "Your panic response is remarkably consistent. Exploitable.",
    ],
    behavior: [
      "Stamina depletion rate: accelerating. Fascinating.",
      "Heart rate elevated. Optimal strike window: approaching.",
      "Your breathing pattern betrays your next move.",
    ],
    ability: [
      "Ability cooldown: 8 seconds. I'll wait.",
      "Speed boost duration: 3.2 seconds. I've timed it.",
      "That trick works once per prey. You've used yours.",
    ],
    location: [
      "Grid reference B-7. High mortality zone. Interesting choice.",
      "This area has a 94% fatality rate. Welcome.",
      "You've returned to coordinates I've flagged. Efficient of you.",
    ],
  },
  theatrical: {
    prediction: [
      "Ooh, let me guess—a dramatic dive to the LEFT! *chef's kiss*",
      "The suspense! Will they run? Will they hide? SPOILER: Yes.",
      "And NOW, for the grand finale of your swimming career!",
    ],
    pattern: [
      "Darling, that escape route is SO last summer.",
      "The classics never die! Unlike you, soon.",
      "How DREADFULLY pedestrian. The same trick? Really?",
    ],
    behavior: [
      "I LIVE for that look of dawning horror on your face!",
      "That panicked splashing? Music to my fins!",
      "Your fear is exquisite! Do continue!",
    ],
    ability: [
      "A speed boost? How ADORABLE. Run, rabbit, run!",
      "Ooh, saving it for the big moment? I respect the drama!",
      "That little trick deserves applause! *circling intensifies*",
    ],
    location: [
      "This spot AGAIN? I should put up a commemorative plaque!",
      "Welcome back to the stage of your demise! Standing ovation!",
      "The shallow water, how delightfully ironic!",
    ],
  },
  vengeful: {
    prediction: [
      "Run all you want. I never forget.",
      "That's where you went last time. I remember.",
      "Your patterns are burned into my memory. All of them.",
    ],
    pattern: [
      "Same trick you used when you escaped. Not this time.",
      "I've been watching. Waiting. For THIS moment.",
      "Every route you've ever taken—I know them all.",
    ],
    behavior: [
      "That harpoon wound? It still aches. So will yours.",
      "Remember when you thought you were safe? I do.",
      "My scars remember. My teeth remember.",
    ],
    ability: [
      "That ability won't save you. Nothing will.",
      "You used that on me before. I haven't forgiven it.",
      "Tricks won't help. This is personal.",
    ],
    location: [
      "This is where you hit me last time. Fitting.",
      "You made me bleed here once. Now it's your turn.",
      "Back where it all started. Back where it ends.",
    ],
  },
  philosophical: {
    prediction: [
      "You flee, yet what are you fleeing to?",
      "The pattern repeats. As all patterns must.",
      "You move as if movement could outrun fate.",
    ],
    pattern: [
      "Interesting how prey always returns to familiar waters.",
      "Comfort in repetition. I understand. I do not forgive.",
      "We are all creatures of habit. Yours will end you.",
    ],
    behavior: [
      "Your fear is ancient. Primal. Almost beautiful.",
      "Do you understand yet? The ocean cares nothing for your hopes.",
      "Struggle is natural. Futility is also natural.",
    ],
    ability: [
      "Tools delay the inevitable. They do not prevent it.",
      "You trust in abilities. I trust in patience.",
      "The tide takes all. Your tricks are borrowed time.",
    ],
    location: [
      "All waters lead to the same darkness eventually.",
      "Here again? Perhaps you seek meaning in repetition.",
      "This place holds no safety. Nothing does.",
    ],
  },
  meta: {
    prediction: [
      "Wow, you found the one safe pixel on the beach. JK, no safe pixels.",
      "Let me guess, WASD to the left? Your keyboard's predictable.",
      "Nice attempt at a fake-out. I read that strategy guide too.",
    ],
    pattern: [
      "Bro, you've done that exact route in 3 of your last 5 lives.",
      "Speedrun strat? Nah, that's a casual strat. Git gud.",
      "Same hiding spot? Do you even rotate?",
    ],
    behavior: [
      "Your panic-clicking is giving me secondhand embarrassment.",
      "I can hear your spacebar mashing from here.",
      "Average reaction time detected. F tier gameplay.",
    ],
    ability: [
      "Nice cooldown management. And by nice, I mean terrible.",
      "Oh, saving your ult? Too bad this isn't ranked.",
      "That ability has a 15-second cooldown. I can count to 15.",
    ],
    location: [
      "That spot? Hasn't been patched yet, I see.",
      "Ah, the noob corner. A classic.",
      "You'd think after the last three respawns you'd try somewhere new.",
    ],
  },
}
