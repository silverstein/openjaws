"use client"

import { useEffect, useRef, useState } from "react"
import { useIsLandscape } from "@/hooks/useIsLandscape"

interface VirtualJoystickProps {
  onMove: (dx: number, dy: number) => void
}

export function VirtualJoystick({ onMove }: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const currentDelta = useRef({ dx: 0, dy: 0 })
  const isLandscape = useIsLandscape()

  useEffect(() => {
    const container = containerRef.current
    const stick = stickRef.current

    if (!container || !stick) {
      return
    }

    // Smaller max distance in landscape due to smaller joystick
    const maxDistance = isLandscape ? 30 : 40

    const handleStart = (clientX: number, clientY: number) => {
      setIsDragging(true)
      updateStickPosition(clientX, clientY)
    }

    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging) {
        return
      }
      updateStickPosition(clientX, clientY)
    }

    const handleEnd = () => {
      setIsDragging(false)
      // Reset stick to center
      if (stick) {
        stick.style.transform = "translate(-50%, -50%)"
      }
      currentDelta.current = { dx: 0, dy: 0 }
      onMove(0, 0)
    }

    const updateStickPosition = (clientX: number, clientY: number) => {
      if (!container || !stick) {
        return
      }

      const rect = container.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate offset from center
      let offsetX = clientX - centerX
      let offsetY = clientY - centerY

      // Calculate distance from center
      const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY)

      // Limit to maxDistance
      if (distance > maxDistance) {
        const angle = Math.atan2(offsetY, offsetX)
        offsetX = Math.cos(angle) * maxDistance
        offsetY = Math.sin(angle) * maxDistance
      }

      // Update stick visual position
      stick.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`

      // Normalize to -1 to 1 range
      const normalizedX = offsetX / maxDistance
      const normalizedY = offsetY / maxDistance

      // Update current delta
      currentDelta.current = {
        dx: normalizedX,
        dy: normalizedY,
      }
    }

    // Continuous update loop for smooth movement
    const updateLoop = () => {
      if (isDragging) {
        onMove(currentDelta.current.dx * 2, currentDelta.current.dy * 2)
      }
      animationFrameRef.current = requestAnimationFrame(updateLoop)
    }
    updateLoop()

    // Mouse events
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      handleStart(e.clientX, e.clientY)
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault()
        handleMove(e.clientX, e.clientY)
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      handleEnd()
    }

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      if (touch) {
        handleStart(touch.clientX, touch.clientY)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      if (touch && isDragging) {
        handleMove(touch.clientX, touch.clientY)
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      handleEnd()
    }

    // Add event listeners
    container.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)

    container.addEventListener("touchstart", onTouchStart, { passive: false })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", onTouchEnd, { passive: false })

    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      container.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)

      container.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
    }
  }, [isDragging, onMove, isLandscape])

  // Smaller joystick in landscape to save screen space
  const containerSize = isLandscape ? "w-24 h-24" : "w-32 h-32"
  const stickSize = isLandscape ? "w-12 h-12" : "w-16 h-16"
  const centerDotSize = isLandscape ? "w-3 h-3" : "w-4 h-4"

  return (
    <div
      ref={containerRef}
      className={`relative ${containerSize} rounded-full bg-black/30 backdrop-blur-sm border-2 border-white/20 touch-none`}
      style={{
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/40 rounded-full transform -translate-x-1/2 -translate-y-1/2" />

      {/* Movable stick */}
      <div
        ref={stickRef}
        className={`absolute top-1/2 left-1/2 ${stickSize} rounded-full bg-white/50 backdrop-blur-sm border-2 border-white/40 transform -translate-x-1/2 -translate-y-1/2 transition-all pointer-events-none ${
          isDragging ? "scale-110 bg-white/60" : ""
        }`}
        style={{
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {/* Direction indicators */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${centerDotSize} rounded-full bg-cyan-400/60`} />
        </div>
      </div>
    </div>
  )
}
