'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NPCType } from '@/lib/ai/npcDialogue';

interface NPCDialogueProps {
  npcType: NPCType;
  npcName: string;
  position: { x: number; y: number };
  isPlayerNearby: boolean;
  playerName: string;
  currentEvent?: string;
  onResponse?: (message: string) => void;
}

export function NPCDialogue({
  npcType,
  npcName,
  position,
  isPlayerNearby,
  playerName,
  currentEvent,
  onResponse,
}: NPCDialogueProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [isGreeting, setIsGreeting] = useState(true);
  const hasGreetedRef = useRef(false);
  
  // Get NPC-specific styling
  const getNPCStyle = () => {
    const styles: Record<NPCType, string> = {
      beach_vendor: 'bg-yellow-100 border-yellow-600 text-yellow-900',
      lifeguard: 'bg-red-100 border-red-600 text-red-900',
      tourist: 'bg-pink-100 border-pink-600 text-pink-900',
      surfer: 'bg-blue-100 border-blue-600 text-blue-900',
      scientist: 'bg-green-100 border-green-600 text-green-900',
      reporter: 'bg-purple-100 border-purple-600 text-purple-900',
      old_timer: 'bg-gray-100 border-gray-600 text-gray-900',
    };
    return styles[npcType] || styles.tourist;
  };
  
  // Handle quick reactions to events
  useEffect(() => {
    if (currentEvent && ['shark_spotted', 'player_eaten', 'shark_defeated', 'storm_coming'].includes(currentEvent)) {
      const fetchReaction = async () => {
        try {
          const response = await fetch(
            `/api/npc-chat?action=reaction&npcType=${npcType}&event=${currentEvent}`
          );
          const data = await response.json();
          setMessage(data.reaction);
          setIsGreeting(false);
        } catch (error) {
          console.error('Failed to get NPC reaction:', error);
        }
      };
      
      fetchReaction();
    }
  }, [currentEvent, npcType]);
  
  // Handle greetings when player approaches
  useEffect(() => {
    if (isPlayerNearby && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      
      const fetchGreeting = async () => {
        try {
          const context = {
            npcType,
            npcName,
            playerName,
            currentEvent,
            timeOfDay: 'day', // This would come from game state
            recentSharkSighting: false, // This would come from game state
          };
          
          const response = await fetch(
            `/api/npc-chat?action=greeting&context=${encodeURIComponent(JSON.stringify(context))}`
          );
          const data = await response.json();
          setMessage(data.greeting);
          setIsGreeting(true);
        } catch (error) {
          console.error('Failed to get NPC greeting:', error);
        }
      };
      
      fetchGreeting();
    } else if (!isPlayerNearby) {
      hasGreetedRef.current = false;
      setMessage('');
    }
  }, [isPlayerNearby, npcType, npcName, playerName, currentEvent]);
  
  const handlePlayerMessage = async (playerMessage: string) => {
    setIsTyping(true);
    setMessage('');
    
    try {
      const context = {
        npcType,
        npcName,
        playerName,
        currentEvent,
        timeOfDay: 'day',
        previousMessages: chatHistory,
      };
      
      const response = await fetch('/api/npc-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: playerMessage, context }),
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) return;
      
      let fullMessage = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        fullMessage += chunk;
        setMessage(fullMessage);
      }
      
      setChatHistory([...chatHistory, `Player: ${playerMessage}`, `${npcName}: ${fullMessage}`]);
      onResponse?.(fullMessage);
    } catch (error) {
      console.error('Failed to get NPC response:', error);
    } finally {
      setIsTyping(false);
      setIsGreeting(false);
    }
  };
  
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute z-40"
          style={{
            left: position.x - 100,
            top: position.y - 80,
          }}
        >
          <div className={`relative rounded-lg border-2 p-3 shadow-lg max-w-xs ${getNPCStyle()}`}>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className={`w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 ${
                getNPCStyle().includes('yellow') ? 'border-t-yellow-600' :
                getNPCStyle().includes('red') ? 'border-t-red-600' :
                getNPCStyle().includes('pink') ? 'border-t-pink-600' :
                getNPCStyle().includes('blue') ? 'border-t-blue-600' :
                getNPCStyle().includes('green') ? 'border-t-green-600' :
                getNPCStyle().includes('purple') ? 'border-t-purple-600' :
                'border-t-gray-600'
              }`} />
            </div>
            
            <div className="text-xs font-bold mb-1">{npcName}</div>
            <div className="text-sm">
              {message}
              {isTyping && <span className="inline-block w-1 h-3 bg-current ml-1 animate-pulse" />}
            </div>
            
            {isGreeting && (
              <div className="text-xs mt-2 opacity-60">
                Click to talk
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}