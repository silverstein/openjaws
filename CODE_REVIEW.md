# Code Review: Beach Panic - Jaws Royale

**Reviewer:** Claude (AI Code Review)
**Date:** 2025-12-06
**Branch:** `claude/game-code-review-01LTg6iTd6QXv7Z5ZD8MAKre`

---

## Executive Summary

This is a well-architected asymmetric multiplayer game with AI-powered shark intelligence. The codebase demonstrates good separation of concerns, creative game design, and thoughtful AI integration. However, there are several areas that need attention before production deployment.

**Overall Rating:** 7/10 - Good foundation with room for improvement

### Key Findings
- **Critical Issues:** 2
- **High Priority:** 6
- **Medium Priority:** 12
- **Low Priority:** 8

---

## 1. Architecture & Design (Score: 8/10)

### Strengths
- Clean separation between game logic (`/lib/game`), AI systems (`/lib/ai`), and backend (`/convex`)
- Well-designed entity system with `Player` and `Shark` classes
- Creative use of personality-driven AI with 5 distinct shark behaviors
- Smart cost optimization with fallback AI modes (real → cached → mock)

### Areas for Improvement

**1.1 GameCanvas.tsx is too large (722 lines)**

The main game component handles too many responsibilities:
- Game initialization
- Input handling
- Game loop
- AI decision making
- UI state management
- Collision detection

**Recommendation:** Extract into smaller, focused components:
```
/components/game/
├── GameCanvas.tsx        (orchestration only)
├── GameRenderer.tsx      (Pixi.js rendering)
├── GameLoop.tsx          (game tick logic)
├── InputHandler.ts       (keyboard/mouse input)
├── CollisionSystem.ts    (collision detection)
└── UIOverlay.tsx         (React UI components)
```

**1.2 Circular dependencies risk**

`SharkAIController.ts:5` imports from `Shark.ts`, while `Shark.ts:3` imports from `SharkAIController`. This works now but can cause issues as the codebase grows.

---

## 2. Critical Issues

### 2.1 Memory Leak in GameCanvas.tsx

**Location:** `GameCanvas.tsx:180-235`

```typescript
window.addEventListener('keydown', (e) => { ... })
window.addEventListener('keyup', (e) => { ... })
```

**Problem:** Event listeners are added but never removed in the cleanup function. The cleanup only handles resize and Pixi app destruction.

**Fix Required:**
```typescript
// Store references to event handlers
const handleKeyDown = (e: KeyboardEvent) => { ... }
const handleKeyUp = (e: KeyboardEvent) => { ... }

window.addEventListener('keydown', handleKeyDown)
window.addEventListener('keyup', handleKeyUp)

// In cleanup:
return () => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('resize', handleResize)
  // ... rest of cleanup
}
```

### 2.2 Potential JSON Injection in AI Response Parsing

**Location:** `sharkBrain.ts:128`

```typescript
const decision = JSON.parse(text);
return decision;
```

**Problem:** Parsing AI-generated JSON without validation. Malformed responses or unexpected structures could crash the game or cause undefined behavior.

**Fix Required:**
```typescript
try {
  const decision = JSON.parse(text);
  // Validate required fields
  if (!decision.action || !['hunt','stalk','ambush','retreat','taunt','investigate'].includes(decision.action)) {
    throw new Error('Invalid action');
  }
  // ... validate other fields
  return decision as SharkDecision;
} catch (error) {
  console.error('Failed to parse/validate shark decision:', error);
  return generateMockSharkDecision(context);
}
```

---

## 3. High Priority Issues

### 3.1 Race Condition in AI Decision Making

**Location:** `GameCanvas.tsx:395-449`

```typescript
if (now - lastAIDecisionRef.current > 2000 && !isAIThinking) {
  lastAIDecisionRef.current = now
  setIsAIThinking(true)

  fetch('/api/shark-brain', { ... })
    .then(res => res.json())
    .then(decision => {
      setAIThoughts(decision.innerMonologue)
      setIsAIThinking(false)
      // ...
    })
}
```

**Problem:** Multiple async operations can overlap if the fetch takes longer than 2 seconds, creating race conditions.

**Recommendation:** Use a ref to track the current request and cancel previous ones:
```typescript
const abortControllerRef = useRef<AbortController | null>(null)

// Cancel previous request
abortControllerRef.current?.abort()
abortControllerRef.current = new AbortController()

fetch('/api/shark-brain', {
  signal: abortControllerRef.current.signal,
  // ...
})
```

### 3.2 Missing Error Boundaries

**Location:** `/app/game/page.tsx`

The game page has no error boundary. If the Pixi.js canvas crashes, the entire app will crash.

**Recommendation:** Add React Error Boundaries around the game canvas.

### 3.3 Hardcoded Magic Numbers

**Location:** Multiple files

Examples:
- `GameCanvas.tsx:103`: `window.devicePixelRatio || 1`
- `GameCanvas.tsx:123`: `app.screen.height * 0.3` (beach/water boundary)
- `Player.ts:186`: `delta * 0.083` (stamina drain rate)
- `Shark.ts:45`: `aiDecisionInterval: number = 2500`
- `ObjectiveSystem.ts:96`: `distance < 150` (selfie distance)

**Recommendation:** Create a constants file:
```typescript
// lib/game/constants.ts
export const GAME_CONSTANTS = {
  BEACH_HEIGHT_RATIO: 0.3,
  SELFIE_DISTANCE: 150,
  AI_DECISION_INTERVAL: 2500,
  STAMINA_DRAIN_RATE: 0.083,
  // etc.
}
```

### 3.4 Missing TypeScript Strict Checks for `any`

**Location:** Multiple files use `any` type

Examples:
- `GameCanvas.tsx:68`: `currentTaunt: any`
- `SharkAIController.ts:27`: `gameState: any`
- `convex/schema.ts:28`: `data: v.any()`
- `sharkBrain.ts:100`: `memories.map(m => ...)`

**Recommendation:** Define proper types for all data structures.

### 3.5 API Key Exposure Risk

**Location:** `lib/ai/config.ts:1-3`

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
```

These imports work with environment variables, but ensure:
1. `.env.local` is in `.gitignore`
2. API keys are only used server-side (which they are via the `/api/` route)
3. Rate limiting is in place

### 3.6 Deprecated Pixi.js v8 API Usage

**Location:** `PsychologicalEffects.ts:44-47`

```typescript
this.vignetteOverlay.beginFill(0x000000, alpha)
this.vignetteOverlay.drawCircle(centerX, centerY, radius)
this.vignetteOverlay.endFill()
```

**Problem:** This uses Pixi.js v7 API. The codebase uses v8.10.2 where the API is different:
```typescript
this.vignetteOverlay.circle(centerX, centerY, radius)
this.vignetteOverlay.fill({ color: 0x000000, alpha })
```

The same issue exists throughout `PsychologicalEffects.ts`.

---

## 4. Medium Priority Issues

### 4.1 Inconsistent State Management

The codebase mixes multiple state patterns:
- React `useState` for UI state
- `useRef` for mutable game state
- Zustand is listed as a dependency but not used
- Convex for backend state

**Recommendation:** Consolidate on a single pattern. Consider using Zustand for all client-side game state.

### 4.2 Missing Loading States

**Location:** `GameCanvas.tsx:99-110`

The game initialization is async but there's no loading indicator shown to users.

### 4.3 No Input Debouncing

**Location:** `GameCanvas.tsx:186-189`

The ability activation (`space`) and selfie (`F`) have no debouncing or cooldown at the input level.

### 4.4 Inconsistent Error Handling

Some async operations have catch blocks, others don't:

```typescript
// Has error handling (good)
fetch('/api/shark-brain', {...})
  .then(...)
  .catch(err => {
    console.log('AI decision failed, using fallback:', err)
    // ...
  })

// Missing error handling (Shark.ts:364)
const decision = await this.aiController.getDecision({...})
// No catch/try
```

### 4.5 Stale Closure in setTimeout

**Location:** `Shark.ts:467-478`

```typescript
setTimeout(() => {
  this.aiThoughtText.alpha = 0.7
}, 3000)
```

Multiple rapid calls to `updateAIThought` will create overlapping timeouts affecting the same element.

**Recommendation:** Store and clear timeout references:
```typescript
private thoughtTimeouts: NodeJS.Timeout[] = []

private updateAIThought(thought: string): void {
  // Clear previous timeouts
  this.thoughtTimeouts.forEach(t => clearTimeout(t))
  this.thoughtTimeouts = []

  this.thoughtTimeouts.push(setTimeout(() => {...}, 3000))
  // ...
}
```

### 4.6 Missing Cleanup in ObjectiveSystem

**Location:** `ObjectiveSystem.ts:126-135`

The `setInterval` for fade animation is never cleaned up if the component unmounts mid-animation.

### 4.7 Window Access Without SSR Check

**Location:** `ObjectiveSystem.ts:37-38`

```typescript
this.scoreText.y = window.innerHeight - 180
```

Direct `window` access can fail during SSR. Wrap in a check:
```typescript
if (typeof window !== 'undefined') {
  this.scoreText.y = window.innerHeight - 180
}
```

### 4.8 Console.log in Production Code

**Location:** Multiple files

Examples:
- `GameCanvas.tsx:169`: `console.log('Shark created at:', shark.x, shark.y)`
- `GameCanvas.tsx:264-265`: Movement debug logs
- `Player.ts:268-289`: Ability activation logs
- `PsychologicalEffects.ts:130`: `console.log('Thump-thump')`

**Recommendation:** Use a proper logging utility with log levels.

### 4.9 Missing Unit Tests for Critical Logic

**Location:** Test coverage gaps

Good: `Player.test.ts` exists with comprehensive tests

Missing:
- `Shark.test.ts` exists but needs more AI integration tests
- No tests for `ObjectiveSystem.ts`
- No tests for `PsychologicalEffects.ts`
- No integration tests for the game loop

### 4.10 Inefficient Re-renders

**Location:** `GameCanvas.tsx:451-456`

```typescript
setSharkAIState({
  personality: 'theatrical',
  hunger: 50,
  rage: shark.rage || 0,
  currentTarget: 'player_1'
})
```

This runs every frame in the game loop, triggering re-renders even when values haven't changed.

**Recommendation:** Only update state when values change:
```typescript
const newRage = shark.rage || 0
if (newRage !== sharkAIState.rage) {
  setSharkAIState(prev => ({ ...prev, rage: newRage }))
}
```

### 4.11 Missing ARIA Labels for Accessibility

**Location:** `GameCanvas.tsx:632-712`

The game UI has no accessibility attributes. Screen readers cannot interpret the game state.

### 4.12 Collision Detection Could Be Optimized

**Location:** `GameCanvas.tsx:715-722`

Simple AABB collision is fine for now, but as player count increases, consider spatial partitioning.

---

## 5. Low Priority Issues

### 5.1 Inconsistent Code Formatting

- Some files use semicolons, others don't
- Mix of single and double quotes
- Inconsistent spacing around object properties

**Recommendation:** Add ESLint and Prettier configurations.

### 5.2 Missing JSDoc Comments

Most functions lack documentation. Key functions that need docs:
- `makeSharkDecision`
- `analyzePlayerPattern`
- Game loop in `GameCanvas.tsx`

### 5.3 Unused Imports

**Location:** `GameCanvas.tsx:4`

```typescript
import { Application, Graphics, Assets, Sprite, Container, FederatedPointerEvent, Text } from 'pixi.js'
```

`Assets`, `Sprite`, and `FederatedPointerEvent` are imported but not used.

### 5.4 TODO Comments Need Tracking

**Location:** `GameCanvas.tsx:141-150`

```typescript
// TODO: Fix shader for Pixi.js v8 compatibility
// const waterShader = createWaterShader()
```

TODOs should be tracked in an issue tracker, not left in code indefinitely.

### 5.5 Model Name Appears Incorrect

**Location:** `lib/ai/config.ts:8`

```typescript
sharkBrain: anthropic('claude-4-20250514'),
```

This model ID doesn't match known Claude model formats. Should likely be `claude-sonnet-4-20250514` or similar.

### 5.6 Inconsistent Position Types

- `Position` in Convex types has `x, y, z`
- Player position uses `x, y` only
- Some places use `{ x: number, y: number }` inline

**Recommendation:** Unify on a single position type exported from a shared types file.

### 5.7 Shark Personality Hardcoded

**Location:** `GameCanvas.tsx:412`

```typescript
sharkPersonality: 'theatrical',
```

The personality is hardcoded to 'theatrical' throughout the game canvas, making other personality types unused.

### 5.8 Missing Package.json Scripts

Consider adding:
- `lint`: ESLint check
- `lint:fix`: ESLint auto-fix
- `typecheck`: TypeScript type checking
- `test:coverage`: Test with coverage report

---

## 6. Security Considerations

### 6.1 API Route Validation

**Location:** `/app/api/shark-brain/route.ts:5-6`

```typescript
const { action, context } = await request.json();
```

No validation of input data. Could be exploited for denial of service.

**Recommendation:** Add input validation with zod:
```typescript
import { z } from 'zod'

const RequestSchema = z.object({
  action: z.enum(['decide', 'updateMemory', 'taunt', 'stats']),
  context: z.record(z.unknown()).optional()
})

const { action, context } = RequestSchema.parse(await request.json())
```

### 6.2 Rate Limiting

The API has usage tracking but no actual rate limiting middleware. A malicious client could spam requests.

### 6.3 CORS Configuration

Ensure the API routes have proper CORS headers if accessed from different domains.

---

## 7. Performance Considerations

### 7.1 Game Loop Efficiency

The current game loop updates everything every frame. Consider:
- Separate update frequencies for different systems
- AI decisions: Every 2-3 seconds (already implemented)
- Physics: Every frame
- UI updates: 10-15 fps is sufficient

### 7.2 Convex Query Optimization

**Location:** `SharkAIController.ts:54-62`

```typescript
const memories = await this.convexClient.query(api.sharkAI.getSharkMemories, {
  sharkUserId: this.sharkUserId,
  limit: 20
})
```

Consider implementing real-time subscriptions for memory updates instead of polling.

### 7.3 Graphics Object Reuse

In `Player.ts:110-165`, `drawCharacter()` recreates the entire graphics each time. Consider caching static elements and only updating dynamic parts.

---

## 8. Testing Recommendations

### Current Coverage
- `Player.test.ts`: Comprehensive (good)
- `Shark.test.ts`: Basic tests (needs expansion)
- `mockResponses.test.ts`: AI mock tests (good)
- `apiTracking.test.ts`: API tracking tests (good)

### Missing Tests
1. **Integration tests** for the full game loop
2. **E2E tests** with Playwright for user flows
3. **Collision system tests**
4. **ObjectiveSystem tests**
5. **PsychologicalEffects tests**
6. **API route tests**

### Recommended Testing Strategy
```
/test
├── unit/           # Current tests
├── integration/    # Game loop, AI+Backend
├── e2e/           # Full game scenarios
└── fixtures/      # Test data
```

---

## 9. Positive Highlights

1. **Creative game concept** - The asymmetric multiplayer with AI-powered shark is unique
2. **Thoughtful AI integration** - Multiple models, caching, fallbacks, cost optimization
3. **Personality system** - 5 distinct shark personalities with different behaviors
4. **Memory system** - Cross-game learning makes the shark feel intelligent
5. **Clean entity design** - Player and Shark classes are well-structured
6. **Good test coverage** for Player entity
7. **TypeScript usage** throughout the codebase
8. **Convex schema** is well-designed with proper indexes

---

## 10. Recommended Next Steps (Priority Order)

1. **Fix the memory leak** in GameCanvas.tsx (Critical)
2. **Add JSON validation** for AI responses (Critical)
3. **Add API input validation** with zod (High)
4. **Fix Pixi.js v8 API** in PsychologicalEffects.ts (High)
5. **Extract game constants** to a shared file (Medium)
6. **Add loading states** for game initialization (Medium)
7. **Implement proper logging** instead of console.log (Medium)
8. **Add Error Boundaries** (Medium)
9. **Expand test coverage** (Medium)
10. **Consider refactoring** GameCanvas.tsx into smaller components (Low)

---

## Conclusion

This is a creative and well-architected game with solid foundations. The AI integration is particularly impressive with its cost optimization and fallback strategies. Addressing the critical and high-priority issues will make this production-ready. The codebase shows good TypeScript practices and thoughtful design decisions.

The game's unique selling point - a personality-driven, learning shark AI - is well-implemented and genuinely innovative. With some cleanup and the fixes outlined above, this could be an excellent multiplayer experience.
