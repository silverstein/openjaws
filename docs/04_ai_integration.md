# Beach Panic: Jaws Royale - AI Integration

## AI-Powered Features

### Shark AI (Claude 4.5 Sonnet - $3/$15 per 1M tokens)
```typescript
// The shark REMEMBERS players across games
// Has personality types: methodical, theatrical, vengeful, philosophical, meta
// Learns player patterns and holds grudges
// Can break the 4th wall
```

### Beach NPCs (Gemini 2.5 Flash - $0.05/$0.20 per 1M tokens)
- Beach vendors, lifeguards, tourists
- Oblivious to danger, focused on their agenda
- Stream responses for natural dialogue

### Documentary Crew (Optional Premium Feature)
- AI David Attenborough narrating the chaos
- Comments on both shark and player behavior
- Multiple styles: Nature doc, True Crime, Sports

## AI Integration Strategy
1. Use Vercel AI Gateway (no API keys in production)
2. Model selection by urgency:
   - NPCs: Gemini 2.5 Flash (fastest)
   - Shark decisions: Claude 4.5 Sonnet
   - Complex scenarios: GPT-5 (Backup)
3. Cost optimization: ~$27/day for 1000 users
