'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SharkPersonality } from '@/lib/ai/sharkBrain'

interface SharkCommentaryProps {
  personality: SharkPersonality
  isThinking: boolean
  currentThought?: string
  targetName?: string
  recognition?: {
    level: 'familiar' | 'known' | 'nemesis'
    encounters: number
  }
}

export function SharkCommentary({ 
  personality, 
  isThinking, 
  currentThought,
  targetName,
  recognition
}: SharkCommentaryProps) {
  const [displayThought, setDisplayThought] = useState<string>('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (currentThought && currentThought !== displayThought) {
      setDisplayThought(currentThought)
      setIsVisible(true)
      
      // Auto-hide after 5 seconds unless it's a recognition thought
      if (!currentThought.toLowerCase().includes('remember') && 
          !currentThought.toLowerCase().includes('recognize')) {
        const timer = setTimeout(() => setIsVisible(false), 5000)
        return () => clearTimeout(timer)
      }
    }
  }, [currentThought, displayThought])

  const getPersonalityStyle = () => {
    switch (personality) {
      case 'methodical':
        return {
          container: 'bg-blue-950/90 border-2 border-blue-400/50 shadow-blue-500/30',
          text: 'text-blue-100',
          accent: 'text-blue-300',
          glow: 'shadow-lg shadow-blue-500/20'
        }
      case 'theatrical':
        return {
          container: 'bg-purple-950/90 border-2 border-purple-400/50 shadow-purple-500/30',
          text: 'text-purple-100',
          accent: 'text-purple-300',
          glow: 'shadow-lg shadow-purple-500/20'
        }
      case 'vengeful':
        return {
          container: 'bg-red-950/90 border-2 border-red-400/50 shadow-red-500/30',
          text: 'text-red-100',
          accent: 'text-red-300',
          glow: 'shadow-lg shadow-red-500/20'
        }
      case 'philosophical':
        return {
          container: 'bg-gray-900/90 border-2 border-gray-400/50 shadow-gray-500/30',
          text: 'text-gray-100',
          accent: 'text-gray-300',
          glow: 'shadow-lg shadow-gray-500/20'
        }
      case 'meta':
        return {
          container: 'bg-green-950/90 border-2 border-green-400/50 shadow-green-500/30',
          text: 'text-green-100',
          accent: 'text-green-300',
          glow: 'shadow-lg shadow-green-500/20'
        }
      default:
        return {
          container: 'bg-gray-900/90 border-2 border-gray-400/50',
          text: 'text-gray-100',
          accent: 'text-gray-300',
          glow: 'shadow-lg'
        }
    }
  }

  const getThinkingIndicator = () => {
    if (!isThinking) return null
    
    return (
      <div className="flex items-center gap-1 mb-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full ${getPersonalityStyle().accent} bg-current`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    )
  }

  const getRecognitionBadge = () => {
    if (!recognition) return null
    
    const badges = {
      familiar: { text: 'FAMILIAR PREY', color: 'bg-yellow-600/80' },
      known: { text: 'KNOWN PATTERN', color: 'bg-orange-600/80' },
      nemesis: { text: 'NEMESIS', color: 'bg-red-600/80' }
    }
    
    const badge = badges[recognition.level]
    
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`${badge.color} px-2 py-1 rounded text-xs font-bold text-white mb-2`}
      >
        {badge.text} • {recognition.encounters} ENCOUNTERS
      </motion.div>
    )
  }

  const style = getPersonalityStyle()

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 max-w-lg z-50 ${style.glow}`}
        >
          <div className={`${style.container} rounded-lg p-6 backdrop-blur-sm`}>
            {getRecognitionBadge()}
            {getThinkingIndicator()}
            
            <div className={`${style.text} font-mono text-sm leading-relaxed`}>
              {targetName && (
                <span className={`${style.accent} font-bold`}>{targetName}... </span>
              )}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {displayThought}
              </motion.span>
            </div>
            
            {/* Personality indicator */}
            <div className={`mt-3 text-xs ${style.accent} opacity-70 flex items-center gap-2`}>
              <span className="uppercase tracking-wider">{personality} SHARK</span>
              {recognition && (
                <>
                  <span className="opacity-50">•</span>
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    MEMORY ACTIVE
                  </motion.span>
                </>
              )}
            </div>
          </div>
          
          {/* Dramatic effect lines */}
          <svg
            className="absolute -z-10 w-full h-full top-0 left-0"
            style={{ filter: 'blur(1px)' }}
          >
            <motion.line
              x1="50%"
              y1="50%"
              x2="0%"
              y2="0%"
              stroke={style.accent}
              strokeWidth="1"
              opacity="0.3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
            <motion.line
              x1="50%"
              y1="50%"
              x2="100%"
              y2="0%"
              stroke={style.accent}
              strokeWidth="1"
              opacity="0.3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}