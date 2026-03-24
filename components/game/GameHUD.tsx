"use client"

import type { Player } from "@/lib/game/entities/Player"
import type { NPC } from "@/lib/game/entities/NPC"
import type { BeachItem } from "@/lib/game/entities/BeachItem"
import type { HarpoonStation } from "@/lib/game/entities/HarpoonStation"
import type { FishType } from "@/lib/game/entities/Fish"
import Minimap from "./Minimap"
import { TouchActionButtons } from "./TouchActionButtons"

interface GameHUDProps {
  hudVisible: boolean
  setHudVisible: (fn: (prev: boolean) => boolean) => void
  controlsOpen: boolean
  setControlsOpen: (open: boolean) => void
  playerRef: React.RefObject<Player | null>
  sharkRef: React.RefObject<{ x: number; y: number } | null>
  playerPoints: number
  playerFishInventory: FishType[]
  orangeBuffActive: boolean
  orangeBuffTimeLeft: number
  heldItem: BeachItem | null
  canPickupItem: boolean
  minimapVisible: boolean
  setMinimapVisible: (v: boolean) => void
  harpoonStations: HarpoonStation[]
  aiExpanded: boolean
  setAiExpanded: (fn: (prev: boolean) => boolean) => void
  aiThoughts: string
  nearbyNPC: NPC | null
  activeNPC: NPC | null
  onPickup: () => void
  onThrow: () => void
}

export function GameHUD({
  hudVisible,
  setHudVisible,
  controlsOpen,
  setControlsOpen,
  playerRef,
  sharkRef,
  playerPoints,
  playerFishInventory,
  orangeBuffActive,
  orangeBuffTimeLeft,
  heldItem,
  canPickupItem,
  minimapVisible,
  setMinimapVisible,
  harpoonStations,
  aiExpanded,
  setAiExpanded,
  aiThoughts,
  nearbyNPC,
  activeNPC,
  onPickup,
  onThrow,
}: GameHUDProps) {
  if (!hudVisible && !nearbyNPC) return null

  return (
    <>
      {/* Player Status */}
      {hudVisible && (
        <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-30 bg-black/50 text-white px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg shadow-md w-48 sm:w-56 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold">Player</h3>
            <div className="text-[11px] text-white/70 font-mono">💰 {playerPoints}</div>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-white/70">HP</span>
                <span>{Math.round(playerRef.current?.health || 100)}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded">
                <div
                  className="h-full bg-red-500 rounded transition-all"
                  style={{ width: `${playerRef.current?.health || 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-white/70">Stam</span>
                <span>{Math.round(playerRef.current?.stamina || 100)}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded">
                <div
                  className={`h-full rounded transition-all ${
                    (playerRef.current?.stamina || 100) > 50
                      ? "bg-green-500"
                      : (playerRef.current?.stamina || 100) > 25
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${(playerRef.current?.stamina ?? 100)}%` }}
                />
              </div>
            </div>
            {orangeBuffActive && (
              <div className="text-orange-300 text-[11px] flex items-center gap-1">
                🍊 Speed ({orangeBuffTimeLeft}s)
              </div>
            )}
            {heldItem && (
              <div className="text-cyan-300 text-[11px] flex items-center gap-1">
                🏖️ {heldItem.type}
              </div>
            )}
            <div className="flex items-center gap-2 text-[11px] text-cyan-200">
              🐟 {playerFishInventory.length}
            </div>
          </div>
        </div>
      )}

      {/* Controls chip + HUD toggle */}
      {hudVisible && (
        <div className="fixed bottom-3 left-3 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setControlsOpen(true)}
            className="bg-black/55 text-white text-xs sm:text-sm px-3 py-1.5 rounded-full shadow-md backdrop-blur hover:bg-black/70 transition"
          >
            Controls (C)
          </button>
          <button
            type="button"
            onClick={() => setHudVisible(prev => !prev)}
            className="bg-black/40 text-white/80 text-xs px-2.5 py-1 rounded-full border border-white/10 hover:border-white/30 transition"
            title="Toggle HUD (H)"
          >
            HUD
          </button>
        </div>
      )}

      {/* Controls modal */}
      {controlsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="bg-black/80 border border-white/10 rounded-xl p-4 sm:p-6 max-w-md w-[92vw] text-white shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Controls</h3>
              <button
                type="button"
                onClick={() => setControlsOpen(false)}
                className="text-white/70 hover:text-white text-sm px-2 py-1 rounded-md hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-white/60">Move</span><span>WASD / Arrows</span>
              <span className="text-white/60">Ability</span><span>Space</span>
              <span className="text-white/60">Selfie/Harpoon</span><span>F</span>
              <span className="text-white/60">Interact</span><span>E</span>
              <span className="text-white/60">Shop</span><span>Q/R</span>
              <span className="text-white/60">Throw Bait</span><span>T (water)</span>
              <span className="text-white/60">Boat/Sleep</span><span>B</span>
              <span className="text-white/60">Beach House</span><span>X</span>
              <span className="text-white/60">Items</span><span>G / C</span>
            </div>
          </div>
        </div>
      )}

      {/* Minimap */}
      {hudVisible && (
        <div className="fixed top-2 left-2 sm:top-3 sm:left-3 z-30 flex flex-col gap-2 sm:gap-3">
          <Minimap
            playerPos={{ x: playerRef.current?.x || 0, y: playerRef.current?.y || 0 }}
            sharkPos={{ x: sharkRef.current?.x || 0, y: sharkRef.current?.y || 0 }}
            sharkRotation={0}
            stations={harpoonStations.map(s => ({ x: s.x, y: s.y }))}
            worldSize={{ width: typeof window !== 'undefined' ? window.innerWidth : 800, height: typeof window !== 'undefined' ? window.innerHeight : 600 }}
            waterLineY={typeof window !== 'undefined' ? window.innerHeight * 0.3 : 180}
            visible={minimapVisible}
            onToggle={() => setMinimapVisible(!minimapVisible)}
          />
        </div>
      )}

      {/* Shark AI badge */}
      {hudVisible && (
        <button
          type="button"
          onClick={() => setAiExpanded(prev => !prev)}
          className="fixed bottom-4 right-4 z-30 bg-purple-600/80 hover:bg-purple-600 text-white text-sm px-3 py-2 rounded-lg shadow-md backdrop-blur flex items-center gap-2 transition"
        >
          <span>🧠</span>
          <span className="text-xs sm:text-sm line-clamp-1 max-w-[160px]">
            {aiThoughts || "Processing..."}
          </span>
          <span className="text-[11px] text-white/80">{aiExpanded ? "Close" : "Open"}</span>
        </button>
      )}

      {/* Touch action buttons */}
      <TouchActionButtons
        canPickup={canPickupItem}
        hasHeldItem={!!heldItem}
        heldItemType={heldItem?.type}
        onPickup={onPickup}
        onThrow={onThrow}
      />

      {/* NPC interaction prompt */}
      {nearbyNPC && !activeNPC && (
        <div className="absolute left-1/2 bottom-32 transform -translate-x-1/2 animate-bounce">
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center backdrop-blur-sm border border-white/20">
            <div className="text-sm font-medium">{nearbyNPC.npcName}</div>
            <div className="text-xs text-cyan-400 mt-1">Press E to talk</div>
          </div>
        </div>
      )}
    </>
  )
}
