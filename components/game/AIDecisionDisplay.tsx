import { useEffect, useState } from 'react'
import { SharkPersonality } from '@/convex/types'

interface AIDecisionDisplayProps {
  personality: SharkPersonality
  currentThought: string
  hunger: number
  rage: number
  currentTarget: string | null
  patternRecognized?: {
    type: string
    confidence: number
  }
}

export function AIDecisionDisplay({
  personality,
  currentThought,
  hunger,
  rage,
  currentTarget,
  patternRecognized
}: AIDecisionDisplayProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [thoughtHistory, setThoughtHistory] = useState<string[]>([])
  
  useEffect(() => {
    if (currentThought && currentThought !== thoughtHistory[0]) {
      setThoughtHistory(prev => [currentThought, ...prev.slice(0, 2)])
    }
  }, [currentThought])
  
  const getPersonalityEmoji = () => {
    switch (personality) {
      case 'methodical': return '🧮'
      case 'theatrical': return '🎭'
      case 'vengeful': return '😤'
      case 'philosophical': return '🤔'
      case 'meta': return '🎮'
      default: return '🦈'
    }
  }
  
  const getPersonalityColor = () => {
    switch (personality) {
      case 'methodical': return 'from-blue-500 to-blue-700'
      case 'theatrical': return 'from-purple-500 to-pink-700'
      case 'vengeful': return 'from-red-500 to-red-700'
      case 'philosophical': return 'from-green-500 to-teal-700'
      case 'meta': return 'from-yellow-500 to-orange-700'
      default: return 'from-gray-500 to-gray-700'
    }
  }
  
  const getHungerBar = () => {
    const segments = 5
    const filledSegments = Math.floor((hunger / 100) * segments)
    return Array(segments).fill(0).map((_, i) => (
      <div
        key={i}
        className={`h-2 w-4 ${
          i < filledSegments 
            ? 'bg-orange-500' 
            : 'bg-gray-600'
        } ${i === 0 ? 'rounded-l' : ''} ${i === segments - 1 ? 'rounded-r' : ''}`}
      />
    ))
  }
  
  const getRageBar = () => {
    const segments = 5
    const filledSegments = Math.floor((rage / 100) * segments)
    return Array(segments).fill(0).map((_, i) => (
      <div
        key={i}
        className={`h-2 w-4 ${
          i < filledSegments 
            ? 'bg-red-500' 
            : 'bg-gray-600'
        } ${i === 0 ? 'rounded-l' : ''} ${i === segments - 1 ? 'rounded-r' : ''}`}
      />
    ))
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {/* Main AI Panel */}
      <div className={`
        bg-gradient-to-br ${getPersonalityColor()} 
        rounded-lg shadow-2xl border border-black/20 
        transform transition-all duration-300 
        ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        {/* Header */}
        <div className="bg-black/30 px-4 py-2 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getPersonalityEmoji()}</span>
            <h3 className="text-white font-bold text-sm">
              Shark AI: {personality.charAt(0).toUpperCase() + personality.slice(1)}
            </h3>
          </div>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-white/60 hover:text-white text-xs"
          >
            {isVisible ? '−' : '+'}
          </button>
        </div>
        
        {isVisible && (
          <>
            {/* Current Thought */}
            <div className="px-4 py-3 border-b border-black/20">
              <div className="text-white/90 text-sm font-medium mb-1">Current Thought:</div>
              <div className="text-white text-xs italic">
                "{currentThought || 'Processing sensory data...'}"
              </div>
            </div>
            
            {/* Stats */}
            <div className="px-4 py-3 space-y-2">
              {/* Hunger */}
              <div>
                <div className="text-white/80 text-xs mb-1">Hunger</div>
                <div className="flex gap-0.5">{getHungerBar()}</div>
              </div>
              
              {/* Rage */}
              <div>
                <div className="text-white/80 text-xs mb-1">Rage</div>
                <div className="flex gap-0.5">{getRageBar()}</div>
              </div>
              
              {/* Current Target */}
              {currentTarget && (
                <div className="mt-2 pt-2 border-t border-black/20">
                  <div className="text-white/80 text-xs">
                    Target: <span className="text-white font-medium">{currentTarget}</span>
                  </div>
                </div>
              )}
              
              {/* Pattern Recognition */}
              {patternRecognized && (
                <div className="mt-2 pt-2 border-t border-black/20">
                  <div className="text-yellow-300 text-xs font-medium">
                    Pattern Detected! 
                  </div>
                  <div className="text-white/80 text-xs">
                    {patternRecognized.type} ({Math.round(patternRecognized.confidence * 100)}% confidence)
                  </div>
                </div>
              )}
            </div>
            
            {/* Thought History */}
            {thoughtHistory.length > 1 && (
              <div className="px-4 py-2 bg-black/20 rounded-b-lg">
                <div className="text-white/60 text-xs">Previous thoughts:</div>
                {thoughtHistory.slice(1).map((thought, i) => (
                  <div key={i} className="text-white/40 text-xs italic mt-1">
                    • {thought}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Personality Indicator (always visible) */}
      {!isVisible && (
        <div className="mt-2 flex items-center gap-2 bg-black/50 rounded px-3 py-1">
          <span className="text-lg">{getPersonalityEmoji()}</span>
          <span className="text-white text-xs">{personality}</span>
        </div>
      )}
    </div>
  )
}