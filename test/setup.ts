import { vi } from "vitest"

// Mock environment variables
process.env["NEXT_PUBLIC_CONVEX_URL"] = "https://test.convex.cloud"
process.env["ANTHROPIC_API_KEY"] = "test-key"
process.env["OPENAI_API_KEY"] = "test-key"
process.env["GOOGLE_GENERATIVE_AI_API_KEY"] = "test-key"

// Mock Next.js router
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

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useAction: vi.fn(),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock PIXI.js for canvas-based tests (Pixi.js v8 compatible)
vi.mock("pixi.js", () => {
  const mockFn = vi.fn

  class MockContainer {
    x = 0
    y = 0
    rotation = 0
    scale = { x: 1, y: 1, set: mockFn() }
    position = { x: 0, y: 0, set: mockFn() }
    anchor = { set: mockFn() }
    alpha = 1
    visible = true
    children: unknown[] = []
    addChild = mockFn()
    removeChild = mockFn()
    destroy = mockFn()
  }

  class MockGraphics extends MockContainer {
    clear = mockFn().mockReturnThis()
    beginFill = mockFn().mockReturnThis()
    endFill = mockFn().mockReturnThis()
    fill = mockFn().mockReturnThis()
    stroke = mockFn().mockReturnThis()
    moveTo = mockFn().mockReturnThis()
    lineTo = mockFn().mockReturnThis()
    circle = mockFn().mockReturnThis()
    rect = mockFn().mockReturnThis()
    roundRect = mockFn().mockReturnThis()
    ellipse = mockFn().mockReturnThis()
    star = mockFn().mockReturnThis()
    drawCircle = mockFn().mockReturnThis()
    drawRect = mockFn().mockReturnThis()
    lineStyle = mockFn().mockReturnThis()
    closePath = mockFn().mockReturnThis()
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
    constructor(_options?: Record<string, unknown>) {}
  }

  class MockFilter {
    resources: Record<string, unknown> = {}
    constructor(_options?: Record<string, unknown>) {}
  }

  return {
    Application: mockFn().mockImplementation(() => ({
      init: mockFn().mockResolvedValue(undefined),
      canvas: document.createElement("canvas"),
      stage: new MockContainer(),
      ticker: {
        add: mockFn(),
        remove: mockFn(),
      },
      renderer: {
        resize: mockFn(),
      },
      destroy: mockFn(),
    })),
    Container: MockContainer,
    Graphics: MockGraphics,
    Text: MockText,
    TextStyle: MockTextStyle,
    Filter: MockFilter,
    GlProgram: {
      from: mockFn().mockReturnValue({}),
    },
    Assets: {
      load: mockFn().mockResolvedValue({}),
    },
  }
})

// Mock AI SDK
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
