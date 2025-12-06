"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice"
import { useIsLandscape } from "@/hooks/useIsLandscape"

interface SharkHealthBarProps {
  currentHP: number
  maxHP: number
  lastDamage?: number
  isVisible?: boolean
}

export function SharkHealthBar({
  currentHP,
  maxHP,
  lastDamage,
  isVisible = true,
}: SharkHealthBarProps) {
  const [prevHP, setPrevHP] = useState(currentHP)
  const [showDamage, setShowDamage] = useState(false)
  const isTouchDevice = useIsTouchDevice()
  const isLandscape = useIsLandscape()

  // Use compact mode on mobile
  const isCompact = isTouchDevice

  const healthPercent = Math.max(0, Math.min(100, (currentHP / maxHP) * 100))
  const isLowHealth = healthPercent <= 30
  const isCriticalHealth = healthPercent <= 15

  useEffect(() => {
    if (currentHP < prevHP) {
      setShowDamage(true)
      const timer = setTimeout(() => setShowDamage(false), 500)
      setPrevHP(currentHP)
      return () => clearTimeout(timer)
    }
    setPrevHP(currentHP)
    return undefined
  }, [currentHP, prevHP])

  const getHealthBarColor = () => {
    if (isCriticalHealth) return "bg-red-700"
    if (isLowHealth) return "bg-red-500"
    return "bg-red-600"
  }

  const getHealthBarGlow = () => {
    if (isCriticalHealth) return "shadow-[0_0_20px_rgba(239,68,68,0.8)]"
    if (isLowHealth) return "shadow-[0_0_15px_rgba(239,68,68,0.6)]"
    return "shadow-[0_0_10px_rgba(220,38,38,0.5)]"
  }

  // In landscape mobile, position to not overlap with minimap (which is top-center)
  const topPosition = isCompact && isLandscape ? "top-2" : isCompact ? "top-12" : "top-6"

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed ${topPosition} left-1/2 -translate-x-1/2 z-40 w-full ${isCompact ? 'max-w-[280px] px-2' : 'max-w-2xl px-4'}`}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={isCompact ? { paddingTop: "env(safe-area-inset-top, 0px)" } : undefined}
        >
          <div className="relative">
            {/* Boss health bar container */}
            <motion.div
              className={`
                bg-black/90 rounded-lg border-2 border-red-900
                shadow-2xl overflow-hidden backdrop-blur-sm
                ${isLowHealth ? "animate-pulse" : ""}
              `}
              animate={
                showDamage
                  ? {
                      scale: [1, 1.02, 1],
                      borderColor: ["rgb(127,29,29)", "rgb(239,68,68)", "rgb(127,29,29)"],
                    }
                  : {}
              }
              transition={{ duration: 0.3 }}
            >
              {/* Header section - compact on mobile */}
              <div className={`bg-gradient-to-b from-red-900/50 to-transparent ${isCompact ? 'px-2 py-1' : 'px-4 py-2'} flex items-center justify-between border-b border-red-900/50`}>
                <div className={`flex items-center ${isCompact ? 'gap-1.5' : 'gap-3'}`}>
                  <motion.span
                    className={isCompact ? "text-lg" : "text-3xl"}
                    animate={
                      isLowHealth
                        ? {
                            scale: [1, 1.2, 1],
                            rotate: [0, -10, 10, 0],
                          }
                        : {}
                    }
                    transition={{
                      duration: 0.5,
                      repeat: isLowHealth ? Infinity : 0,
                      repeatDelay: 0.5,
                    }}
                  >
                    🦈
                  </motion.span>
                  <div>
                    <h2
                      className={`
                      font-bold ${isCompact ? 'text-xs' : 'text-lg'} tracking-wider uppercase
                      ${isCriticalHealth ? "text-red-400 animate-pulse" : "text-red-500"}
                    `}
                      style={{
                        textShadow: "0 0 10px rgba(239, 68, 68, 0.5)",
                      }}
                    >
                      JAWS
                    </h2>
                    {!isCompact && <p className="text-red-300/70 text-xs">Apex Predator</p>}
                  </div>
                </div>

                {/* HP Text */}
                <div className="text-right">
                  <motion.div
                    className={`font-mono ${isCompact ? 'text-xs' : 'text-lg'} font-bold text-white`}
                    key={currentHP}
                    initial={{ scale: 1.2, color: "#fca5a5" }}
                    animate={{ scale: 1, color: "#ffffff" }}
                    transition={{ duration: 0.2 }}
                  >
                    {Math.ceil(currentHP)}/{maxHP}
                  </motion.div>
                  {!isCompact && <div className="text-red-300/70 text-xs">HP</div>}
                </div>
              </div>

              {/* Health bar section */}
              <div className={isCompact ? "px-2 py-1.5" : "px-4 py-3"}>
                <div className={`relative ${isCompact ? 'h-4' : 'h-8'} bg-black/50 rounded-full border border-red-900/50 overflow-hidden`}>
                  {/* Background grid pattern */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, rgba(239,68,68,0.1) 1px, transparent 1px)",
                      backgroundSize: "20px 100%",
                    }}
                  />

                  {/* Main health bar */}
                  <motion.div
                    className={`
                      absolute inset-y-0 left-0 rounded-full
                      ${getHealthBarColor()}
                      ${getHealthBarGlow()}
                    `}
                    initial={{ width: `${healthPercent}%` }}
                    animate={{ width: `${healthPercent}%` }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                  >
                    {/* Animated shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{
                        x: ["-100%", "200%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: "linear",
                      }}
                    />
                  </motion.div>

                  {/* Depleting health bar (shows damage) */}
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-red-400/50 rounded-full"
                    initial={{ width: `${(prevHP / maxHP) * 100}%` }}
                    animate={{ width: `${healthPercent}%` }}
                    transition={{
                      duration: 0.6,
                      ease: "easeOut",
                    }}
                  />

                  {/* Percentage text overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className={`font-bold ${isCompact ? 'text-[10px]' : 'text-sm'} text-white drop-shadow-lg`}
                      style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
                    >
                      {Math.round(healthPercent)}%
                    </span>
                  </div>

                  {/* Critical health warning pulse */}
                  {isCriticalHealth && (
                    <motion.div
                      className="absolute inset-0 border-2 border-red-500 rounded-full"
                      animate={{
                        opacity: [0.8, 0.2, 0.8],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </div>

                {/* Segment markers (visual only) - hide on compact */}
                {!isCompact && (
                  <div className="absolute top-0 left-4 right-4 h-8 flex items-center pointer-events-none mt-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 border-r border-black/30 last:border-r-0 h-full"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Warning text for low health - hide on compact */}
              {isLowHealth && !isCompact && (
                <motion.div
                  className="px-4 pb-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div
                    className={`
                    text-center text-xs font-bold tracking-wider
                    ${isCriticalHealth ? "text-red-400" : "text-red-500"}
                  `}
                  >
                    {isCriticalHealth ? "⚠️ CRITICAL DAMAGE ⚠️" : "⚡ LOW HEALTH ⚡"}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Damage number popup */}
            <AnimatePresence>
              {showDamage && lastDamage && lastDamage > 0 && (
                <motion.div
                  className={`absolute ${isCompact ? '-bottom-4' : '-bottom-8'} left-1/2 -translate-x-1/2`}
                  initial={{ y: 0, opacity: 0, scale: 0.5 }}
                  animate={{ y: isCompact ? 5 : 10, opacity: 1, scale: 1 }}
                  exit={{ y: isCompact ? 15 : 30, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div
                    className={`font-bold ${isCompact ? 'text-sm' : 'text-2xl'} text-red-400`}
                    style={{
                      textShadow:
                        "0 0 10px rgba(239,68,68,0.8), 2px 2px 4px rgba(0,0,0,0.8)",
                    }}
                  >
                    -{Math.ceil(lastDamage)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
