/**
 * Generate placeholder audio files for Beach Panic
 * This script creates simple audio files using tone generation
 * Run with: node scripts/generate-placeholder-audio.js
 */

const fs = require('fs');
const path = require('path');

// For now, just create empty placeholder MP3 files with metadata
// In a real implementation, you would use a library like 'node-web-audio-api' or 'tone'
// or use actual audio files from free sources like freesound.org

const audioDir = path.join(__dirname, '../public/audio');

// Ensure directory exists
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const placeholderFiles = [
  {
    name: 'ocean_ambience.mp3',
    description: 'Ocean waves ambient sound (looping)',
    source: 'https://freesound.org or use tone generation'
  },
  {
    name: 'shark_tension.mp3',
    description: 'Tense music when shark is nearby',
    source: 'https://freesound.org or compose simple tension music'
  },
  {
    name: 'bite.mp3',
    description: 'Bite/damage sound effect',
    source: 'Short percussive sound'
  },
  {
    name: 'npc_chime.mp3',
    description: 'Pleasant chime for NPC interaction',
    source: 'Bell or chime sound'
  },
  {
    name: 'ability_activate.mp3',
    description: 'Power-up sound for ability activation',
    source: 'Whoosh or power-up sound'
  },
  {
    name: 'selfie_camera.mp3',
    description: 'Camera shutter sound',
    source: 'Camera click/shutter'
  },
  {
    name: 'game_over.mp3',
    description: 'Game over dramatic sound',
    source: 'Dramatic sting or chord'
  }
];

console.log('🎵 Beach Panic Audio Placeholder Generator\n');
console.log('This script creates placeholder files for audio assets.');
console.log('Replace these with actual audio files for production.\n');
console.log('Recommended free sources:');
console.log('- https://freesound.org (CC licensed sounds)');
console.log('- https://soundbible.com (royalty-free sounds)');
console.log('- https://incompetech.com (royalty-free music)\n');

// Create README with instructions
const readme = `# Beach Panic Audio Assets

This directory contains audio files for the game.

## Current Files

${placeholderFiles.map(f => `### ${f.name}
**Description**: ${f.description}
**Source**: ${f.source}
`).join('\n')}

## How to Add Real Audio

1. Find or create audio files for each sound effect
2. Convert to MP3 format (for broad browser support)
3. Keep file sizes small (< 100KB for SFX, < 500KB for music loops)
4. Ensure proper licensing (CC0, CC-BY, or royalty-free)
5. Replace the placeholder files with your actual audio

## Recommended Tools

- **Audacity** (free audio editor)
- **FFMPEG** (for format conversion)
- **ToneJS** (for procedural audio generation)

## Audio Specifications

- Format: MP3 (128kbps)
- Sample Rate: 44.1kHz
- Channels: Stereo (or Mono for SFX)
- Normalized to -1dB to prevent clipping

## License Notes

All audio must be properly licensed for use in an open-source game.
Include attribution in credits if required by the license.
`;

fs.writeFileSync(path.join(audioDir, 'README.md'), readme);
console.log('✅ Created README.md with audio instructions\n');

// Create a simple JSON manifest
const manifest = {
  version: '1.0.0',
  generated: new Date().toISOString(),
  sounds: placeholderFiles.reduce((acc, file) => {
    acc[file.name.replace('.mp3', '')] = {
      file: file.name,
      description: file.description,
      type: file.name.includes('ambience') || file.name.includes('tension') ? 'music' : 'sfx',
      placeholder: true
    };
    return acc;
  }, {})
};

fs.writeFileSync(
  path.join(audioDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.log('✅ Created manifest.json\n');

console.log('📝 Next steps:');
console.log('1. Download or create actual audio files');
console.log('2. Place them in public/audio/ directory');
console.log('3. Test in the game with VolumeControl component');
console.log('\nFor now, the AudioManager will handle missing files gracefully.');
console.log('Check browser console for warnings about missing audio files.\n');
