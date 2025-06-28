import { GameCanvas } from '@/components/game/GameCanvas'

export default function GamePage() {
  return (
    <main className="w-full h-screen overflow-hidden bg-black">
      <GameCanvas />
      
      {/* Game UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {/* Instructions */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
          <h2 className="text-white font-bold text-lg mb-2">Beach Panic: Jaws Royale</h2>
          <div className="text-white/80 text-sm space-y-1">
            <p>🏊 Use WASD or Arrow Keys to move</p>
            <p>📸 Press F to take selfie (get close to shark!)</p>
            <p>📱 Press SPACE to "Go Live" (ability)</p>
            <p>🎯 Complete objectives for points!</p>
            <p>🏖️ Sand = Faster, 🌊 Water = Shark's domain</p>
            <p>❤️ You have 5 hits before game over</p>
          </div>
        </div>

        {/* Character info - moved to avoid overlap */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 max-w-xs">
          <div className="text-white text-sm">
            <p className="font-bold mb-1">Playing as: The Influencer</p>
            <p className="text-white/60">Special: Going Live (Press Space)</p>
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-white">
            <div className="text-sm text-white/60">
              Press ESC to return to lobby
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}