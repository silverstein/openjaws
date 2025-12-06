"use client"

import { VirtualJoystick } from "./VirtualJoystick"
import { useIsLandscape } from "@/hooks/useIsLandscape"

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
  const isLandscape = useIsLandscape()

  const handleButtonPress = (action: () => void) => {
    action()

    // Haptic feedback if supported
    if ("vibrate" in navigator) {
      navigator.vibrate(50)
    }
  }

  // Landscape mode: controls on sides, vertically centered
  if (isLandscape) {
    return (
      <>
        {/* Virtual Joystick - Left side, vertically centered */}
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
          style={{ paddingLeft: "env(safe-area-inset-left, 0px)" }}
        >
          <VirtualJoystick onMove={onMove} />
        </div>

        {/* Action Buttons - Right side, vertically centered */}
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2"
          style={{ paddingRight: "env(safe-area-inset-right, 0px)" }}
        >
          {/* Talk Button (conditional) */}
          {showTalkButton && (
            <button
              type="button"
              onPointerDown={() => handleButtonPress(onTalk)}
              className="w-12 h-12 rounded-full bg-green-500/90 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center text-lg shadow-lg active:scale-90 transition-transform touch-none select-none"
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
            >
              💬
            </button>
          )}

          {/* Selfie Button */}
          <button
            type="button"
            onPointerDown={() => handleButtonPress(onSelfie)}
            className="w-12 h-12 rounded-full bg-purple-500/90 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center text-lg shadow-lg active:scale-90 transition-transform touch-none select-none"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
          >
            📸
          </button>

          {/* Ability Button */}
          <button
            type="button"
            onPointerDown={() => handleButtonPress(onAbility)}
            className="w-12 h-12 rounded-full bg-cyan-500/90 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center text-lg shadow-lg active:scale-90 transition-transform touch-none select-none"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
          >
            ⚡
          </button>
        </div>
      </>
    )
  }

  // Portrait mode: controls at bottom
  return (
    <>
      {/* Virtual Joystick - Bottom Left with safe area */}
      <div
        className="absolute bottom-4 left-4 z-10"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <VirtualJoystick onMove={onMove} />
        <div className="text-center mt-1 text-white/50 text-[10px] font-medium">
          MOVE
        </div>
      </div>

      {/* Action Buttons - Bottom Right with safe area */}
      <div
        className="absolute bottom-4 right-4 z-10 flex flex-col gap-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Talk Button (conditional) */}
        {showTalkButton && (
          <button
            type="button"
            onPointerDown={() => handleButtonPress(onTalk)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/90 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center text-xl sm:text-2xl shadow-lg active:scale-90 transition-transform touch-none select-none"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
          >
            💬
          </button>
        )}

        {/* Row of primary action buttons */}
        <div className="flex gap-2 sm:gap-3">
          {/* Selfie Button */}
          <button
            type="button"
            onPointerDown={() => handleButtonPress(onSelfie)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-500/90 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center text-xl sm:text-2xl shadow-lg active:scale-90 transition-transform touch-none select-none"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
          >
            📸
          </button>

          {/* Ability Button */}
          <button
            type="button"
            onPointerDown={() => handleButtonPress(onAbility)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-cyan-500/90 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center text-xl sm:text-2xl shadow-lg active:scale-90 transition-transform touch-none select-none"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
          >
            ⚡
          </button>
        </div>

        {/* Compact labels */}
        <div className="flex gap-2 sm:gap-3 justify-center">
          <span className="text-white/50 text-[10px] w-14 sm:w-16 text-center">SELFIE</span>
          <span className="text-white/50 text-[10px] w-14 sm:w-16 text-center">ABILITY</span>
        </div>
      </div>
    </>
  )
}
