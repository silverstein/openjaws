# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes, layouts, and game screens (lobby, game canvas, HUD).
- `components/`: Reusable UI pieces (panels, controls, status widgets) used across routes.
- `convex/`: Convex backend functions (`games.ts`, `players.ts`, `objectives.ts`) plus schema and generated client.
- `hooks/` & `lib/`: Custom React hooks and utilities (state sync, AI helpers, math, formatting).
- `public/`: Static assets (images, audio, fonts); keep large binaries out of Git when possible.
- `docs/`: Design and product briefs; start here for feature context.
- `e2e/` & `test/`: Playwright specs live in `e2e/`; Vitest setup in `test/setup.ts` with colocated `*.test.ts(x)` files near the code under test.

## Build, Test, and Development Commands
- `npm run dev` — Start the Next.js dev server with Turbopack at http://localhost:3000.
- `npm run build` / `npm start` — Production build and serve (used by Playwright webServer).
- `npm run lint` — Next.js lint; use `npx biome check .` / `npx biome format .` for formatter enforcement.
- `npm test` — Vitest unit/component suite (jsdom, globals true).
- `npm run test:coverage` — V8 coverage; expect changed files to have coverage.
- `npm run test:e2e` — Playwright E2E against a built server; use `test:e2e:ui` or `...:headed` when debugging locally.

## Coding Style & Naming Conventions
- TypeScript + React 19 with Next.js 16 App Router; prefer functional components and hooks.
- 2-space indentation, LF line endings, 100 char width; Biome enforces formatting and lint rules (no `any`, no vars, exhaustive deps warnings).
- JSX uses double quotes; keep props sorted logically and extract reusable pieces into `components/`.
- Path aliases: `@/components`, `@/lib`, `@/hooks`, `@/convex`.
- Name files `kebab-case.tsx` for components and `*.test.tsx` for colocated tests; keep Convex functions verb-noun (`joinGame`, `updateObjective`).

## Testing Guidelines
- Unit/component tests: prefer Testing Library + Vitest; render via `test/setup.ts` defaults. Add new tests next to source or under `test/` with `*.test.ts(x)`.
- E2E: Playwright specs in `e2e/`; avoid `test.only` (CI forbids `only`). Base URL defaults to `http://localhost:3000`; traces, screenshots, and videos retained on failure.
- Coverage: use `npm run test:coverage` before PRs to confirm changed areas are exercised; exclude generated Convex client and config files per `vitest.config.ts`.

## Commit & Pull Request Guidelines
- Commit messages: sentence case, present tense, concise summary (e.g., `Improve lobby matchmaking latency`). Avoid multi-topic commits.
- Branch/PRs: include a short description, link to issue/task, and note affected areas (UI, Convex, tests). Add screenshots or short clips for UI changes and mention new commands or env vars.
- Checks: run `npm run lint`, `npm test`, and relevant Playwright flows before requesting review; highlight any intentionally skipped tests.

## Security & Configuration Tips
- Secrets and Convex environment values belong in your local `.env` or Convex dashboard, never in Git. Use placeholder keys in examples.
- Generated Convex client lives in `convex/_generated`; regenerate with `npx convex dev` when schema changes.
- Prefer `zustand` stores for client state and Convex mutations/queries for persistence; avoid ad-hoc globals.
