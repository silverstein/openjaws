"use client"

import { VirtualJoystick } from "./VirtualJoystick"

interface TouchControlsProps {
  onMove: (dx: number, dy: number) => void
  onAbility: () => void
  onSelfie: () => void
  onTalk: () => void
  showTalkButton?: boolean
}

export function TouchControls({
  onMove,
  onAbility,
  onSelfie,
  onTalk,
  showTalkButton = false,
}: TouchControlsProps) {
  const handleButtonPress = (action: () => void) => {
    action()

    // Haptic feedback if supported
    if ("vibrate" in navigator) {
      navigator.vibrate(50)
    }
  }

  return (
    <>
      {/* Virtual Joystick - Bottom Left */}
      <div className="absolute bottom-4 left-4 z-10">
        <VirtualJoystick onMove={onMove} />
        <div className="text-center mt-2 text-white/60 text-xs font-medium backdrop-blur-sm bg-black/20 rounded px-2 py-1">
          Move
        </div>
      </div>

      {/* Action Buttons - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-3">
        {/* Talk Button (conditional) */}
        {showTalkButton && (
          <button
            type="button"
            onPointerDown={() => handleButtonPress(onTalk)}
            className="w-16 h-16 rounded-full bg-green-500/80 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-2xl shadow-lg active:scale-95 transition-transform touch-none"
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            💬
          </button>
        )}

        {/* Row of primary action buttons */}
        <div className="flex gap-3">
          {/* Selfie Button */}
          <button
            type="button"
            onPointerDown={() => handleButtonPress(onSelfie)}
            className="w-16 h-16 rounded-full bg-purple-500/80 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-2xl shadow-lg active:scale-95 transition-transform touch-none"
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            📸
          </button>

          {/* Ability Button */}
          <button
            type="button"
            onPointerDown={() => handleButtonPress(onAbility)}
            className="w-16 h-16 rounded-full bg-cyan-500/80 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-2xl shadow-lg active:scale-95 transition-transform touch-none"
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            ⚡
          </button>
        </div>

        {/* Button Labels */}
        <div className="flex gap-3 text-center">
          <div className="w-16 text-white/60 text-xs font-medium backdrop-blur-sm bg-black/20 rounded px-1 py-1">
            Selfie
          </div>
          <div className="w-16 text-white/60 text-xs font-medium backdrop-blur-sm bg-black/20 rounded px-1 py-1">
            Ability
          </div>
        </div>
      </div>
    </>
  )
}
