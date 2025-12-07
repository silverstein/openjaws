# BEACH PANIC: Jaws Royale

This repository contains the source code for "BEACH PANIC: Jaws Royale," a chaotic multiplayer survival party game for the 50th anniversary of Jaws.

## Project Documentation

The project documentation is organized into the following files:

- [Concept and Style](./docs/01_concept_and_style.md)
- [Tech Stack](./docs/02_tech_stack.md)
- [Gameplay Features](./docs/03_gameplay_features.md)
- [AI Integration](./docs/04_ai_integration.md)
- [Backend Schema](./docs/05_backend_schema.md)
- [Development Plan](./docs/06_development_plan.md)

## Quick Setup

1) Install deps  
`npm install`

2) Copy env template  
`cp .env.example .env.local`

3) Configure AI access  
- If using direct Anthropic/Gemini: set `ANTHROPIC_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY`.  
- If using Vercel AI Gateway: set `AI_GATEWAY_API_KEY=<gateway key>` (optional `AI_GATEWAY_ENDPOINT` if self-hosted). With a gateway key you do not need vendor keys.  
- `NEXT_PUBLIC_SHARK_MODEL`: model alias to hit (defaults to `claude-4.5-sonnet`; set to your gateway’s alias if different).

4) Convex dev (separate terminal)  
`npx convex dev`

5) Run app  
`npm run dev`
