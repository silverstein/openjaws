"use client"

interface TouchActionButtonsProps {
  canPickup: boolean
  hasHeldItem: boolean
  heldItemType?: string
  onPickup: () => void
  onThrow: () => void
}

export function TouchActionButtons({
  canPickup,
  hasHeldItem,
  heldItemType,
  onPickup,
  onThrow,
}: TouchActionButtonsProps) {
  const handleButtonPress = (action: () => void) => {
    action()

    // Haptic feedback if supported
    if ("vibrate" in navigator) {
      navigator.vibrate(50)
    }
  }

  // Only show on touch devices
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0)

  if (!isTouchDevice) {
    return null
  }

  // Don't show anything if no actions are available
  if (!canPickup && !hasHeldItem) {
    return null
  }

  return (
    <div className="absolute bottom-24 right-4 z-10 flex flex-col gap-3">
      {/* Throw Button - only show when holding an item */}
      {hasHeldItem && (
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onPointerDown={() => handleButtonPress(onThrow)}
            className="w-16 h-16 rounded-full bg-orange-500/80 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-2xl shadow-lg active:scale-95 transition-transform touch-none"
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
            aria-label="Throw item"
          >
            🎯
          </button>
          <div className="text-white/60 text-xs font-medium backdrop-blur-sm bg-black/20 rounded px-2 py-1">
            Throw
          </div>
          {heldItemType && (
            <div className="text-white/80 text-xs font-medium backdrop-blur-sm bg-cyan-500/40 rounded px-2 py-1">
              {heldItemType}
            </div>
          )}
        </div>
      )}

      {/* Pickup Button - only show when near an item */}
      {canPickup && !hasHeldItem && (
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onPointerDown={() => handleButtonPress(onPickup)}
            className="w-16 h-16 rounded-full bg-amber-500/80 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-2xl shadow-lg active:scale-95 transition-transform touch-none animate-pulse"
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
            aria-label="Pick up item"
          >
            📦
          </button>
          <div className="text-white/60 text-xs font-medium backdrop-blur-sm bg-black/20 rounded px-2 py-1">
            Pick Up
          </div>
        </div>
      )}
    </div>
  )
}
