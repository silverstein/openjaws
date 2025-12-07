# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layouts, and handlers (main entry).
- `components/`: Reusable UI, game, and provider pieces (`ui/`, `game/`, `ai/`).
- `lib/` & `hooks/`: Shared utilities and custom hooks; keep pure helpers in `lib/`.
- `convex/`: Convex backend functions and schema; separate server/client modules.
- `public/`: Static assets; prefer hashed filenames for heavy media.
- `test/`: Unit & integration specs (Vitest + Testing Library) mirroring source paths.
- `e2e/`: Playwright end-to-end specs and fixtures.
- `docs/`: Design and gameplay references; update when mechanics/UI change.

## Build, Test, and Development Commands
- `npm run dev` — Next.js dev server with Turbopack.
- `npm run build` / `npm start` — Production build then serve.
- `npm run lint` — Biome formatter+linter; fixes most style issues.
- `npm test` — Vitest suite; `npm run test:coverage` before merge.
- `npm run test:ui` — Vitest UI for focused debugging.
- `npm run test:e2e` — Headless Playwright; `:headed` or `:debug` for visuals.
- `npm run test:e2e:ui` — Playwright test explorer.
- `./verify-setup.sh` — Quick tooling sanity check after cloning.

## Coding Style & Naming Conventions
- TypeScript, React 19, Next.js 16; prefer functional components + hooks.
- Biome enforces 2-space indent, LF, 100-char lines, double quotes in JSX, trailing commas, organized imports.
- Components `PascalCase.tsx`; hooks prefixed `use`; helpers `kebab-case.ts` inside domain folders.
- Shared state via zustand; keep effects inside hooks; avoid inline styles unless dynamic (use Tailwind 4 utilities).

## Testing Guidelines
- Unit/integration: `.test.ts`/`.test.tsx` beside source or in `test/`; use Testing Library for React behavior.
- E2E: Scope Playwright specs by feature (e.g., `e2e/lobby.spec.ts`); prefer stable data-testid/selectors over text.
- Coverage: Run `npm run test:coverage`; add regression cases when fixing bugs.

## Commit & Pull Request Guidelines
- Commits: Short, imperative statements (see history: "Fix SharkHealthBar for mobile"); group related changes.
- Messages: Capitalized verb, no trailing period, ~72 characters max.
- PRs: Provide summary, linked issue, test results (`npm test`, `npm run test:e2e` when relevant), and UI screenshots/gifs.
- Checks: Ensure lint and required test suites pass before review.

## Security & Configuration Tips
- Keep API keys and Convex env values in `.env.local`; add `.env.example` entries when introducing new vars.
- Stick to existing stack (Next 16, Convex, zustand, Tailwind); discuss new services beforehand.
- Avoid logging PII; sanitize user input in Convex functions and API routes.
