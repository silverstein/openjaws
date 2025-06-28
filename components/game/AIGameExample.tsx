'use client';

import { useEffect, useRef, useState } from 'react';
import { AIShark } from '@/lib/game/entities/AIShark';
import { Player } from '@/lib/game/entities/Player';
import { useSharkAI } from '@/lib/ai/hooks/useSharkAI';
import { useNPCSystem } from '@/lib/ai/hooks/useNPCSystem';
import { SharkThoughts } from '@/components/ai/SharkThoughts';
import { NPCDialogue } from '@/components/ai/NPCDialogue';
import { Commentary } from '@/components/ai/Commentary';
import type { SharkPersonality } from '@/lib/ai/sharkBrain';

// This is an example integration component showing how to use the AI system
export function AIGameExample() {
  const [selectedPersonality, setSelectedPersonality] = useState<SharkPersonality>('theatrical');
  const [showThoughts, setShowThoughts] = useState(true);
  const [enableCommentary, setEnableCommentary] = useState(false);
  
  const sharkRef = useRef<AIShark>();
  const playersRef = useRef<Player[]>([]);
  
  // Initialize AI hooks
  const {
    currentDecision,
    memories,
    thoughts,
    makeDecision,
    updateMemory,
    startAutoDecisions,
    stopAutoDecisions,
  } = useSharkAI({
    personality: selectedPersonality,
    decisionInterval: 3000,
    enableThoughts: showThoughts,
  });
  
  const {
    npcs,
    spawnNPC,
    triggerEvent,
    getNearbyNPCs,
  } = useNPCSystem({
    maxActiveNPCs: 5,
    interactionRadius: 100,
  });
  
  useEffect(() => {
    // Initialize game entities
    sharkRef.current = new AIShark(400, 300, {
      personality: selectedPersonality,
      memoryEnabled: true,
    });
    
    // Create some example players
    playersRef.current = [
      new Player(200, 200, { id: '1', name: 'Player 1', isLocalPlayer: true }),
      new Player(600, 200, { id: '2', name: 'Player 2', isLocalPlayer: false }),
    ];
    
    // Set up AI callbacks
    if (sharkRef.current) {
      sharkRef.current.onDecisionMade = (decision) => {
        console.log('Shark AI Decision:', decision);
      };
      
      sharkRef.current.onMemoryUpdate = (playerId, playerName, event) => {
        updateMemory(playerId, playerName, event as any);
      };
      
      sharkRef.current.onThoughtsUpdate = (newThoughts) => {
        console.log('Shark thoughts:', newThoughts);
      };
    }
    
    // Spawn some NPCs
    spawnNPC('lifeguard', { x: 100, y: 100 });
    spawnNPC('beach_vendor', { x: 700, y: 100 });
    spawnNPC('surfer', { x: 400, y: 500 });
    
    // Start AI decision making
    startAutoDecisions(() => {
      if (sharkRef.current && playersRef.current.length > 0) {
        return sharkRef.current.getGameContext(playersRef.current);
      }
      return null as any;
    });
    
    return () => {
      stopAutoDecisions();
    };
  }, [selectedPersonality, updateMemory, startAutoDecisions, stopAutoDecisions, spawnNPC]);
  
  // Update shark with AI decisions
  useEffect(() => {
    if (currentDecision && sharkRef.current) {
      sharkRef.current.setAIDecision(currentDecision);
    }
  }, [currentDecision]);
  
  // Example event handlers
  const handleSharkSpotted = () => {
    triggerEvent('shark_spotted');
  };
  
  const handlePlayerEaten = () => {
    triggerEvent('player_eaten');
    if (sharkRef.current && playersRef.current[0]) {
      updateMemory(
        playersRef.current[0].id,
        playersRef.current[0].name || 'Unknown',
        'killed'
      );
    }
  };
  
  const handleSharkDefeated = () => {
    triggerEvent('shark_defeated');
  };
  
  return (
    <div className="relative w-full h-screen bg-blue-100">
      {/* Control Panel */}
      <div className="absolute top-4 right-4 bg-white/90 p-4 rounded-lg shadow-lg z-50 space-y-4">
        <h3 className="font-bold text-lg mb-2">AI Controls</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1">Shark Personality</label>
          <select
            value={selectedPersonality}
            onChange={(e) => setSelectedPersonality(e.target.value as SharkPersonality)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="methodical">Methodical Hunter</option>
            <option value="theatrical">Theatrical Showman</option>
            <option value="vengeful">Vengeful Predator</option>
            <option value="philosophical">Philosophical Thinker</option>
            <option value="meta">Meta-Aware</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showThoughts}
              onChange={(e) => setShowThoughts(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show Shark Thoughts</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enableCommentary}
              onChange={(e) => setEnableCommentary(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Enable Commentary</span>
          </label>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={handleSharkSpotted}
            className="w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Trigger: Shark Spotted
          </button>
          <button
            onClick={handlePlayerEaten}
            className="w-full px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Trigger: Player Eaten
          </button>
          <button
            onClick={handleSharkDefeated}
            className="w-full px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Trigger: Shark Defeated
          </button>
        </div>
        
        <div className="text-xs space-y-1">
          <div>Memories: {memories.length}</div>
          <div>NPCs Active: {npcs.length}</div>
          <div>Current Action: {currentDecision?.action || 'None'}</div>
        </div>
      </div>
      
      {/* AI Components */}
      <SharkThoughts
        isVisible={showThoughts}
        personality={selectedPersonality}
        recentAction={currentDecision?.action}
        gameContext={sharkRef.current?.getGameContext(playersRef.current)}
      />
      
      {/* NPC Dialogues */}
      {npcs.map(npc => (
        <NPCDialogue
          key={npc.id}
          npcType={npc.type}
          npcName={npc.name}
          position={npc.position}
          isPlayerNearby={true} // Would be calculated based on player position
          playerName={playersRef.current[0]?.name || 'Player'}
          currentEvent={npc.currentMessage ? 'shark_nearby' : undefined}
        />
      ))}
      
      {/* Commentary */}
      <Commentary
        isEnabled={enableCommentary}
        style="documentary"
        currentEvent={currentDecision?.action}
        players={playersRef.current.map(p => p.name || 'Unknown')}
        sharkHealth={sharkRef.current?.getHealth()}
        intensity={
          currentDecision?.action === 'attacking' ? 'climactic' :
          currentDecision?.action === 'hunting' ? 'intense' :
          currentDecision?.action === 'stalk' ? 'building' :
          'calm'
        }
      />
      
      {/* Game Canvas would go here */}
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">AI Game Integration Example</h2>
          <p>This demonstrates how the AI systems integrate with the game.</p>
          <p className="text-sm mt-2">The actual game canvas would render here.</p>
        </div>
      </div>
    </div>
  );
}