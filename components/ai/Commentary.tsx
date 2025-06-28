'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentaryProps {
  isEnabled: boolean;
  style: 'documentary' | 'sports' | 'horror' | 'comedic';
  currentEvent?: string;
  players?: string[];
  sharkHealth?: number;
  intensity?: 'calm' | 'building' | 'intense' | 'climactic';
}

export function Commentary({
  isEnabled,
  style,
  currentEvent,
  players = [],
  sharkHealth = 100,
  intensity = 'calm',
}: CommentaryProps) {
  const [commentary, setCommentary] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastEvent, setLastEvent] = useState('');
  
  useEffect(() => {
    if (!isEnabled || !currentEvent || currentEvent === lastEvent) {
      return;
    }
    
    setLastEvent(currentEvent);
    
    const fetchCommentary = async () => {
      setIsStreaming(true);
      setCommentary('');
      
      try {
        const response = await fetch('/api/commentary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: {
              event: currentEvent,
              players,
              sharkHealth,
              intensity,
              style,
            },
          }),
        });
        
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) return;
        
        let fullCommentary = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          fullCommentary += chunk;
          setCommentary(fullCommentary);
        }
        
        // Clear commentary after 5 seconds
        setTimeout(() => {
          setCommentary('');
        }, 5000);
      } catch (error) {
        console.error('Failed to get commentary:', error);
      } finally {
        setIsStreaming(false);
      }
    };
    
    fetchCommentary();
  }, [isEnabled, currentEvent, players, sharkHealth, intensity, style, lastEvent]);
  
  const getStyleClass = () => {
    switch (style) {
      case 'documentary':
        return 'bg-amber-900/90 text-amber-100 font-serif';
      case 'sports':
        return 'bg-red-900/90 text-white font-bold uppercase';
      case 'horror':
        return 'bg-black/90 text-red-400 font-mono';
      case 'comedic':
        return 'bg-purple-900/90 text-purple-100 font-sans';
      default:
        return 'bg-gray-900/90 text-gray-100';
    }
  };
  
  const getIntensityAnimation = () => {
    switch (intensity) {
      case 'calm':
        return { scale: [1, 1.02, 1], transition: { duration: 3, repeat: Infinity } };
      case 'building':
        return { scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity } };
      case 'intense':
        return { scale: [1, 1.08, 1], transition: { duration: 1, repeat: Infinity } };
      case 'climactic':
        return { scale: [1, 1.1, 1], transition: { duration: 0.5, repeat: Infinity } };
    }
  };
  
  return (
    <AnimatePresence>
      {isEnabled && commentary && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-3xl"
        >
          <motion.div
            animate={getIntensityAnimation()}
            className={`rounded-lg p-6 shadow-2xl backdrop-blur-sm ${getStyleClass()}`}
          >
            <div className="text-center">
              {style === 'sports' && (
                <div className="text-xs mb-2 opacity-80">LIVE COMMENTARY</div>
              )}
              <p className={`${
                style === 'sports' ? 'text-lg' : 'text-base'
              } leading-relaxed`}>
                {commentary}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                )}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Placeholder component notice
export function CommentaryPlaceholder() {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800/80 text-gray-300 p-4 rounded-lg text-sm max-w-xs">
      <h3 className="font-bold mb-2">Commentary System</h3>
      <p>Documentary-style narration will appear here during key game moments.</p>
      <p className="text-xs mt-2 opacity-60">Currently in placeholder mode</p>
    </div>
  );
}