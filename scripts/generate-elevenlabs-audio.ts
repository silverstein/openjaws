import fs from 'fs';
import path from 'path';

// Simple manual env loader to avoid dependencies
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, ''); // remove quotes
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (e) {
    // ignore error
  }
}

loadEnv();

const API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/sound-generation';

if (!API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY is missing in .env.local');
  process.exit(1);
}

const audioDir = path.join(process.cwd(), 'public/audio');

// Define audio assets to generate
const assets = [
  {
    name: 'ocean_ambience.mp3',
    prompt: 'Gentle ocean waves crashing on a sandy beach, sunny day, seagull in distance, high fidelity, looping ambience',
    duration_seconds: 10 // Max is usually 11-22 for this endpoint depending on credits, but we'll try standard.
  },
  {
    name: 'lobby_music.mp3',
    prompt: 'Upbeat retro 60s surf rock, electric guitar, beach party, energetic drums, happy sunny vibes, pulp fiction style',
    duration_seconds: 10
  },
  {
    name: 'shark_tension.mp3',
    prompt: 'Tense underwater horror cinematic music, deep cello, fast heart beat, ominous impending danger, jaws style',
    duration_seconds: 8
  },
  {
    name: 'bite.mp3',
    prompt: 'Large shark biting crunch, wet impact, vicious monster bite, splash',
    duration_seconds: 2
  },
  {
    name: 'npc_chime.mp3',
    prompt: 'Magical pleasant UI chime, crystal bell notification, high quality',
    duration_seconds: 2
  },
  {
    name: 'ability_activate.mp3',
    prompt: 'Video game powerup activation sound, sci-fi whoosh, energy surge, positive feedback',
    duration_seconds: 2
  },
  {
    name: 'selfie_camera.mp3',
    prompt: 'Camera shutter click, mechanical slr sound',
    duration_seconds: 1
  },
  {
    name: 'game_over.mp3',
    prompt: 'Sad game over orchestral sting, fail trombone, underwater bubble fade out',
    duration_seconds: 4
  },
  {
    name: 'victory_fanfare.mp3',
    prompt: 'Short triumphant brass fanfare, success celebration, confetti sound',
    duration_seconds: 4
  },
  {
    name: 'combo_hit.mp3',
    prompt: 'Arcade game punch hit impact, retro style, satisfying',
    duration_seconds: 1
  },
  {
    name: 'item_pickup.mp3',
    prompt: 'Plastic item pickup sound, pop, click, inventory add',
    duration_seconds: 1
  },
  {
    name: 'item_throw.mp3',
    prompt: 'Fast swoosh air cut sound, throwing object',
    duration_seconds: 1
  },
  {
    name: 'orange_buff_activate.mp3',
    prompt: 'Magical citrus splash sound, refreshing liquid powerup, orange soda fizz',
    duration_seconds: 2
  },
  {
    name: 'orange_buff_expire.mp3',
    prompt: 'Power down sound, fizzling out, liquid draining',
    duration_seconds: 2
  },
  {
    name: 'secret_room_unlock.mp3',
    prompt: 'Stone door sliding open, heavy mystery mechanism, zelda style secret reveal',
    duration_seconds: 4
  },
  {
    name: 'treasure_collect.mp3',
    prompt: 'Coins jingling, treasure chest opening, gold sparkle sound',
    duration_seconds: 2
  }
];

async function generateSound(asset: typeof assets[0]) {
  console.log(`\n🎧 Generating: ${asset.name}...`);
  console.log(`   Prompt: "${asset.prompt}"`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: asset.prompt, // The prompt
        duration_seconds: asset.duration_seconds,
        prompt_influence: 0.5 // Default
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const buffer = await response.arrayBuffer();
    const filePath = path.join(audioDir, asset.name);
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log(`   ✅ Saved to ${filePath}`);
    
    // Update manifest if needed (optional logic here)
    
  } catch (error) {
    console.error(`   ❌ Failed to generate ${asset.name}:`, error);
  }
}

async function main() {
  console.log('🦈 Open Jaws Audio Generator (ElevenLabs)');
  console.log('=========================================');
  
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  // Process sequentially to avoid rate limits
  for (const asset of assets) {
    await generateSound(asset);
    // gentle delay
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n✨ All operations complete.');
}

main().catch(console.error);
