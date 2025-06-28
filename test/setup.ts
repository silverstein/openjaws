import { vi } from 'vitest'

// Mock environment variables
process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test.convex.cloud'
process.env.ANTHROPIC_API_KEY = 'test-key'
process.env.OPENAI_API_KEY = 'test-key'
process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '',
}))

// Mock Convex
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useAction: vi.fn(),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock PIXI.js for canvas-based tests
vi.mock('pixi.js', () => ({
  Application: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    canvas: document.createElement('canvas'),
    stage: {
      addChild: vi.fn(),
      removeChild: vi.fn(),
    },
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    destroy: vi.fn(),
  })),
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
  })),
  Graphics: vi.fn().mockImplementation(() => ({
    clear: vi.fn(),
    beginFill: vi.fn(),
    drawCircle: vi.fn(),
    drawRect: vi.fn(),
    endFill: vi.fn(),
    position: { x: 0, y: 0 },
  })),
  Text: vi.fn().mockImplementation(() => ({
    position: { x: 0, y: 0 },
    style: {},
  })),
  Assets: {
    load: vi.fn().mockResolvedValue({}),
  },
}))

// Mock AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: 'Mocked AI response',
  }),
  streamText: vi.fn().mockResolvedValue({
    textStream: {
      [Symbol.asyncIterator]: async function* () {
        yield 'Mocked streaming response'
      },
    },
  }),
}))

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))