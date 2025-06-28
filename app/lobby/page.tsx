import Link from 'next/link'

export default function LobbyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-200 to-blue-400 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-6xl font-bold text-white text-center mb-8 drop-shadow-lg">
          Beach Panic: Jaws Royale
        </h1>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Welcome to the Lobby!</h2>
          
          <div className="space-y-4">
            <Link 
              href="/game"
              className="block w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-lg text-center text-xl transition-all transform hover:scale-105"
            >
              Start Solo Game
            </Link>
            
            <button 
              disabled
              className="block w-full bg-gray-300 text-gray-500 font-bold py-4 px-6 rounded-lg text-center text-xl cursor-not-allowed"
            >
              Join Multiplayer (Coming Soon)
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-lg mb-2">How to Play:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Use WASD or Arrow Keys to swim</li>
              <li>Press SPACE to activate your special ability</li>
              <li>Complete viral challenges while avoiding the shark</li>
              <li>Sand areas = faster movement, Water = slower movement</li>
              <li>Press ESC during game to return to lobby</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}