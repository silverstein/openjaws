"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"

interface VictoryScreenProps {
  visible: boolean
  stats: {
    damageDealt: number
    selfiesTaken: number
    deaths: number
  }
  onPlayAgain: () => void
}

export function VictoryScreen({ visible, stats, onPlayAgain }: VictoryScreenProps) {
  const [phase, setPhase] = useState<"entrance" | "stats" | "celebration">("entrance")
  const [confettiParticles, setConfettiParticles] = useState<
    Array<{ id: number; emoji: string; x: number; delay: number; duration: number }>
  >([])

  const isMVP = stats.damageDealt > 500 && stats.deaths === 0

  useEffect(() => {
    if (!visible) {
      setPhase("entrance")
      setConfettiParticles([])
      return
    }

    const confettiEmojis = ["🎉", "🎊", "✨", "🌟", "💫", "⭐", "🎈"]
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      emoji: confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)] || "🎉",
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    }))
    setConfettiParticles(particles)

    const sequence = [
      { phase: "entrance" as const, duration: 800 },
      { phase: "stats" as const, duration: 2000 },
      { phase: "celebration" as const, duration: 0 },
    ]

    let currentIndex = 0
    const timers: NodeJS.Timeout[] = []

    const runSequence = () => {
      const currentItem = sequence[currentIndex]
      if (currentIndex < sequence.length && currentItem) {
        setPhase(currentItem.phase)
        if (currentItem.duration > 0) {
          const timer = setTimeout(() => {
            currentIndex++
            runSequence()
          }, currentItem.duration)
          timers.push(timer)
        }
      }
    }

    runSequence()

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-sky-400 via-blue-500 to-blue-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.95 }}
            transition={{ duration: 0.5 }}
          />

          {/* Confetti */}
          {confettiParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute text-4xl pointer-events-none select-none"
              style={{ left: `${particle.x}%` }}
              initial={{ y: -100, opacity: 1, rotate: 0 }}
              animate={{
                y: window.innerHeight + 100,
                opacity: [1, 1, 0],
                rotate: 360 * 3,
              }}
              transition={{
                delay: particle.delay,
                duration: particle.duration,
                ease: "linear",
              }}
            >
              {particle.emoji}
            </motion.div>
          ))}

          {/* Main content container */}
          <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-2xl w-full">
            {/* Title */}
            <motion.div
              className="mb-8 text-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
            >
              <motion.h1
                className="text-6xl sm:text-8xl md:text-9xl font-bold text-white mb-4 tracking-wider"
                style={{
                  textShadow:
                    "0 0 40px rgba(255, 215, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.3)",
                }}
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                JAWS CLOSED!
              </motion.h1>
              <motion.p
                className="text-2xl sm:text-3xl md:text-4xl text-yellow-200 font-semibold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                The beach is yours again!
              </motion.p>
            </motion.div>

            {/* Shark swimming away animation */}
            <motion.div
              className="mb-8 text-8xl"
              initial={{ x: 0, opacity: 1 }}
              animate={{
                x: [0, 200, 400],
                opacity: [1, 0.8, 0],
              }}
              transition={{
                delay: 0.8,
                duration: 2,
                ease: "easeOut",
              }}
            >
              🦈💨
            </motion.div>

            {/* Stats container */}
            {phase !== "entrance" && (
              <motion.div
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl mb-8 w-full max-w-md"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
                  Your Stats
                </h2>

                <div className="space-y-4">
                  <motion.div
                    className="flex justify-between items-center border-b border-gray-200 pb-3"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    <span className="text-lg text-gray-700 font-medium">Damage Dealt</span>
                    <motion.span
                      className="text-2xl font-bold text-red-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.3, type: "spring", stiffness: 200 }}
                    >
                      {stats.damageDealt}
                    </motion.span>
                  </motion.div>

                  <motion.div
                    className="flex justify-between items-center border-b border-gray-200 pb-3"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.4 }}
                  >
                    <span className="text-lg text-gray-700 font-medium">Selfies Taken 📸</span>
                    <motion.span
                      className="text-2xl font-bold text-pink-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
                    >
                      {stats.selfiesTaken}
                    </motion.span>
                  </motion.div>

                  <motion.div
                    className="flex justify-between items-center border-b border-gray-200 pb-3"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.6 }}
                  >
                    <span className="text-lg text-gray-700 font-medium">Times Died 💀</span>
                    <motion.span
                      className="text-2xl font-bold text-purple-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.7, type: "spring", stiffness: 200 }}
                    >
                      {stats.deaths}
                    </motion.span>
                  </motion.div>
                </div>

                {/* MVP Badge */}
                {isMVP && (
                  <motion.div
                    className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 text-center shadow-lg"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 1.8,
                      type: "spring",
                      stiffness: 150,
                      damping: 10,
                    }}
                  >
                    <motion.div
                      className="text-4xl mb-2"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{
                        delay: 2,
                        duration: 0.5,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    >
                      🏆
                    </motion.div>
                    <p className="text-white font-bold text-xl">BEACH HERO</p>
                    <p className="text-white/90 text-sm">Not a scratch! Legend status.</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Play Again Button */}
            {phase === "celebration" && (
              <motion.button
                onClick={onPlayAgain}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl sm:text-2xl px-8 sm:px-12 py-4 sm:py-5 rounded-full shadow-2xl transform transition-all duration-200 hover:scale-105 active:scale-95"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 2, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🎮 Play Again
              </motion.button>
            )}
          </div>

          {/* Additional floating emojis for atmosphere */}
          <motion.div
            className="absolute top-10 left-10 text-6xl"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            🏖️
          </motion.div>

          <motion.div
            className="absolute top-20 right-20 text-6xl"
            animate={{
              y: [0, 20, 0],
              rotate: [0, -15, 15, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          >
            🌊
          </motion.div>

          <motion.div
            className="absolute bottom-20 left-1/4 text-6xl"
            animate={{
              y: [0, -15, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          >
            🏆
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
