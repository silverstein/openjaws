'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SharkPersonality } from '@/lib/ai/sharkBrain'

interface Taunt {
  id: string
  text: string
  type: 'prediction' | 'pattern' | 'behavior' | 'ability' | 'location'
  intensity: 'subtle' | 'moderate' | 'intense'
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
  playerPosition,
  personality,
  currentTaunt,
  isActive
}: PersonalizedTauntsProps) {
  const [activeTaunts, setActiveTaunts] = useState<Array<Taunt & { timestamp: number }>>([])
  
  useEffect(() => {
    if (currentTaunt && isActive) {
      setActiveTaunts(prev => [...prev, { ...currentTaunt, timestamp: Date.now() }])
      
      // Remove old taunts after 4 seconds
      const timer = setTimeout(() => {
        setActiveTaunts(prev => prev.filter(t => t.id !== currentTaunt.id))
      }, 4000)
      
      return () => clearTimeout(timer)
    }
  }, [currentTaunt, isActive])
  
  const getTauntStyle = (intensity: Taunt['intensity']) => {
    switch (intensity) {
      case 'subtle':
        return {
          container: 'bg-gray-900/80 border border-gray-700',
          text: 'text-gray-200',
          tail: 'border-t-gray-900/80'
        }
      case 'moderate':
        return {
          container: 'bg-orange-950/90 border border-orange-700',
          text: 'text-orange-100',
          tail: 'border-t-orange-950/90'
        }
      case 'intense':
        return {
          container: 'bg-red-950/90 border-2 border-red-600',
          text: 'text-red-100 font-bold',
          tail: 'border-t-red-950/90'
        }
    }
  }
  
  const getPersonalityEmoji = () => {
    switch (personality) {
      case 'methodical': return '🧮'
      case 'theatrical': return '🎭'
      case 'vengeful': return '💀'
      case 'philosophical': return '🤔'
      case 'meta': return '🎮'
      default: return '🦈'
    }
  }
  
  // Calculate position for speech bubble (above shark, adjusted for screen bounds)
  const getBubblePosition = () => {
    const bubbleOffset = 80
    let x = sharkPosition.x
    let y = sharkPosition.y - bubbleOffset
    
    // Keep bubble on screen
    const screenPadding = 150
    if (x < screenPadding) x = screenPadding
    if (x > window.innerWidth - screenPadding) x = window.innerWidth - screenPadding
    if (y < 100) y = sharkPosition.y + bubbleOffset // Show below if too high
    
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
              transform: 'translate(-50%, -100%)'
            }}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
          >
            <div className={`${style.container} rounded-lg px-4 py-3 relative max-w-xs backdrop-blur-sm`}>
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
                <p className={`${style.text} text-sm leading-tight`}>
                  {taunt.text}
                </p>
              </div>
              
              {/* Type indicator */}
              {taunt.type === 'prediction' && (
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
            {taunt.intensity === 'intense' && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
                  pointerEvents: 'none'
                }}
                animate={{
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: 2
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
    "Third time hiding behind that rock. I'm counting."
  ],
  pattern: [
    "Still using the same escape route, {name}?",
    "You swim in circles when you panic. Did you know that?",
    "Same hiding spot as last time. And the time before."
  ],
  behavior: [
    "Getting tired already? Your stamina drops after 30 seconds.",
    "You always look back twice before committing to a direction.",
    "Nervous swimming patterns detected. Again."
  ],
  ability: [
    "That speed boost won't save you. I know when it ends.",
    "Saving your ability for the last second? Classic {name}.",
    "Your decoy fooled me once. Never again."
  ],
  location: [
    "This corner? Really? You died here last time.",
    "Back to your favorite spot, I see.",
    "You think the shallow water protects you? Think again."
  ]
}