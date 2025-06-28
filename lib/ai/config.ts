import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

// Model configurations with cost optimization
export const models = {
  // Claude 4 - Primary model for shark intelligence
  sharkBrain: anthropic('claude-4-20250514'),
  
  // Gemini 2.0 Flash - Cost-efficient for NPCs
  npcDialogue: google('gemini-2.0-flash-latest'),
  
  // GPT-4 - Backup model for complex scenarios
  complexDecisions: openai('gpt-4-turbo-preview'),
  
  // Commentary model (using Gemini for cost efficiency)
  commentary: google('gemini-2.0-flash-latest'),
} as const;

// Cost-optimized model selection
export function selectModel(purpose: 'shark' | 'npc' | 'commentary' | 'complex') {
  switch (purpose) {
    case 'shark':
      return models.sharkBrain;
    case 'npc':
      return models.npcDialogue;
    case 'commentary':
      return models.commentary;
    case 'complex':
      return models.complexDecisions;
    default:
      return models.npcDialogue; // Default to cheapest
  }
}

// AI Gateway configuration (when available)
export const aiGatewayConfig = {
  enabled: process.env.AI_GATEWAY_ENABLED === 'true',
  endpoint: process.env.AI_GATEWAY_ENDPOINT,
  apiKey: process.env.AI_GATEWAY_API_KEY,
};

// Rate limiting and caching configurations
export const aiConfig = {
  maxTokens: {
    shark: 500,
    npc: 200,
    commentary: 300,
  },
  temperature: {
    shark: 0.7, // Balanced creativity
    npc: 0.8, // More varied responses
    commentary: 0.6, // More consistent narration
  },
  streaming: true,
  cacheTimeout: 60 * 1000, // 1 minute cache for similar requests
};

// Free tier and mock mode configurations
export const freeTierConfig = {
  // API call limits
  FREE_TIER_LIMIT: parseInt(process.env.NEXT_PUBLIC_FREE_TIER_LIMIT || '100'),
  DAILY_RESET_HOUR: 0, // Reset at midnight UTC
  
  // Mock mode settings
  MOCK_MODE_ENABLED: process.env.NEXT_PUBLIC_MOCK_MODE_ENABLED === 'true',
  FORCE_MOCK_MODE: process.env.NEXT_PUBLIC_FORCE_MOCK_MODE === 'true',
  
  // Cache settings
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  CACHE_SIMILARITY_THRESHOLD: 0.7, // 70% context similarity required
  MAX_CACHE_ENTRIES: 100, // Per personality/type
  
  // Response quality settings
  MOCK_QUALITY_THRESHOLD: 0.8, // Quality score above which to prefer cached responses
  PERSONALITY_WEIGHT: 0.8, // How much personality affects responses
  CONTEXT_WEIGHT: 0.7, // How much game context affects responses
  MEMORY_INFLUENCE: 0.6, // How much past encounters affect responses
};

// API usage tracking
export interface APIUsageStats {
  totalCalls: number;
  sharkCalls: number;
  npcCalls: number;
  commentaryCalls: number;
  lastReset: Date;
  currentMode: 'real' | 'mock' | 'cached';
}

// Initialize usage stats
export function getInitialUsageStats(): APIUsageStats {
  return {
    totalCalls: 0,
    sharkCalls: 0,
    npcCalls: 0,
    commentaryCalls: 0,
    lastReset: new Date(),
    currentMode: 'real'
  };
}