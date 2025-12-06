"use client"

import { useEffect, useRef, useState } from "react"
import { AudioManager, type AudioSettings, type SoundEffect } from "@/lib/game/AudioManager"

/**
 * React hook for game audio management
 * Provides easy access to AudioManager singleton with React state
 */
export function useGameAudio() {
  const audioManagerRef = useRef<AudioManager | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [settings, setSettings] = useState<AudioSettings>({
    masterVolume: 0.7,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    muted: false,
  })
  const [autoplayBlocked, setAutoplayBlocked] = useState(true)

  // Initialize audio manager
  useEffect(() => {
    audioManagerRef.current = AudioManager.getInstance()
    setSettings(audioManagerRef.current.getSettings())

    return () => {
      // Don't destroy on unmount as it's a singleton
      // Just clean up our reference
      audioManagerRef.current = null
    }
  }, [])

  /**
   * Initialize audio context (requires user interaction)
   */
  const initializeAudio = async (): Promise<boolean> => {
    if (!audioManagerRef.current) {
      return false
    }

    const success = await audioManagerRef.current.initialize()
    if (success) {
      setInitialized(true)
      setAutoplayBlocked(false)
      // Preload audio files
      await audioManagerRef.current.preloadAudio()
    }
    return success
  }

  /**
   * Play a sound effect
   */
  const playSound = (
    sound: SoundEffect,
    options?: { loop?: boolean; volume?: number; fadeIn?: number }
  ): string | null => {
    if (!audioManagerRef.current) {
      return null
    }
    return audioManagerRef.current.play(sound, options)
  }

  /**
   * Stop a specific sound by ID
   */
  const stopSound = (id: string, fadeOut?: number): void => {
    audioManagerRef.current?.stop(id, fadeOut)
  }

  /**
   * Stop all sounds of a specific type
   */
  const stopAllSounds = (sound?: SoundEffect): void => {
    audioManagerRef.current?.stopAll(sound)
  }

  /**
   * Set volume for master, music, or sfx
   */
  const setVolume = (type: "master" | "music" | "sfx", value: number): void => {
    if (!audioManagerRef.current) {
      return
    }
    audioManagerRef.current.setVolume(type, value)
    setSettings(audioManagerRef.current.getSettings())
  }

  /**
   * Toggle mute
   */
  const toggleMute = (): boolean => {
    if (!audioManagerRef.current) {
      return false
    }
    const newMutedState = audioManagerRef.current.toggleMute()
    setSettings(audioManagerRef.current.getSettings())
    return newMutedState
  }

  /**
   * Set mute state directly
   */
  const setMuted = (muted: boolean): void => {
    if (!audioManagerRef.current) {
      return
    }
    audioManagerRef.current.setMuted(muted)
    setSettings(audioManagerRef.current.getSettings())
  }

  return {
    initialized,
    autoplayBlocked,
    settings,
    initializeAudio,
    playSound,
    stopSound,
    stopAllSounds,
    setVolume,
    toggleMute,
    setMuted,
  }
}
