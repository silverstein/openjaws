'use client'

import React, { useState } from 'react'
import { SharkCommentary } from '@/components/ai/SharkCommentary'
import { RecognitionMoment } from '@/components/game/RecognitionMoment'
import { PersonalizedTaunts, TAUNT_TEMPLATES } from '@/components/ai/PersonalizedTaunts'

export default function PsychologicalTestPage() {
  const [testState, setTestState] = useState({
    sharkPersonality: 'theatrical' as const,
    showCommentary: false,
    showRecognition: false,
    showTaunts: false,
    currentTaunt: null as any
  })

  const triggerCommentary = () => {
    setTestState(prev => ({ ...prev, showCommentary: true }))
    setTimeout(() => {
      setTestState(prev => ({ ...prev, showCommentary: false }))
    }, 5000)
  }

  const triggerRecognition = () => {
    setTestState(prev => ({ ...prev, showRecognition: true }))
  }

  const triggerTaunt = (type: keyof typeof TAUNT_TEMPLATES) => {
    const taunts = TAUNT_TEMPLATES[type]
    const randomTaunt = taunts[Math.floor(Math.random() * taunts.length)]
    
    setTestState(prev => ({
      ...prev,
      showTaunts: true,
      currentTaunt: {
        id: `test_${Date.now()}`,
        text: randomTaunt.replace('{name}', 'Test Player'),
        type: type,
        intensity: 'intense' as const
      }
    }))
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Psychological Warfare UI Test</h1>
      
      <div className="space-y-6">
        {/* Controls */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Test Controls</h2>
          
          <div className="space-y-4">
            {/* Personality Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Shark Personality</label>
              <select 
                value={testState.sharkPersonality}
                onChange={(e) => setTestState(prev => ({ ...prev, sharkPersonality: e.target.value as any }))}
                className="bg-gray-700 rounded px-4 py-2 w-full"
              >
                <option value="methodical">Methodical</option>
                <option value="theatrical">Theatrical</option>
                <option value="vengeful">Vengeful</option>
                <option value="philosophical">Philosophical</option>
                <option value="meta">Meta</option>
              </select>
            </div>
            
            {/* Commentary Test */}
            <div>
              <h3 className="font-semibold mb-2">Shark Commentary</h3>
              <button
                onClick={triggerCommentary}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
              >
                Trigger Commentary
              </button>
            </div>
            
            {/* Recognition Moment Test */}
            <div>
              <h3 className="font-semibold mb-2">Recognition Moment</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTestState(prev => ({ ...prev, showRecognition: true }))
                  }}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
                >
                  First Recognition
                </button>
                <button
                  onClick={() => {
                    setTestState(prev => ({ ...prev, showRecognition: true }))
                  }}
                  className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded transition-colors"
                >
                  Nemesis Recognition
                </button>
              </div>
            </div>
            
            {/* Taunts Test */}
            <div>
              <h3 className="font-semibold mb-2">Personalized Taunts</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => triggerTaunt('prediction')}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition-colors"
                >
                  Prediction Taunt
                </button>
                <button
                  onClick={() => triggerTaunt('pattern')}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
                >
                  Pattern Taunt
                </button>
                <button
                  onClick={() => triggerTaunt('behavior')}
                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded transition-colors"
                >
                  Behavior Taunt
                </button>
                <button
                  onClick={() => triggerTaunt('location')}
                  className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded transition-colors"
                >
                  Location Taunt
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Preview Area */}
        <div className="bg-gray-800 p-6 rounded-lg relative h-96 overflow-hidden">
          <h2 className="text-xl font-bold mb-4">Preview Area</h2>
          <div className="text-gray-400 text-sm">UI components will appear here...</div>
          
          {/* Mock shark position */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-2xl">
            🦈
          </div>
        </div>
      </div>
      
      {/* Psychological Warfare Components */}
      <SharkCommentary
        personality={testState.sharkPersonality}
        isThinking={testState.showCommentary}
        currentThought="I sense fear in the water... This prey swims in patterns I've seen before."
        targetName="Test Player"
        recognition={testState.showCommentary ? {
          level: 'known',
          encounters: 7
        } : undefined}
      />
      
      <PersonalizedTaunts
        sharkPosition={{ x: window.innerWidth / 2, y: window.innerHeight - 200 }}
        playerPosition={{ x: window.innerWidth / 2, y: window.innerHeight - 300 }}
        personality={testState.sharkPersonality}
        currentTaunt={testState.currentTaunt}
        isActive={testState.showTaunts}
      />
      
      <RecognitionMoment
        isActive={testState.showRecognition}
        playerName="Test Player"
        memories={[
          { encounter: 'First blood in the shallows', outcome: 'You barely escaped', timestamp: '3 games ago' },
          { encounter: 'The rock hiding trick', outcome: 'I learned your pattern', timestamp: '2 games ago' },
          { encounter: 'Speed boost to the left', outcome: 'Predictable as always', timestamp: 'Last game' }
        ]}
        recognitionLevel="nemesis"
        onComplete={() => setTestState(prev => ({ ...prev, showRecognition: false }))}
      />
    </div>
  )
}