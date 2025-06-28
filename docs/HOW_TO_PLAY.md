# 🏖️ Beach Panic: Jaws Royale - How to Play

## 🚀 Quick Start Setup

### 1. Install Dependencies
```bash
cd /Users/m/Sites/openjaws
pnpm install
```

### 2. Set Up Convex (Backend)
```bash
pnpm convex dev
```
- Choose "Create a new project" when prompted
- This will output your `NEXT_PUBLIC_CONVEX_URL` - copy it!

### 3. Configure Environment Variables
Create or update `.env.local`:
```env
# Required - From step 2
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT=your-deployment-name

# Optional - For full AI features (game works without these)
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
```

**Getting API Keys:**
- **Anthropic (Claude 4)**: Sign up at [console.anthropic.com](https://console.anthropic.com) for shark AI
- **Google (Gemini)**: Get free key at [makersuite.google.com](https://makersuite.google.com/app/apikey) for NPCs

**Note:** Without API keys, the game uses clever mock responses that still feel intelligent!

**NOT NEEDED:** `VERCEL_AI_GATEWAY_API_KEY` - This is an optional alternative to individual API keys

### 4. Start the Game
In a new terminal (keep convex dev running):
```bash
pnpm dev
```

Visit `http://localhost:3000`

## 🎮 How to Play

### Controls
- **WASD** or **Arrow Keys** - Move your character
- **Space** - Use your character's special ability
- **ESC** - Return to lobby

### Game Objective
You're a beach-goer trying to enjoy your vacation while a terrifyingly intelligent shark hunts you. The twist? The shark remembers you between games and learns your patterns!

### Character Abilities
Each character has a unique ability (press Space):

1. **The Influencer** 🤳
   - "Going Live" - Creates viewer shields
   - Perfect for content creation... if you survive!

2. **The Boomer Dad** 👔
   - "Dad Reflexes" - Can throw other players
   - Complains about everything while swimming

3. **The Surfer Bro** 🏄
   - "Sick Wave" - Surf on the shark's wake
   - Risky but radical moves

4. **The Lifeguard** 🏊‍♀️
   - "Baywatch Run" - Slow-mo run that mesmerizes
   - Can see the shark through fog

5. **The Marine Biologist** 🥼
   - "Shark Facts" - Bore the shark with facts
   - Takes notes while being eaten

6. **The Spring Breaker** 🍹
   - "YOLO Mode" - Invincible but uncontrollable
   - More upset about spilled drinks than sharks

### The Smart Shark 🦈
- **It remembers you!** Play multiple times and watch it recognize you
- **It learns your patterns!** Always hide in the same spot? It'll notice
- **It has personality!** Different sharks have different hunting styles
- **It comments on your gameplay!** Watch for its thoughts above its fin

### Shark Personalities
- **Methodical** - Studies your patterns like a chess player
- **Theatrical** - Dramatic hunter who loves jump scares
- **Vengeful** - Holds grudges and remembers who escaped
- **Philosophical** - Questions existence while hunting
- **Meta** - Knows it's in a game and breaks the 4th wall

### Tips for Survival
1. **Vary your patterns** - Don't always swim the same direction
2. **Use terrain** - Sand is slower but sometimes safer
3. **Watch the shark's thoughts** - It might reveal its plans
4. **Don't be predictable** - The shark is learning!

## 🧪 Special Features

### Recognition System
- First time: "New prey detected..."
- Return visit: "Wait... I remember you..."
- Multiple games: "Oh, it's YOU again..."
- Nemesis status: "MY NEMESIS RETURNS!"

### Psychological Warfare
- The shark will taunt you based on your behavior
- Screen effects intensify when you're being hunted
- Heartbeat increases as the shark approaches
- Special cinematics when the shark recognizes you

### AI Status Indicator
- 🟢 **Real AI** - Full Claude/Gemini intelligence
- 🟡 **Cached** - Reusing similar responses
- 🔵 **Mock** - Clever pre-written responses
- Look for the small indicator in the top-right corner

## 🏆 Achievements
- **First Recognition** - The shark remembers you
- **Predictable Prey** - Shark predicts your movement 3 times
- **Nemesis Status** - Become the shark's nemesis (10+ encounters)
- **The Shark Knows My Name** - Ultimate recognition

## 🛠️ Troubleshooting

### Game won't start?
1. Make sure both `pnpm convex dev` and `pnpm dev` are running
2. Check that `.env.local` has the correct Convex URL
3. Try refreshing the page

### Shark not moving?
- The shark makes decisions every 2-3 seconds
- Check the AI status indicator (top-right)
- If in mock mode, it still works but uses pre-written responses

### Can't see shark thoughts?
- They appear when the shark is actively hunting
- Different personalities have different thought frequencies
- Look for the speech bubble above the shark

## 🎯 Coming Soon
- Multiplayer (11 swimmers vs 1 player-controlled shark)
- Objectives (selfies with shark, sandcastle building)
- Beach NPCs with dialogue
- Dynamic events (influencer invasions)
- Documentary narration mode

## 🐛 Found a Bug?
The game is in active development! If you find issues:
1. Check the browser console for errors
2. Note which character you were playing
3. Remember what the shark's last thought was

Enjoy the psychological terror of being hunted by an AI that actually remembers you! 🦈🧠