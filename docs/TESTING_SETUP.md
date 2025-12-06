# Beach Panic Test Suite

This document describes the test setup for Beach Panic (OpenJaws).

## Overview

The test suite uses **Vitest 4.x** as the test runner with the following features:
- React component testing with @testing-library/react
- Coverage reporting with @vitest/coverage-v8
- Class-based mock implementations for external dependencies
- GitHub Actions CI/CD pipeline

## Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- lib/game/entities/Player.test.ts

# Run with verbose output
npm test -- --reporter=verbose
```

## Test Structure

### Core Tests

1. **Mock AI System** (`lib/ai/mockResponses.test.ts`)
   - Tests the mock AI response generation
   - Validates personality-based decisions
   - Ensures contextual taunts and commentary

2. **Response Cache** (`lib/ai/responseCache.test.ts`)
   - Tests caching mechanisms for AI responses
   - Validates cache expiration and cleanup
   - Tests quality-based response selection

3. **Player Entity** (`lib/game/entities/Player.test.ts`)
   - Tests player movement and physics
   - Validates character abilities
   - Tests damage and health systems
   - Tests stamina system (depletes in water, regenerates on beach)

4. **Shark Entity** (`lib/game/entities/Shark.test.ts`)
   - Tests shark AI state machine
   - Validates hunting behaviors
   - Tests AI integration and personality system
   - Tests stun mechanics

## Mocking Strategy

### Vitest 4.x Class-Based Mocks

**Important**: Vitest 4.x requires class-based mocks for constructors. Function-based mocks like `vi.fn().mockImplementation(() => ({}))` will fail with "is not a constructor" errors.

### PIXI.js Mocks (Required Pattern)

```typescript
vi.mock("pixi.js", () => {
  // Must use classes, not functions returning objects
  class MockContainer {
    x = 0
    y = 0
    rotation = 0
    scale = { x: 1, y: 1, set: vi.fn() }
    anchor = { set: vi.fn() }
    alpha = 1
    visible = true
    children: unknown[] = []
    addChild = vi.fn((child) => {
      this.children.push(child)
      return child
    })
    removeChild = vi.fn()
    destroy = vi.fn()
  }

  class MockGraphics extends MockContainer {
    clear = vi.fn().mockReturnThis()
    circle = vi.fn().mockReturnThis()
    fill = vi.fn().mockReturnThis()
    stroke = vi.fn().mockReturnThis()
    moveTo = vi.fn().mockReturnThis()
    lineTo = vi.fn().mockReturnThis()
    closePath = vi.fn().mockReturnThis()
    star = vi.fn().mockReturnThis()
    poly = vi.fn().mockReturnThis()
    rect = vi.fn().mockReturnThis()
  }

  class MockText extends MockContainer {
    text = ""
    style = {}
    constructor(options?: { text?: string; style?: Record<string, unknown> }) {
      super()
      if (options) {
        this.text = options.text || ""
        this.style = options.style || {}
      }
    }
  }

  class MockTextStyle {
    fontFamily = "Arial"
    fontSize = 14
    fill = 0xffffff
    constructor(options?: Record<string, unknown>) {
      if (options) {
        Object.assign(this, options)
      }
    }
  }

  return {
    Container: MockContainer,
    Graphics: MockGraphics,
    Text: MockText,
    TextStyle: MockTextStyle,
    Application: vi.fn().mockImplementation(() => ({
      init: vi.fn().mockResolvedValue(undefined),
      canvas: document.createElement("canvas"),
      stage: new MockContainer(),
      ticker: { add: vi.fn(), remove: vi.fn() },
      renderer: { resize: vi.fn() },
      destroy: vi.fn(),
    })),
    Filter: class MockFilter {
      resources: Record<string, unknown> = {}
    },
    GlProgram: {
      from: vi.fn().mockReturnValue({}),
    },
    Assets: {
      load: vi.fn().mockResolvedValue({}),
    },
  }
})
```

### AI SDK Mocks

```typescript
vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({
    text: "Mocked AI response",
  }),
  streamText: vi.fn().mockResolvedValue({
    textStream: {
      [Symbol.asyncIterator]: async function* () {
        yield "Mocked streaming response"
      },
    },
  }),
}))
```

### Convex Mocks

```typescript
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useAction: vi.fn(),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
}))
```

### Next.js Router Mocks

```typescript
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => "",
}))
```

## Environment Variables

Test environment variables are set in `test/setup.ts`:

```typescript
process.env["NEXT_PUBLIC_CONVEX_URL"] = "https://test.convex.cloud"
process.env["ANTHROPIC_API_KEY"] = "test-key"
process.env["OPENAI_API_KEY"] = "test-key"
process.env["GOOGLE_GENERATIVE_AI_API_KEY"] = "test-key"
```

## Test File Location

Tests are co-located with source files:
- `lib/game/entities/Player.ts` → `lib/game/entities/Player.test.ts`
- `lib/ai/responseCache.ts` → `lib/ai/responseCache.test.ts`

## Common Patterns

### Testing Game Entities

```typescript
describe("Entity", () => {
  let entity: Entity

  beforeEach(() => {
    entity = new Entity(100, 200)
  })

  it("should initialize with correct position", () => {
    expect(entity.x).toBe(100)
    expect(entity.y).toBe(200)
  })

  it("should update position based on velocity", () => {
    entity.vx = 5
    entity.update(16) // 16ms delta
    expect(entity.x).toBeGreaterThan(100)
  })
})
```

### Testing with Fake Timers

```typescript
it("should handle time-based behavior", () => {
  vi.useFakeTimers()

  entity.startCooldown()
  vi.advanceTimersByTime(5000)

  expect(entity.cooldownComplete).toBe(true)

  vi.useRealTimers()
})
```

### Testing Async AI Responses

```typescript
it("should poll AI for decisions", async () => {
  const mockDecision = {
    action: "hunt",
    confidence: 0.8,
  }

  const mockController = {
    getDecision: vi.fn().mockResolvedValue(mockDecision),
  }

  entity.setAIController(mockController)

  vi.useFakeTimers()
  vi.advanceTimersByTime(3000)

  entity.update(16, player)
  await vi.runAllTimersAsync()

  expect(mockController.getDecision).toHaveBeenCalled()

  vi.useRealTimers()
})
```

## Mocking Date.now for Cache Tests

```typescript
it("should handle time-based cleanup", () => {
  const originalNow = Date.now
  const baseTime = originalNow()

  // Mock time
  Date.now = () => baseTime

  // Add entries...

  // Advance time
  Date.now = () => baseTime + 61000

  // Trigger cleanup...

  // Restore
  Date.now = originalNow
})
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/test.yml`):
1. Runs on push to main/develop and PRs
2. Tests on Node.js 18.x and 20.x
3. Generates coverage reports
4. Uploads to Codecov (optional)

## Troubleshooting

### "is not a constructor" Error

This means you're using a function-based mock where Vitest 4.x requires a class:

```typescript
// ❌ Wrong - will fail in Vitest 4.x
TextStyle: vi.fn().mockImplementation((config) => config)

// ✅ Correct - use a class
class MockTextStyle {
  constructor(options?: Record<string, unknown>) {
    if (options) Object.assign(this, options)
  }
}
TextStyle: MockTextStyle
```

### Async Test Timeouts

Use `vi.runAllTimersAsync()` for async operations with fake timers:

```typescript
vi.useFakeTimers()
vi.advanceTimersByTime(3000)
await vi.runAllTimersAsync() // Wait for promises
vi.useRealTimers()
```

### Mock Not Being Applied

Ensure mocks are defined before imports. In test files, `vi.mock()` calls are hoisted automatically, but in setup files the order matters.

## End-to-End Testing with Playwright

### Setup

Before running E2E tests, install Playwright browsers (one-time setup):

```bash
npx playwright install
```

This downloads the following browsers to `~/Library/Caches/ms-playwright/`:
- **Chromium** 143.0.7499.4 (~160 MiB)
- **Firefox** 144.0.2 (~92 MiB)
- **WebKit** 26.0 (~72 MiB)

### Overview

Beach Panic uses Playwright for end-to-end testing to verify the complete user experience, including:
- Page navigation and routing
- Canvas rendering and game initialization
- Keyboard input handling
- Player movement and controls
- NPC interactions
- Game flow (lobby -> game -> lobby)

### Running E2E Tests

```bash
# Run all E2E tests (builds and starts production server automatically)
npm run test:e2e

# Run E2E tests with UI mode (recommended for development)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/lobby.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### E2E Test Files

1. **Lobby Tests** (`e2e/lobby.spec.ts`)
   - Lobby page loads correctly
   - UI elements are visible
   - Navigation to game page works

2. **Game Page Tests** (`e2e/game-page.spec.ts`)
   - Game page loads and canvas renders
   - Game instructions are displayed
   - UI overlays are visible
   - Responsive layout works

3. **Game Controls Tests** (`e2e/game-controls.spec.ts`)
   - WASD keyboard movement
   - Arrow key movement
   - Space key for abilities
   - F key for selfie
   - E key for NPC interaction
   - ESC key returns to lobby
   - Continuous and simultaneous key presses

4. **NPC Interaction Tests** (`e2e/npc-interaction.spec.ts`)
   - NPC proximity detection
   - Dialogue opening with E key
   - Dialogue closing
   - Game state during dialogue
   - Movement away from NPCs

5. **Game Navigation Tests** (`e2e/game-navigation.spec.ts`)
   - Complete navigation flow
   - Direct page access
   - Page refresh handling
   - Rapid navigation between pages

### Configuration

The Playwright configuration is in `playwright.config.ts`:

```typescript
{
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,

  // Test in multiple browsers
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' }
  ],

  // Auto-start web server
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    timeout: 120000
  }
}
```

### Writing E2E Tests

#### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/game');

    // Wait for canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Interact with the page
    await page.keyboard.press('KeyW');

    // Assert
    await expect(canvas).toBeVisible();
  });
});
```

#### Testing Keyboard Input

```typescript
test('should handle movement', async ({ page }) => {
  await page.goto('/game');

  const canvas = page.locator('canvas');
  await canvas.click(); // Focus the canvas

  // Single key press
  await page.keyboard.press('KeyW');

  // Hold key down
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyW');

  // Multiple keys
  await page.keyboard.down('KeyW');
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(200);
  await page.keyboard.up('KeyW');
  await page.keyboard.up('KeyD');
});
```

#### Testing Canvas Rendering

```typescript
test('should render canvas', async ({ page }) => {
  await page.goto('/game');

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Wait for game to initialize
  await page.waitForTimeout(1000);

  // Verify canvas dimensions
  const canvasElement = await canvas.elementHandle();
  if (canvasElement) {
    const width = await canvasElement.evaluate(
      (el) => (el as HTMLCanvasElement).width
    );
    expect(width).toBeGreaterThan(0);
  }
});
```

#### Testing Navigation

```typescript
test('should navigate between pages', async ({ page }) => {
  await page.goto('/lobby');

  const startButton = page.getByRole('link', { name: /Start Solo Game/i });
  await startButton.click();

  await page.waitForURL('/game');
  await expect(page).toHaveURL('/game');

  // Return to lobby
  await page.keyboard.press('Escape');
  await page.waitForURL('/lobby');
});
```

### Best Practices

1. **Wait for Elements**: Always wait for canvas/elements to be visible before interacting
2. **Use Timeouts Sparingly**: Only use `page.waitForTimeout()` when necessary for game state
3. **Focus Canvas**: Click canvas before sending keyboard events
4. **Clean Up**: Use `test.beforeEach()` for setup that's needed across tests
5. **Assertions**: Always verify that actions had the expected effect
6. **Screenshots**: Playwright automatically captures screenshots on failure

### Debugging E2E Tests

```bash
# Debug mode - step through tests
npm run test:e2e:debug

# UI mode - see tests running with time-travel debugging
npm run test:e2e:ui

# Generate trace for failed tests
npx playwright test --trace on

# Show Playwright report
npx playwright show-report
```

### CI/CD Integration

E2E tests run automatically in GitHub Actions:
- On push to main/develop branches
- On pull requests
- Tests run in all three browsers (Chromium, Firefox, WebKit)
- Reports are uploaded as artifacts on failure

See `.github/workflows/test.yml` for the complete workflow.

### Troubleshooting

#### Test Timeout
Increase timeout in test or config:
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

#### Canvas Not Rendering
Add wait for canvas to be ready:
```typescript
await page.waitForTimeout(1000); // Wait for Pixi.js initialization
```

#### Keyboard Events Not Working
Make sure to focus the canvas first:
```typescript
const canvas = page.locator('canvas');
await canvas.click();
await page.keyboard.press('KeyW');
```

## Current Test Stats

### Unit Tests (Vitest)
- **Total Tests**: 85
- **Passing**: 85 (100%)
- **Test Files**: 4
- **Duration**: ~2 seconds

### E2E Tests (Playwright)
- **Total Tests**: 27 (across 5 test files)
- **Browsers**: Chromium, Firefox, WebKit
- **Coverage**: Lobby, game page, controls, NPC interaction, navigation
