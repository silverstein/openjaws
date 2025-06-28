# Beach Panic: Jaws Royale - AI Integration

## AI-Powered Features

### Shark AI (Claude 4 Sonnet - $3/$15 per 1M tokens)
```typescript
// The shark REMEMBERS players across games
// Has personality types: methodical, theatrical, vengeful, philosophical, meta
// Learns player patterns and holds grudges
// Can break the 4th wall
```

### Beach NPCs (Gemini 2.0 Flash - $0.075/$0.30 per 1M tokens)
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
   - NPCs: Gemini 2.0 Flash (fastest)
   - Shark decisions: Claude 4 Sonnet
   - Complex scenarios: Claude 4 Opus
3. Cost optimization: ~$27/day for 1000 users
