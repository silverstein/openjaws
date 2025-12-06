"use client"

import { useGameAudio } from "@/hooks/useGameAudio"
import { useState } from "react"

/**
 * VolumeControl - Audio settings UI for the game
 * Positioned in top-right corner, unobtrusive with collapse/expand
 */
export function VolumeControl() {
  const { settings, setVolume, toggleMute, autoplayBlocked, initializeAudio } = useGameAudio()
  const [expanded, setExpanded] = useState(false)

  const handleInitAudio = async () => {
    await initializeAudio()
  }

  return (
    <div className="absolute top-4 right-4 z-50">
      {autoplayBlocked && (
        <button
          onClick={handleInitAudio}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors animate-pulse"
          title="Enable audio"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
          <span className="text-sm font-medium">Enable Audio</span>
        </button>
      )}

      {!autoplayBlocked && (
        <div className="bg-black/70 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 overflow-hidden">
          {/* Collapsed state - just mute button */}
          {!expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="p-3 hover:bg-white/10 transition-colors flex items-center gap-2"
              title={settings.muted ? "Unmute" : "Mute"}
            >
              {settings.muted ? (
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
          )}

          {/* Expanded state - full controls */}
          {expanded && (
            <div className="p-4 min-w-[240px]">
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">Audio Settings</h3>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Collapse"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>

              {/* Mute toggle */}
              <div className="mb-4">
                <button
                  onClick={toggleMute}
                  className={`w-full py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                    settings.muted
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {settings.muted ? "Unmute" : "Mute"}
                </button>
              </div>

              {/* Volume sliders */}
              <div className="space-y-3">
                {/* Master Volume */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Master: {Math.round(settings.masterVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.masterVolume * 100}
                    onChange={(e) => setVolume("master", Number.parseInt(e.target.value) / 100)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                    disabled={settings.muted}
                  />
                </div>

                {/* Music Volume */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Music: {Math.round(settings.musicVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.musicVolume * 100}
                    onChange={(e) => setVolume("music", Number.parseInt(e.target.value) / 100)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                    disabled={settings.muted}
                  />
                </div>

                {/* SFX Volume */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    SFX: {Math.round(settings.sfxVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.sfxVolume * 100}
                    onChange={(e) => setVolume("sfx", Number.parseInt(e.target.value) / 100)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                    disabled={settings.muted}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #4ecdc4;
          cursor: pointer;
          border-radius: 50%;
        }
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #4ecdc4;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
        .slider-thumb:disabled::-webkit-slider-thumb {
          background: #666;
        }
        .slider-thumb:disabled::-moz-range-thumb {
          background: #666;
        }
      `}</style>
    </div>
  )
}
