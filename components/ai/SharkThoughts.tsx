'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SharkPersonality } from '@/lib/ai/sharkBrain';

interface SharkThoughtsProps {
  isVisible: boolean;
  personality: SharkPersonality;
  recentAction?: string;
  gameContext?: any; // Will be properly typed when integrated
}

export function SharkThoughts({ isVisible, personality, recentAction = 'hunting', gameContext }: SharkThoughtsProps) {
  const [thoughts, setThoughts] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  useEffect(() => {
    if (!isVisible || !gameContext) {
      setThoughts('');
      return;
    }
    
    const streamThoughts = async () => {
      setIsStreaming(true);
      setThoughts('');
      
      try {
        const params = new URLSearchParams({
          context: JSON.stringify(gameContext),
          action: recentAction,
        });
        
        const response = await fetch(`/api/shark-brain?${params}`);
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) return;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          setThoughts(prev => prev + chunk);
        }
      } catch (error) {
        console.error('Failed to stream thoughts:', error);
        setThoughts('...');
      } finally {
        setIsStreaming(false);
      }
    };
    
    streamThoughts();
  }, [isVisible, recentAction, gameContext]);
  
  const getPersonalityStyle = () => {
    switch (personality) {
      case 'methodical':
        return 'bg-blue-950/80 border-blue-700 text-blue-100';
      case 'theatrical':
        return 'bg-purple-950/80 border-purple-700 text-purple-100';
      case 'vengeful':
        return 'bg-red-950/80 border-red-700 text-red-100';
      case 'philosophical':
        return 'bg-gray-900/80 border-gray-600 text-gray-100';
      case 'meta':
        return 'bg-green-950/80 border-green-700 text-green-100';
      default:
        return 'bg-gray-900/80 border-gray-700 text-gray-100';
    }
  };
  
  const getPersonalityIcon = () => {
    switch (personality) {
      case 'methodical': return '🧮';
      case 'theatrical': return '🎭';
      case 'vengeful': return '💀';
      case 'philosophical': return '🤔';
      case 'meta': return '🎮';
      default: return '🦈';
    }
  };
  
  return (
    <AnimatePresence>
      {isVisible && thoughts && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 max-w-md z-50"
        >
          <div className={`rounded-lg border-2 p-4 shadow-2xl backdrop-blur-sm ${getPersonalityStyle()}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl" role="img" aria-label={personality}>
                {getPersonalityIcon()}
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-bold mb-1 opacity-80">
                  Shark's Inner Monologue
                </h3>
                <p className="text-sm italic">
                  "{thoughts}"
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                  )}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}