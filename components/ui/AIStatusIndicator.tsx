'use client';

import { useEffect, useState } from 'react';
import { Settings, Zap, Database, AlertCircle } from 'lucide-react';

interface AIStatus {
  mode: 'real' | 'mock' | 'cached';
  remaining: number;
  totalCalls: number;
  sharkCalls: number;
  npcCalls: number;
  commentaryCalls: number;
}

interface AIStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  devMode?: boolean;
}

export function AIStatusIndicator({ 
  className = '', 
  showDetails = false,
  devMode = false 
}: AIStatusIndicatorProps) {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mockModeOverride, setMockModeOverride] = useState(false);

  useEffect(() => {
    // Fetch initial status
    fetchStatus();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/shark-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch AI status:', error);
    }
  };

  if (!status) return null;

  const getModeIcon = () => {
    switch (status.mode) {
      case 'real':
        return <Zap className="w-4 h-4" />;
      case 'cached':
        return <Database className="w-4 h-4" />;
      case 'mock':
        return <Settings className="w-4 h-4" />;
    }
  };

  const getModeColor = () => {
    switch (status.mode) {
      case 'real':
        return 'text-green-500';
      case 'cached':
        return 'text-blue-500';
      case 'mock':
        return 'text-yellow-500';
    }
  };

  const getModeName = () => {
    switch (status.mode) {
      case 'real':
        return 'Live AI';
      case 'cached':
        return 'Cached';
      case 'mock':
        return 'Mock AI';
    }
  };

  const percentageUsed = Math.round((status.totalCalls / 100) * 100);
  const isLowOnCalls = status.remaining < 20;

  return (
    <div className={`relative ${className}`}>
      {/* Compact indicator */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-black/20 backdrop-blur-sm border border-white/10
          hover:bg-black/30 transition-colors cursor-pointer
          ${isLowOnCalls ? 'animate-pulse' : ''}
        `}
      >
        <div className={`flex items-center gap-1.5 ${getModeColor()}`}>
          {getModeIcon()}
          <span className="text-xs font-medium">{getModeName()}</span>
        </div>
        
        {showDetails && (
          <>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1 text-xs">
              <span className={status.remaining < 20 ? 'text-red-400' : 'text-white/70'}>
                {status.remaining} calls
              </span>
            </div>
          </>
        )}
        
        {isLowOnCalls && (
          <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
        )}
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="absolute top-full mt-2 right-0 w-64 p-4 rounded-lg bg-black/90 backdrop-blur-sm border border-white/20 shadow-xl z-50">
          <h3 className="text-sm font-bold mb-3 text-white">AI System Status</h3>
          
          {/* Mode indicator */}
          <div className="mb-3 p-2 rounded bg-white/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/60">Current Mode</span>
              <div className={`flex items-center gap-1 ${getModeColor()}`}>
                {getModeIcon()}
                <span className="text-xs font-medium">{getModeName()}</span>
              </div>
            </div>
            <div className="text-xs text-white/40 mt-1">
              {status.mode === 'real' && 'Using live AI models'}
              {status.mode === 'cached' && 'Using cached responses'}
              {status.mode === 'mock' && 'Using pre-written responses'}
            </div>
          </div>

          {/* Usage stats */}
          <div className="space-y-2 mb-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">API Usage</span>
                <span className="text-white">{percentageUsed}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    percentageUsed > 80 ? 'bg-red-500' : 
                    percentageUsed > 50 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${percentageUsed}%` }}
                />
              </div>
            </div>

            <div className="text-xs space-y-1 text-white/60">
              <div className="flex justify-between">
                <span>Shark AI:</span>
                <span className="text-white">{status.sharkCalls}</span>
              </div>
              <div className="flex justify-between">
                <span>NPC Chat:</span>
                <span className="text-white">{status.npcCalls}</span>
              </div>
              <div className="flex justify-between">
                <span>Commentary:</span>
                <span className="text-white">{status.commentaryCalls}</span>
              </div>
            </div>
          </div>

          {/* Dev mode toggle */}
          {devMode && (
            <div className="pt-3 border-t border-white/10">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-white/60">Force Mock Mode</span>
                <input
                  type="checkbox"
                  checked={mockModeOverride}
                  onChange={(e) => {
                    setMockModeOverride(e.target.checked);
                    // In a real implementation, this would update the backend
                    console.log('Mock mode override:', e.target.checked);
                  }}
                  className="w-4 h-4 rounded"
                />
              </label>
            </div>
          )}

          {/* Warning message */}
          {isLowOnCalls && (
            <div className="mt-3 p-2 rounded bg-yellow-500/20 border border-yellow-500/40">
              <p className="text-xs text-yellow-300">
                Low on API calls! AI will switch to mock mode soon.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Minimal version for in-game HUD
export function AIStatusBadge() {
  const [mode, setMode] = useState<'real' | 'mock' | 'cached'>('real');
  
  useEffect(() => {
    // Listen for mode changes from response headers
    const checkMode = () => {
      const modeFromHeader = document.querySelector('meta[name="ai-mode"]')?.getAttribute('content');
      if (modeFromHeader) {
        setMode(modeFromHeader as 'real' | 'mock' | 'cached');
      }
    };
    
    checkMode();
    const interval = setInterval(checkMode, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (mode === 'real') return null; // Don't show badge for real mode
  
  return (
    <div className="fixed bottom-4 right-4 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs font-medium text-yellow-400 border border-yellow-400/50">
      {mode === 'mock' ? 'Mock AI' : 'Cached AI'}
    </div>
  );
}