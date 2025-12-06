"use client"

import { useState } from "react"
import { AIStatusBadge, AIStatusIndicator } from "@/components/ui/AIStatusIndicator"

export default function AIStatusDemo() {
  const [showBadge, setShowBadge] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">AI Status System Demo</h1>

        <div className="space-y-8">
          {/* Status Indicator Demo */}
          <section className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-semibold mb-4">AI Status Indicator</h2>
            <p className="text-white/70 mb-6">
              This component shows the current AI mode and remaining API calls. Click on it to see
              detailed statistics.
            </p>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-2">Compact View</h3>
                <AIStatusIndicator />
              </div>

              <div>
                <h3 className="text-sm font-medium text-white/60 mb-2">With Details</h3>
                <AIStatusIndicator showDetails={true} />
              </div>

              <div>
                <h3 className="text-sm font-medium text-white/60 mb-2">Dev Mode</h3>
                <AIStatusIndicator showDetails={true} devMode={true} />
              </div>
            </div>
          </section>

          {/* Badge Demo */}
          <section className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-semibold mb-4">In-Game Status Badge</h2>
            <p className="text-white/70 mb-6">
              This minimal badge appears in-game when using mock or cached AI. It stays hidden
              during real AI mode to avoid distraction.
            </p>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowBadge(!showBadge)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Toggle Badge
              </button>

              <span className="text-sm text-white/60">
                {showBadge ? "Badge is visible (when not in real mode)" : "Badge is hidden"}
              </span>
            </div>
          </section>

          {/* API Testing */}
          <section className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-semibold mb-4">Test API Calls</h2>
            <p className="text-white/70 mb-6">
              Test different AI endpoints to see how the system tracks usage.
            </p>

            <div className="grid grid-cols-3 gap-4">
              <TestButton
                label="Test Shark AI"
                endpoint="/api/shark-brain"
                payload={{ action: "stats" }}
              />
              <TestButton
                label="Test NPC Chat"
                endpoint="/api/npc-chat"
                payload={{
                  action: "greeting",
                  context:
                    '{"npcType":"surfer","npcName":"Kai","playerName":"Player","timeOfDay":"day"}',
                }}
              />
              <TestButton
                label="Test Commentary"
                endpoint="/api/commentary"
                payload={{
                  context: {
                    event: "shark spotted",
                    players: ["Player1"],
                    sharkHealth: 100,
                    intensity: "building",
                    style: "documentary",
                  },
                }}
              />
            </div>
          </section>

          {/* Mock Mode Info */}
          <section className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-semibold mb-4">Mock AI System</h2>
            <div className="space-y-4 text-white/70">
              <p>The mock AI system provides intelligent responses without using API calls:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Pattern-based responses that match shark personalities</li>
                <li>Context-aware decision making</li>
                <li>Memory system that tracks player interactions</li>
                <li>Caching of real AI responses for reuse</li>
                <li>Automatic fallback when API limit is reached</li>
              </ul>
              <p>
                Players should experience minimal difference between real and mock AI, ensuring a
                consistent gameplay experience even in free tier mode.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Floating badge */}
      {showBadge && <AIStatusBadge />}
    </div>
  )
}

function TestButton({
  label,
  endpoint,
  payload,
}: {
  label: string
  endpoint: string
  payload: Record<string, unknown>
}) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<Record<string, unknown> | null>(null)

  const handleTest = async () => {
    setLoading(true)
    try {
      const res = await fetch(endpoint, {
        method: endpoint === "/api/commentary" ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body: endpoint === "/api/commentary" ? JSON.stringify(payload) : undefined,
      })

      const data = await res.json()
      setResponse({
        mode: res.headers.get("X-AI-Mode"),
        remaining: res.headers.get("X-API-Calls-Remaining"),
        data,
      })
    } catch (error) {
      console.error("Test failed:", error)
      setResponse({ error: "Failed" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleTest}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors"
      >
        {loading ? "Testing..." : label}
      </button>
      {response && (
        <div className="mt-2 text-xs text-white/60">
          Mode: {(response["mode"] as string) || "N/A"}
          <br />
          Calls left: {(response["remaining"] as string) || "N/A"}
        </div>
      )}
    </div>
  )
}
