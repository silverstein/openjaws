# Beach Panic Test Suite

This document describes the test setup for Beach Panic (OpenJaws).

## Overview

The test suite uses Vitest as the test runner with the following features:
- React component testing with @testing-library/react
- Coverage reporting with @vitest/coverage-v8
- Mock implementations for external dependencies
- GitHub Actions CI/CD pipeline

## Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
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

4. **Shark Entity** (`lib/game/entities/Shark.test.ts`)
   - Tests shark AI state machine
   - Validates hunting behaviors
   - Tests AI integration

## Mocking Strategy

### External Dependencies

All external dependencies are mocked to ensure tests run without:
- API keys (Anthropic, OpenAI, Google)
- Convex backend
- PIXI.js rendering
- Next.js router

### Mock Implementations

```typescript
// PIXI.js mocks
vi.mock('pixi.js', () => ({
  Application: vi.fn(),
  Container: vi.fn(),
  Graphics: vi.fn(),
  // ... etc
}))

// AI SDK mocks
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: 'Mocked AI response'
  })
}))

// Convex mocks
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  ConvexProvider: ({ children }) => children
}))
```

## Environment Variables

Test environment variables are set in `test/setup.ts`:
- `NEXT_PUBLIC_CONVEX_URL`: Mock Convex URL
- `ANTHROPIC_API_KEY`: Test key
- `OPENAI_API_KEY`: Test key
- `GOOGLE_GENERATIVE_AI_API_KEY`: Test key

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/test.yml`):
1. Runs on push to main/develop and PRs
2. Tests on Node.js 18.x and 20.x
3. Generates coverage reports
4. Uploads to Codecov (optional)

## Writing New Tests

When adding new tests:
1. Place test files next to the source files with `.test.ts` extension
2. Use descriptive test names
3. Mock external dependencies
4. Test edge cases and error conditions
5. Maintain test coverage above 80%

## Common Test Patterns

### Testing Game Entities
```typescript
describe('Entity', () => {
  let entity: Entity
  
  beforeEach(() => {
    entity = new Entity(x, y)
  })
  
  it('should update position', () => {
    entity.update(deltaTime, input)
    expect(entity.position).toEqual({ x: newX, y: newY })
  })
})
```

### Testing AI Responses
```typescript
it('should generate contextual response', () => {
  const context = createMockContext()
  const response = generateResponse(context)
  
  expect(response).toMatchObject({
    action: expect.stringMatching(/hunt|patrol|retreat/),
    confidence: expect.any(Number)
  })
})
```

## Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure all dependencies are installed with `npm install`
2. **Mock not working**: Check that mocks are defined before imports
3. **Async test timeouts**: Use proper async/await or increase timeout

### Debug Mode

Run tests with debug output:
```bash
npm test -- --reporter=verbose
```

## Future Improvements

- Add E2E tests with Playwright
- Implement visual regression testing
- Add performance benchmarks
- Increase test coverage to 90%+