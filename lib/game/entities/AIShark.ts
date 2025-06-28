import { Shark } from './Shark';
import type { SharkDecision, SharkPersonality, GameContext } from '@/lib/ai/sharkBrain';
import { Player } from './Player';

export interface AISharkConfig {
  personality: SharkPersonality;
  decisionInterval?: number;
  memoryEnabled?: boolean;
}

export class AIShark extends Shark {
  private personality: SharkPersonality;
  private lastDecision: SharkDecision | null = null;
  private decisionTimer: number = 0;
  private decisionInterval: number;
  private memoryEnabled: boolean;
  private currentTarget: Player | null = null;
  private health: number = 100;
  
  // Callbacks for AI integration
  public onDecisionMade?: (decision: SharkDecision) => void;
  public onMemoryUpdate?: (playerId: string, playerName: string, event: string) => void;
  public onThoughtsUpdate?: (thoughts: string) => void;
  
  constructor(x: number, y: number, config: AISharkConfig) {
    super(x, y);
    
    this.personality = config.personality;
    this.decisionInterval = config.decisionInterval || 3000;
    this.memoryEnabled = config.memoryEnabled ?? true;
  }
  
  public update(delta: number, player: Player | null, allPlayers?: Player[]): void {
    // Update decision timer
    this.decisionTimer += delta;
    
    // Make AI decision if interval has passed
    if (this.decisionTimer >= this.decisionInterval && this.lastDecision) {
      this.decisionTimer = 0;
      this.executeAIDecision(delta, player, allPlayers);
    } else {
      // Use base shark behavior if no AI decision
      super.update(delta, player);
    }
    
    // Check for memory-triggering events
    if (this.memoryEnabled && player) {
      this.checkMemoryEvents(player);
    }
  }
  
  public setAIDecision(decision: SharkDecision): void {
    this.lastDecision = decision;
    this.decisionTimer = 0;
    
    // Update thoughts
    if (decision.innerMonologue && this.onThoughtsUpdate) {
      this.onThoughtsUpdate(decision.innerMonologue);
    }
    
    // Callback
    if (this.onDecisionMade) {
      this.onDecisionMade(decision);
    }
  }
  
  private executeAIDecision(delta: number, currentPlayer: Player | null, allPlayers?: Player[]): void {
    if (!this.lastDecision) return;
    
    const { action, targetPlayerId, destination } = this.lastDecision;
    
    // Find target player
    if (targetPlayerId && allPlayers) {
      this.currentTarget = allPlayers.find(p => p.id === targetPlayerId) || null;
    }
    
    // Execute action based on AI decision
    switch (action) {
      case 'hunt':
        this.executeHunt(destination, this.currentTarget || currentPlayer);
        break;
        
      case 'stalk':
        this.executeStalk(destination, this.currentTarget || currentPlayer);
        break;
        
      case 'ambush':
        this.executeAmbush(destination, this.currentTarget || currentPlayer);
        break;
        
      case 'retreat':
        this.executeRetreat(destination);
        break;
        
      case 'taunt':
        this.executeTaunt(destination, this.currentTarget || currentPlayer);
        break;
        
      case 'investigate':
        this.executeInvestigate(destination);
        break;
        
      default:
        // Fall back to base behavior
        super.update(delta, currentPlayer);
    }
  }
  
  private executeHunt(destination: { x: number; y: number }, target: Player | null): void {
    if (!target) {
      this.moveToward(destination, 2); // Move to last known position
      return;
    }
    
    // Direct pursuit with varying speed based on confidence
    const speed = 3 + (this.lastDecision?.confidence || 0.5) * 2;
    this.moveToward(target.getPosition(), speed);
  }
  
  private executeStalk(destination: { x: number; y: number }, target: Player | null): void {
    if (!target) {
      this.moveToward(destination, 1);
      return;
    }
    
    // Move parallel to target, maintaining distance
    const targetPos = target.getPosition();
    const angle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
    const stalkAngle = angle + Math.PI / 2; // 90 degrees offset
    
    const stalkPos = {
      x: targetPos.x + Math.cos(stalkAngle) * 150,
      y: targetPos.y + Math.sin(stalkAngle) * 150,
    };
    
    this.moveToward(stalkPos, 1.5);
  }
  
  private executeAmbush(destination: { x: number; y: number }, target: Player | null): void {
    const dist = this.getDistanceTo(destination.x, destination.y);
    
    if (dist > 50) {
      // Move quietly to ambush position
      this.moveToward(destination, 1);
    } else if (target && this.getDistanceTo(target.x, target.y) < 100) {
      // Spring the ambush!
      this.moveToward(target.getPosition(), 5);
    }
  }
  
  private executeRetreat(destination: { x: number; y: number }): void {
    // Move away quickly
    this.moveToward(destination, 4);
  }
  
  private executeTaunt(destination: { x: number; y: number }, target: Player | null): void {
    if (!target) return;
    
    // Circle around target
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    const circleAngle = angle + Math.PI / 4;
    
    const tauntPos = {
      x: target.x + Math.cos(circleAngle) * 120,
      y: target.y + Math.sin(circleAngle) * 120,
    };
    
    this.moveToward(tauntPos, 2.5);
  }
  
  private executeInvestigate(destination: { x: number; y: number }): void {
    // Cautious approach
    this.moveToward(destination, 1.2);
  }
  
  private moveToward(destination: { x: number; y: number }, speed: number): void {
    const angle = Math.atan2(destination.y - this.y, destination.x - this.x);
    this.vx += Math.cos(angle) * speed * 0.1;
    this.vy += Math.sin(angle) * speed * 0.1;
  }
  
  private checkMemoryEvents(player: Player): void {
    const dist = this.getDistanceTo(player.x, player.y);
    
    // Check for escape
    if (dist > 300 && dist < 350) {
      if (this.onMemoryUpdate) {
        this.onMemoryUpdate(player.id, player.name || 'Unknown', 'escape');
      }
    }
    
    // Check for damage (would be triggered by game events)
    // This is a placeholder - actual damage detection would come from game logic
  }
  
  public takeDamage(amount: number, fromPlayerId?: string, fromPlayerName?: string): void {
    this.health = Math.max(0, this.health - amount);
    
    if (this.memoryEnabled && fromPlayerId && fromPlayerName && this.onMemoryUpdate) {
      this.onMemoryUpdate(fromPlayerId, fromPlayerName, 'damaged_shark');
    }
    
    // Stun if significant damage
    if (amount > 20) {
      this.stun(1500);
    }
  }
  
  public getHealth(): number {
    return this.health;
  }
  
  public getPersonality(): SharkPersonality {
    return this.personality;
  }
  
  public getGameContext(players: Player[]): GameContext {
    const currentPlayers = players.map(p => ({
      id: p.id,
      name: p.name || 'Unknown',
      position: p.getPosition(),
      health: 100, // Placeholder - would come from player state
      speed: Math.sqrt(p.vx * p.vx + p.vy * p.vy),
      isInWater: true, // Placeholder - would come from game state
    }));
    
    return {
      currentPlayers,
      sharkPosition: this.getPosition(),
      sharkHealth: this.health,
      sharkPersonality: this.personality,
      timeOfDay: 'day', // Placeholder - would come from game state
      weatherCondition: 'calm', // Placeholder - would come from game state
      recentEvents: [], // Would be tracked by game state
      memories: [], // Would be loaded from persistent storage
    };
  }
  
  private getDistanceTo(x: number, y: number): number {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}