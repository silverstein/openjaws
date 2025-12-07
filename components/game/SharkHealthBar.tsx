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
  const containerWidth = isCompact ? "max-w-[260px]" : "max-w-[420px]"
  const barHeight = isCompact ? "h-3" : "h-[14px]"
  const paddingX = isCompact ? "px-2.5" : "px-4"
  const paddingY = isCompact ? "py-1.5" : "py-2.5"

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed ${topPosition} left-1/2 -translate-x-1/2 z-40 w-full ${containerWidth} ${isCompact ? 'px-2' : 'px-3'}`}
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -64, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={isCompact ? { paddingTop: "env(safe-area-inset-top, 0px)" } : undefined}
        >
          <motion.div
            className={`bg-black/35 backdrop-blur-[6px] border border-red-900/30 rounded-full shadow-sm ${paddingX} ${paddingY}`}
            animate={showDamage ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center gap-2 min-w-[78px]">
                <motion.span
                  className={isCompact ? "text-sm" : "text-base"}
                  animate={isLowHealth ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.45, repeat: isLowHealth ? Infinity : 0, repeatDelay: 0.6 }}
                >
                  🦈
                </motion.span>
                <span className="text-[11px] text-white font-semibold tracking-wide">JAWS</span>
              </div>

              <div className="flex-1">
                <div className={`relative ${barHeight} bg-black/30 rounded-full overflow-hidden border border-red-900/40`}>
                  <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full ${getHealthBarColor()} ${getHealthBarGlow()}`}
                    initial={{ width: `${healthPercent}%` }}
                    animate={{ width: `${healthPercent}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    style={{ boxShadow: "0 0 8px rgba(239,68,68,0.35) inset" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className={`text-[10px] font-semibold text-white/90 drop-shadow`}>
                      {Math.round(healthPercent)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 min-w-[96px] justify-end">
                <span className="text-[10px] font-mono text-white/80">{Math.ceil(currentHP)} / {maxHP}</span>
              </div>
            </div>
          </motion.div>

          {/* Damage popup */}
          <AnimatePresence>
            {showDamage && lastDamage && lastDamage > 0 && (
              <motion.div
                className="absolute left-1/2 top-full mt-1 -translate-x-1/2"
                initial={{ y: -5, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 10, opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className={`font-bold ${isCompact ? 'text-sm' : 'text-base'} text-red-300 drop-shadow`}>-{Math.ceil(lastDamage)}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
