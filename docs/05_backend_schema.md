# Beach Panic: Jaws Royale - Backend Schema

This document outlines the database schema for Convex.

```typescript
// Key tables needed:
games: {
  beachName, status, sharkState, players[], events[], sharkCommentary[]
}
sharkMemories: {
  playerId, encounters, escapes, patterns[], relationship
}
playerActions: {
  gameId, playerId, action, position, timestamp
}
```
