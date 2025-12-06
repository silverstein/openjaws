"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"

interface Memory {
  encounter: string
  outcome: string
  timestamp: string
}

interface RecognitionMomentProps {
  isActive: boolean
  playerName: string
  memories: Memory[]
  recognitionLevel: "first" | "familiar" | "nemesis"
  onComplete: () => void
}

export function RecognitionMoment({
  isActive,
  playerName,
  memories,
  recognitionLevel,
  onComplete,
}: RecognitionMomentProps) {
  const [phase, setPhase] = useState<"zoom" | "reveal" | "memories" | "fade">("zoom")

  useEffect(() => {
    if (!isActive) {
      return
    }

    // Dramatic sequence timing
    const sequence = [
      { phase: "zoom" as const, duration: 800 },
      { phase: "reveal" as const, duration: 1500 },
      { phase: "memories" as const, duration: 3000 },
      { phase: "fade" as const, duration: 500 },
    ]

    let currentIndex = 0
    const timers: NodeJS.Timeout[] = []

    const runSequence = () => {
      const currentItem = sequence[currentIndex]
      if (currentIndex < sequence.length && currentItem) {
        setPhase(currentItem.phase)
        const timer = setTimeout(() => {
          currentIndex++
          runSequence()
        }, currentItem.duration)
        timers.push(timer)
      } else {
        onComplete()
      }
    }

    runSequence()

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [isActive, onComplete])

  const getMainText = () => {
    switch (recognitionLevel) {
      case "first":
        return "THE SHARK NOTICES YOU"
      case "familiar":
        return "THE SHARK REMEMBERS YOU"
      case "nemesis":
        return "YOUR NEMESIS AWAITS"
      default:
        return "THE SHARK REMEMBERS"
    }
  }

  const getSubText = () => {
    switch (recognitionLevel) {
      case "first":
        return "A new pattern emerges..."
      case "familiar":
        return `${playerName}... we meet again`
      case "nemesis":
        return "This time will be different"
      default:
        return "Memory activated"
    }
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Dark vignette overlay */}
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{
              opacity: phase === "zoom" ? 0.8 : phase === "fade" ? 0 : 0.9,
            }}
            transition={{ duration: 0.5 }}
          />

          {/* Cinematic bars */}
          <motion.div
            className="absolute top-0 left-0 right-0 bg-black"
            initial={{ height: 0 }}
            animate={{ height: phase !== "fade" ? "15vh" : 0 }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-black"
            initial={{ height: 0 }}
            animate={{ height: phase !== "fade" ? "15vh" : 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Main recognition text */}
          {(phase === "reveal" || phase === "memories") && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.h1
                className="text-6xl md:text-8xl font-bold text-red-500 mb-4 text-center tracking-wider"
                style={{ textShadow: "0 0 30px rgba(239, 68, 68, 0.8)" }}
                animate={{
                  opacity: [1, 0.8, 1],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {getMainText()}
              </motion.h1>

              <motion.p
                className="text-xl md:text-3xl text-red-300 italic"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {getSubText()}
              </motion.p>
            </motion.div>
          )}

          {/* Memory flashes */}
          {phase === "memories" && memories.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              {memories.slice(0, 3).map((memory, index) => (
                <motion.div
                  key={index}
                  className="absolute bg-black/80 p-6 rounded-lg border border-red-900/50"
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                    x: (index - 1) * 300,
                    y: (index - 1) * 50,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.8, 1, 0.9],
                    rotate: [0, (index - 1) * 5, (index - 1) * 5],
                  }}
                  transition={{
                    delay: index * 0.3,
                    duration: 1.5,
                    times: [0, 0.5, 1],
                  }}
                >
                  <p className="text-red-200 text-sm mb-2">{memory.timestamp}</p>
                  <p className="text-white">{memory.encounter}</p>
                  <p className="text-red-400 text-sm mt-1">{memory.outcome}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Dramatic zoom lines */}
          {phase === "zoom" && (
            <svg
              className="absolute inset-0 w-full h-full"
              role="img"
              aria-label="Dramatic zoom effect"
            >
              {[...Array(8)].map((_, i) => (
                <motion.line
                  key={i}
                  x1="50%"
                  y1="50%"
                  x2={`${50 + 50 * Math.cos((i * Math.PI) / 4)}%`}
                  y2={`${50 + 50 * Math.sin((i * Math.PI) / 4)}%`}
                  stroke="rgba(239, 68, 68, 0.6)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              ))}
            </svg>
          )}

          {/* Screen flash effect */}
          {phase === "reveal" && (
            <motion.div
              className="absolute inset-0 bg-red-500"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
