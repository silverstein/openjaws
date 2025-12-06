/**
 * AudioManager - Singleton audio system for Beach Panic
 * Handles all game audio including background music, ambient sounds, and SFX
 * Uses Web Audio API for precise control and browser compatibility
 */

export type SoundEffect =
  | "ocean_ambience"
  | "shark_tension"
  | "bite"
  | "npc_chime"
  | "ability_activate"
  | "selfie_camera"
  | "game_over"

export interface AudioSettings {
  masterVolume: number // 0-1
  musicVolume: number // 0-1
  sfxVolume: number // 0-1
  muted: boolean
}

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.7,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  muted: false,
}

export class AudioManager {
  private static instance: AudioManager | null = null
  private audioContext: AudioContext | null = null
  private buffers: Map<SoundEffect, AudioBuffer> = new Map()
  private activeSounds: Map<string, AudioBufferSourceNode> = new Map()
  private settings: AudioSettings = { ...DEFAULT_SETTINGS }
  private initialized = false
  private autoplayBlocked = true
  private masterGainNode: GainNode | null = null
  private musicGainNode: GainNode | null = null
  private sfxGainNode: GainNode | null = null

  private constructor() {
    // Load settings from localStorage
    this.loadSettings()
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  /**
   * Initialize audio context - must be called after user interaction
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true
    }

    try {
      // Create audio context (requires user gesture)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create gain nodes for volume control
      this.masterGainNode = this.audioContext.createGain()
      this.musicGainNode = this.audioContext.createGain()
      this.sfxGainNode = this.audioContext.createGain()

      // Connect gain nodes
      this.musicGainNode.connect(this.masterGainNode)
      this.sfxGainNode.connect(this.masterGainNode)
      this.masterGainNode.connect(this.audioContext.destination)

      // Apply current volume settings
      this.updateGainNodes()

      // Resume context if suspended (for autoplay policy)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      this.initialized = true
      this.autoplayBlocked = false

      console.log("[AudioManager] Initialized successfully")
      return true
    } catch (error) {
      console.error("[AudioManager] Failed to initialize:", error)
      return false
    }
  }

  /**
   * Preload all audio files
   */
  async preloadAudio(): Promise<void> {
    if (!this.audioContext) {
      console.warn("[AudioManager] Cannot preload audio - not initialized")
      return
    }

    const soundFiles: Record<SoundEffect, string> = {
      ocean_ambience: "/audio/ocean_ambience.mp3",
      shark_tension: "/audio/shark_tension.mp3",
      bite: "/audio/bite.mp3",
      npc_chime: "/audio/npc_chime.mp3",
      ability_activate: "/audio/ability_activate.mp3",
      selfie_camera: "/audio/selfie_camera.mp3",
      game_over: "/audio/game_over.mp3",
    }

    const loadPromises = Object.entries(soundFiles).map(async ([key, url]) => {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          console.warn(`[AudioManager] Could not load ${url} - using silence`)
          return
        }
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
        this.buffers.set(key as SoundEffect, audioBuffer)
        console.log(`[AudioManager] Loaded ${key}`)
      } catch (error) {
        console.warn(`[AudioManager] Failed to load ${key}:`, error)
        // Continue loading other sounds even if one fails
      }
    })

    await Promise.all(loadPromises)
    console.log(`[AudioManager] Preloaded ${this.buffers.size} sounds`)
  }

  /**
   * Play a sound effect
   */
  play(
    sound: SoundEffect,
    options: { loop?: boolean; volume?: number; fadeIn?: number } = {}
  ): string | null {
    if (!this.initialized || !this.audioContext || this.settings.muted) {
      return null
    }

    const buffer = this.buffers.get(sound)
    if (!buffer) {
      console.warn(`[AudioManager] Sound not loaded: ${sound}`)
      return null
    }

    try {
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer

      // Create gain node for this sound
      const gainNode = this.audioContext.createGain()
      const volume = options.volume ?? 1.0

      // Connect to appropriate bus (music or sfx)
      const isMusic = sound === "ocean_ambience" || sound === "shark_tension"
      const busGainNode = isMusic ? this.musicGainNode : this.sfxGainNode

      if (!busGainNode) {
        console.warn("[AudioManager] Gain node not initialized")
        return null
      }

      source.connect(gainNode)
      gainNode.connect(busGainNode)

      // Apply loop setting
      source.loop = options.loop ?? false

      // Apply fade in
      if (options.fadeIn && options.fadeIn > 0) {
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(
          volume,
          this.audioContext.currentTime + options.fadeIn
        )
      } else {
        gainNode.gain.value = volume
      }

      // Start playback
      source.start(0)

      // Store reference
      const id = `${sound}_${Date.now()}_${Math.random()}`
      this.activeSounds.set(id, source)

      // Clean up when finished
      source.onended = () => {
        this.activeSounds.delete(id)
      }

      return id
    } catch (error) {
      console.error(`[AudioManager] Error playing ${sound}:`, error)
      return null
    }
  }

  /**
   * Stop a specific sound by ID
   */
  stop(id: string, fadeOut?: number): void {
    const source = this.activeSounds.get(id)
    if (!source) {
      return
    }

    try {
      if (fadeOut && fadeOut > 0 && this.audioContext) {
        // Fade out before stopping
        const gainNode = this.audioContext.createGain()
        source.connect(gainNode)
        gainNode.connect(this.audioContext.destination)
        gainNode.gain.setValueAtTime(1, this.audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeOut)
        setTimeout(() => {
          source.stop()
          this.activeSounds.delete(id)
        }, fadeOut * 1000)
      } else {
        source.stop()
        this.activeSounds.delete(id)
      }
    } catch (error) {
      console.error("[AudioManager] Error stopping sound:", error)
      this.activeSounds.delete(id)
    }
  }

  /**
   * Stop all sounds of a specific type
   */
  stopAll(sound?: SoundEffect): void {
    this.activeSounds.forEach((source, id) => {
      if (!sound || id.startsWith(sound)) {
        try {
          source.stop()
        } catch (error) {
          // Sound may have already stopped
        }
        this.activeSounds.delete(id)
      }
    })
  }

  /**
   * Update volume settings
   */
  setVolume(type: "master" | "music" | "sfx", value: number): void {
    const clampedValue = Math.max(0, Math.min(1, value))

    switch (type) {
      case "master":
        this.settings.masterVolume = clampedValue
        break
      case "music":
        this.settings.musicVolume = clampedValue
        break
      case "sfx":
        this.settings.sfxVolume = clampedValue
        break
    }

    this.updateGainNodes()
    this.saveSettings()
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.settings.muted = !this.settings.muted
    this.updateGainNodes()
    this.saveSettings()
    return this.settings.muted
  }

  /**
   * Set mute state
   */
  setMuted(muted: boolean): void {
    this.settings.muted = muted
    this.updateGainNodes()
    this.saveSettings()
  }

  /**
   * Get current settings
   */
  getSettings(): AudioSettings {
    return { ...this.settings }
  }

  /**
   * Check if audio is ready
   */
  isReady(): boolean {
    return this.initialized && !this.autoplayBlocked
  }

  /**
   * Check if autoplay is blocked (user interaction needed)
   */
  isAutoplayBlocked(): boolean {
    return this.autoplayBlocked
  }

  /**
   * Destroy audio manager
   */
  destroy(): void {
    this.stopAll()
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close()
    }
    this.initialized = false
    this.buffers.clear()
    this.activeSounds.clear()
  }

  /**
   * Update gain nodes based on current settings
   */
  private updateGainNodes(): void {
    if (!this.masterGainNode || !this.musicGainNode || !this.sfxGainNode) {
      return
    }

    const masterVolume = this.settings.muted ? 0 : this.settings.masterVolume
    this.masterGainNode.gain.value = masterVolume
    this.musicGainNode.gain.value = this.settings.musicVolume
    this.sfxGainNode.gain.value = this.settings.sfxVolume
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem("beachPanicAudioSettings", JSON.stringify(this.settings))
    } catch (error) {
      console.warn("[AudioManager] Could not save settings:", error)
    }
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem("beachPanicAudioSettings")
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn("[AudioManager] Could not load settings:", error)
      this.settings = { ...DEFAULT_SETTINGS }
    }
  }
}

// Export singleton instance getter
export const getAudioManager = () => AudioManager.getInstance()
