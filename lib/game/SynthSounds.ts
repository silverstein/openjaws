/**
 * SynthSounds — Generate game sound effects using Web Audio API
 * Fallback when MP3 files aren't available. Sounds are fun and cartoony.
 */

type SynthRecipe = (ctx: AudioContext, duration: number) => AudioBuffer

function createBuffer(ctx: AudioContext, duration: number, fn: (t: number, i: number, sr: number) => number): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = fn(i / sampleRate, i, sampleRate)
  }
  return buffer
}

// Scary chomp — descending sawtooth burst with noise
const bite: SynthRecipe = (ctx, dur = 0.3) =>
  createBuffer(ctx, dur, (t) => {
    const freq = 200 - t * 400
    const saw = ((t * freq) % 1) * 2 - 1
    const noise = Math.random() * 0.3
    const env = Math.max(0, 1 - t / dur)
    return (saw * 0.7 + noise) * env * 0.8
  })

// Splash — filtered noise burst
const splash: SynthRecipe = (ctx, dur = 0.4) =>
  createBuffer(ctx, dur, (t) => {
    const noise = Math.random() * 2 - 1
    const env = Math.max(0, 1 - t / dur) * Math.min(1, t * 20)
    const filter = Math.sin(t * 800) * 0.5 + 0.5
    return noise * env * filter * 0.5
  })

// NPC chime — pleasant two-note ding
const npcChime: SynthRecipe = (ctx, dur = 0.3) =>
  createBuffer(ctx, dur, (t) => {
    const freq = t < 0.15 ? 880 : 1100
    const env = Math.max(0, 1 - t / dur)
    return Math.sin(t * Math.PI * 2 * freq) * env * 0.4
  })

// Ability activate — ascending sweep
const abilityActivate: SynthRecipe = (ctx, dur = 0.4) =>
  createBuffer(ctx, dur, (t) => {
    const freq = 300 + t * 1200
    const env = Math.max(0, 1 - t / dur)
    return Math.sin(t * Math.PI * 2 * freq) * env * 0.5
  })

// Camera shutter — click sound
const selfieCamera: SynthRecipe = (ctx, dur = 0.15) =>
  createBuffer(ctx, dur, (t) => {
    const click = t < 0.02 ? 1 : 0
    const noise = (Math.random() * 2 - 1) * Math.max(0, 1 - t / 0.05) * 0.3
    return (click + noise) * 0.6
  })

// Game over — descending sad trombone
const gameOver: SynthRecipe = (ctx, dur = 1.2) =>
  createBuffer(ctx, dur, (t) => {
    const noteIndex = Math.floor(t / 0.3)
    const freqs = [392, 370, 349, 330] // G4, F#4, F4, E4
    const freq = freqs[Math.min(noteIndex, freqs.length - 1)] ?? 330
    const localT = t - noteIndex * 0.3
    const noteEnv = Math.max(0, 1 - localT / 0.35)
    const globalEnv = Math.max(0, 1 - t / dur)
    return Math.sin(t * Math.PI * 2 * freq) * noteEnv * globalEnv * 0.4
  })

// Item pickup — quick ascending blip
const itemPickup: SynthRecipe = (ctx, dur = 0.15) =>
  createBuffer(ctx, dur, (t) => {
    const freq = 600 + t * 2000
    const env = Math.max(0, 1 - t / dur)
    return Math.sin(t * Math.PI * 2 * freq) * env * 0.4
  })

// Item throw — whoosh
const itemThrow: SynthRecipe = (ctx, dur = 0.25) =>
  createBuffer(ctx, dur, (t) => {
    const noise = Math.random() * 2 - 1
    const freq = 300 + t * 1500
    const whoosh = Math.sin(t * freq) * 0.3
    const env = Math.sin(t / dur * Math.PI)
    return (noise * 0.2 + whoosh) * env * 0.5
  })

// Combo hit — punchy impact
const comboHit: SynthRecipe = (ctx, dur = 0.2) =>
  createBuffer(ctx, dur, (t) => {
    const freq = 150 - t * 100
    const impact = Math.sin(t * Math.PI * 2 * freq)
    const noise = (Math.random() * 2 - 1) * Math.max(0, 0.05 - t) * 20
    const env = Math.max(0, 1 - t / dur)
    return (impact * 0.6 + noise) * env * 0.7
  })

// Orange buff — sparkly ascending
const orangeBuffActivate: SynthRecipe = (ctx, dur = 0.5) =>
  createBuffer(ctx, dur, (t) => {
    const freq1 = 500 + t * 800
    const freq2 = 750 + t * 600
    const sparkle = Math.sin(t * Math.PI * 2 * freq1) * 0.3 + Math.sin(t * Math.PI * 2 * freq2) * 0.2
    const env = Math.sin(t / dur * Math.PI)
    return sparkle * env * 0.5
  })

// Buff expire — deflating descend
const orangeBuffExpire: SynthRecipe = (ctx, dur = 0.4) =>
  createBuffer(ctx, dur, (t) => {
    const freq = 800 - t * 600
    const env = Math.max(0, 1 - t / dur)
    return Math.sin(t * Math.PI * 2 * freq) * env * 0.3
  })

// Secret room — mysterious chord
const secretRoomUnlock: SynthRecipe = (ctx, dur = 0.8) =>
  createBuffer(ctx, dur, (t) => {
    const c = Math.sin(t * Math.PI * 2 * 262)
    const e = Math.sin(t * Math.PI * 2 * 330)
    const g = Math.sin(t * Math.PI * 2 * 392)
    const b = Math.sin(t * Math.PI * 2 * 494)
    const env = Math.max(0, 1 - t / dur) * Math.min(1, t * 10)
    return (c + e + g + b) * 0.12 * env
  })

// Treasure collect — coin jingle
const treasureCollect: SynthRecipe = (ctx, dur = 0.3) =>
  createBuffer(ctx, dur, (t) => {
    const freq = t < 0.1 ? 1200 : t < 0.2 ? 1500 : 1800
    const env = Math.max(0, 1 - t / dur)
    return Math.sin(t * Math.PI * 2 * freq) * env * 0.4
  })

// Victory fanfare — triumphant ascending chord
const victoryFanfare: SynthRecipe = (ctx, dur = 1.5) =>
  createBuffer(ctx, dur, (t) => {
    const noteIndex = Math.floor(t / 0.25)
    const freqs = [262, 330, 392, 523, 659, 784] // C, E, G, C5, E5, G5
    const freq = freqs[Math.min(noteIndex, freqs.length - 1)] ?? 784
    const localEnv = Math.max(0, 1 - (t - noteIndex * 0.25) / 0.3)
    const globalEnv = Math.min(1, t * 5) * Math.max(0, 1 - (t - 1) / 0.5)
    return Math.sin(t * Math.PI * 2 * freq) * localEnv * globalEnv * 0.4
  })

// Shark tension — low rumble with pulsing
const sharkTension: SynthRecipe = (ctx, dur = 4.0) =>
  createBuffer(ctx, dur, (t) => {
    const bass = Math.sin(t * Math.PI * 2 * 55) * 0.3
    const pulse = Math.sin(t * Math.PI * 2 * 1.5) * 0.5 + 0.5 // Jaws-like pulse
    const mid = Math.sin(t * Math.PI * 2 * 82) * 0.15
    return (bass + mid) * pulse * 0.5
  })

// Ocean ambience — layered waves
const oceanAmbience: SynthRecipe = (ctx, dur = 6.0) =>
  createBuffer(ctx, dur, (t) => {
    const wave1 = Math.sin(t * 0.3) * 0.3 // Slow swell
    const wave2 = Math.sin(t * 0.7 + 1) * 0.2
    const noise = (Math.random() * 2 - 1) * 0.05
    const surf = Math.sin(t * Math.PI * 2 * (100 + wave1 * 50)) * 0.05
    return (wave1 * noise + wave2 * noise + surf) * 0.6
  })

// Lobby music — simple chill loop
const lobbyMusic: SynthRecipe = (ctx, dur = 8.0) =>
  createBuffer(ctx, dur, (t) => {
    const beat = Math.floor(t * 2) % 4
    const freqs = [262, 294, 330, 294] // C D E D
    const freq = freqs[beat] ?? 262
    const noteT = (t * 2) % 1
    const env = Math.max(0, 1 - noteT * 1.5) * 0.3
    const tone = Math.sin(t * Math.PI * 2 * freq) * env
    const bass = Math.sin(t * Math.PI * 2 * (freq / 2)) * env * 0.4
    return (tone + bass) * 0.4
  })

export const SYNTH_RECIPES: Record<string, SynthRecipe> = {
  bite,
  splash,
  npc_chime: npcChime,
  ability_activate: abilityActivate,
  selfie_camera: selfieCamera,
  game_over: gameOver,
  item_pickup: itemPickup,
  item_throw: itemThrow,
  combo_hit: comboHit,
  orange_buff_activate: orangeBuffActivate,
  orange_buff_expire: orangeBuffExpire,
  secret_room_unlock: secretRoomUnlock,
  treasure_collect: treasureCollect,
  victory_fanfare: victoryFanfare,
  shark_tension: sharkTension,
  ocean_ambience: oceanAmbience,
  lobby_music: lobbyMusic,
}

/**
 * Generate all synthetic sounds for the given AudioContext.
 * Returns a map of sound name → AudioBuffer.
 */
export function generateAllSynthSounds(ctx: AudioContext): Map<string, AudioBuffer> {
  const buffers = new Map<string, AudioBuffer>()
  for (const [name, recipe] of Object.entries(SYNTH_RECIPES)) {
    try {
      buffers.set(name, recipe(ctx, undefined as any))
    } catch {
      // Skip failed synthesis
    }
  }
  return buffers
}
