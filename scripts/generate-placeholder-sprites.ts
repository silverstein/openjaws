/**
 * Generate placeholder sprite images for the game
 * This creates simple SVG-based sprites as temporary placeholders
 */

import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"

// SVG template for player characters
function createPlayerSprite(
  name: string,
  color: string,
  symbol: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <!-- Body circle -->
  <circle cx="32" cy="32" r="28" fill="${color}" stroke="#000" stroke-width="2"/>

  <!-- Eyes -->
  <circle cx="22" cy="26" r="4" fill="#000"/>
  <circle cx="42" cy="26" r="4" fill="#000"/>

  <!-- Mouth -->
  <path d="M 20 38 Q 32 42 44 38" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/>

  <!-- Direction indicator -->
  <path d="M 32 4 L 42 14 L 32 10 L 22 14 Z" fill="${color}" stroke="#000" stroke-width="1"/>

  <!-- Character symbol -->
  <text x="32" y="52" font-family="Arial" font-size="16" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="0.5">${symbol}</text>
</svg>`
}

// SVG for shark body
function createSharkSprite(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="80" height="128" xmlns="http://www.w3.org/2000/svg">
  <!-- Body -->
  <path d="M 40 16 L 60 96 L 40 84 L 20 96 Z" fill="#2c3e50" stroke="#1a252f" stroke-width="2"/>

  <!-- Dorsal fin -->
  <path d="M 40 44 L 55 56 L 25 56 Z" fill="#34495e"/>

  <!-- Tail -->
  <path d="M 40 84 L 65 108 L 40 96 L 15 108 Z" fill="#2c3e50" stroke="#1a252f" stroke-width="1"/>

  <!-- Eyes -->
  <circle cx="30" cy="32" r="4" fill="#000"/>
  <circle cx="50" cy="32" r="4" fill="#000"/>

  <!-- Teeth -->
  <path d="M 28 20 L 30 16 L 32 20" fill="#fff"/>
  <path d="M 34 18 L 36 14 L 38 18" fill="#fff"/>
  <path d="M 40 16 L 42 12 L 44 16" fill="#fff"/>
  <path d="M 46 18 L 48 14 L 50 18" fill="#fff"/>
  <path d="M 52 20 L 54 16 L 56 20" fill="#fff"/>
</svg>`
}

// SVG for shark fin
function createSharkFinSprite(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="48" height="64" xmlns="http://www.w3.org/2000/svg">
  <!-- Fin shape -->
  <path d="M 24 64 L 44 8 L 34 48 L 14 48 L 4 8 Z" fill="#2c3e50" stroke="#1a252f" stroke-width="2"/>

  <!-- Shading -->
  <path d="M 24 64 L 34 48 L 24 32 Z" fill="#1a252f" opacity="0.3"/>
</svg>`
}

// SVG template for NPCs
function createNPCSprite(
  name: string,
  color: string,
  emoji: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg">
  <!-- Body circle -->
  <circle cx="28" cy="28" r="24" fill="${color}" stroke="#000" stroke-width="2"/>

  <!-- Eyes -->
  <circle cx="20" cy="24" r="3" fill="#000"/>
  <circle cx="36" cy="24" r="3" fill="#000"/>

  <!-- Smile -->
  <path d="M 18 32 Q 28 36 38 32" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/>

  <!-- Emoji/Icon representation -->
  <text x="28" y="18" font-size="20" text-anchor="middle">${emoji}</text>
</svg>`
}

// SVG for beach items
function createUmbrellaSprite(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="64" height="80" xmlns="http://www.w3.org/2000/svg">
  <!-- Umbrella top -->
  <path d="M 10 30 Q 32 10 54 30" fill="#ff6b6b" stroke="#c92a2a" stroke-width="2"/>
  <path d="M 54 30 Q 32 20 10 30" fill="#fa5252" opacity="0.6"/>

  <!-- Pole -->
  <line x1="32" y1="30" x2="32" y2="75" stroke="#8b4513" stroke-width="3"/>

  <!-- Base -->
  <circle cx="32" cy="75" r="5" fill="#654321"/>
</svg>`
}

function createTowelSprite(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="80" height="48" xmlns="http://www.w3.org/2000/svg">
  <!-- Towel -->
  <rect x="8" y="12" width="64" height="32" rx="4" fill="#4ecdc4" stroke="#339999" stroke-width="2"/>

  <!-- Stripes -->
  <rect x="8" y="18" width="64" height="4" fill="#fff" opacity="0.3"/>
  <rect x="8" y="34" width="64" height="4" fill="#fff" opacity="0.3"/>

  <!-- Shadow/fold -->
  <path d="M 40 12 Q 48 24 40 44" fill="#000" opacity="0.1"/>
</svg>`
}

function createSurfboardSprite(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="96" xmlns="http://www.w3.org/2000/svg">
  <!-- Surfboard -->
  <ellipse cx="16" cy="48" rx="14" ry="46" fill="#ffa07a" stroke="#ff6347" stroke-width="2"/>

  <!-- Stripe design -->
  <ellipse cx="16" cy="48" rx="10" ry="42" fill="none" stroke="#fff" stroke-width="2" opacity="0.4"/>

  <!-- Fin at bottom -->
  <path d="M 16 88 L 20 94 L 16 92 L 12 94 Z" fill="#ff6347"/>
</svg>`
}

// Player configurations
const players = [
  { name: "influencer", color: "#ff6b6b", symbol: "📱" },
  { name: "boomer-dad", color: "#4169e1", symbol: "👔" },
  { name: "surfer-bro", color: "#ffa07a", symbol: "🏄" },
  { name: "lifeguard", color: "#ff0000", symbol: "🏊" },
  { name: "marine-biologist", color: "#32cd32", symbol: "🔬" },
  { name: "spring-breaker", color: "#ff1493", symbol: "🎉" },
]

// NPC configurations
const npcs = [
  { name: "beach-vendor", color: "#ffd700", emoji: "🏪" },
  { name: "lifeguard", color: "#ff0000", emoji: "🏊" },
  { name: "tourist", color: "#ff69b4", emoji: "📸" },
  { name: "surfer", color: "#00bfff", emoji: "🏄" },
  { name: "scientist", color: "#32cd32", emoji: "🔬" },
  { name: "reporter", color: "#9932cc", emoji: "🎤" },
  { name: "old-timer", color: "#8b4513", emoji: "🎣" },
]

// Generate all sprites
function generateSprites() {
  const baseDir = join(process.cwd(), "public", "assets", "sprites")

  // Ensure directories exist
  mkdirSync(join(baseDir, "player"), { recursive: true })
  mkdirSync(join(baseDir, "shark"), { recursive: true })
  mkdirSync(join(baseDir, "npc"), { recursive: true })
  mkdirSync(join(baseDir, "beach"), { recursive: true })

  // Generate player sprites
  for (const player of players) {
    const svg = createPlayerSprite(player.name, player.color, player.symbol)
    writeFileSync(join(baseDir, "player", `${player.name}.svg`), svg)
    console.log(`Generated player sprite: ${player.name}`)
  }

  // Generate shark sprites
  writeFileSync(join(baseDir, "shark", "shark-body.svg"), createSharkSprite())
  writeFileSync(join(baseDir, "shark", "shark-fin.svg"), createSharkFinSprite())
  console.log("Generated shark sprites")

  // Generate NPC sprites
  for (const npc of npcs) {
    const svg = createNPCSprite(npc.name, npc.color, npc.emoji)
    writeFileSync(join(baseDir, "npc", `${npc.name}.svg`), svg)
    console.log(`Generated NPC sprite: ${npc.name}`)
  }

  // Generate beach item sprites
  writeFileSync(join(baseDir, "beach", "umbrella.svg"), createUmbrellaSprite())
  writeFileSync(join(baseDir, "beach", "towel.svg"), createTowelSprite())
  writeFileSync(
    join(baseDir, "beach", "surfboard.svg"),
    createSurfboardSprite()
  )
  console.log("Generated beach item sprites")

  console.log("\n✓ All placeholder sprites generated successfully!")
  console.log(
    "\nNote: These are SVG files. For PNG support, convert them using a tool like:"
  )
  console.log("  - ImageMagick: convert sprite.svg sprite.png")
  console.log("  - Online converters: cloudconvert.com")
  console.log(
    "  - Or use SVG directly (Pixi.js v8 has some SVG support via plugins)"
  )
}

// Run generation
generateSprites()
