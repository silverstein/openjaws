'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { SharkDecision, SharkMemory, SharkPersonality, GameContext } from '../sharkBrain';

interface UseSharkAIOptions {
  personality: SharkPersonality;
  decisionInterval?: number; // milliseconds between decisions
  enableThoughts?: boolean;
}

export function useSharkAI({
  personality,
  decisionInterval = 3000,
  enableThoughts = true,
}: UseSharkAIOptions) {
  const [currentDecision, setCurrentDecision] = useState<SharkDecision | null>(null);
  const [memories, setMemories] = useState<SharkMemory[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [thoughts, setThoughts] = useState('');
  
  const decisionTimerRef = useRef<NodeJS.Timeout>();
  const lastContextRef = useRef<GameContext>();
  
  const makeDecision = useCallback(async (context: GameContext) => {
    if (isThinking) return;
    
    setIsThinking(true);
    lastContextRef.current = context;
    
    try {
      const response = await fetch('/api/shark-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decide',
          context: {
            ...context,
            memories,
            sharkPersonality: personality,
          },
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get decision');
      
      const decision = await response.json() as SharkDecision;
      setCurrentDecision(decision);
      
      // Stream thoughts if enabled
      if (enableThoughts && decision.innerMonologue) {
        setThoughts(decision.innerMonologue);
      }
      
      return decision;
    } catch (error) {
      console.error('Shark AI decision error:', error);
      return null;
    } finally {
      setIsThinking(false);
    }
  }, [personality, memories, isThinking, enableThoughts]);
  
  const updateMemory = useCallback(async (
    playerId: string,
    playerName: string,
    event: 'encounter' | 'escape' | 'damaged_shark' | 'killed'
  ) => {
    try {
      const response = await fetch('/api/shark-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateMemory',
          context: {
            memories,
            playerId,
            playerName,
            event,
          },
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update memory');
      
      const { memories: updatedMemories } = await response.json();
      setMemories(updatedMemories);
    } catch (error) {
      console.error('Failed to update shark memory:', error);
    }
  }, [memories]);
  
  // Auto-decision making
  const startAutoDecisions = useCallback((getContext: () => GameContext) => {
    const makeAutoDecision = async () => {
      const context = getContext();
      if (context) {
        await makeDecision(context);
      }
    };
    
    // Initial decision
    makeAutoDecision();
    
    // Set up interval
    decisionTimerRef.current = setInterval(makeAutoDecision, decisionInterval);
  }, [makeDecision, decisionInterval]);
  
  const stopAutoDecisions = useCallback(() => {
    if (decisionTimerRef.current) {
      clearInterval(decisionTimerRef.current);
      decisionTimerRef.current = undefined;
    }
  }, []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      stopAutoDecisions();
    };
  }, [stopAutoDecisions]);
  
  return {
    currentDecision,
    memories,
    isThinking,
    thoughts,
    makeDecision,
    updateMemory,
    startAutoDecisions,
    stopAutoDecisions,
  };
}