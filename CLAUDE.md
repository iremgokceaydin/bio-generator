# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Production build
npm run lint      # Run ESLint
```

No test suite is configured.

## Architecture

Next.js 15 App Router app with React 19 and Tailwind CSS v4. Despite the repo name, this uses **Google Gemini** (not Claude) via `@google/genai`.

**Request flow:**
1. `app/page.tsx` — client component with five range sliders (bio length, emoji count, reality, career emphasis, aggression) + generate button
2. `POST /api/generate-bio` (`app/api/generate-bio/route.ts`) — validates input with Zod, builds a prompt embedding facts from `data/profile.json`, calls `gemini-2.5-flash-preview` with structured JSON output schema
3. Response returns `{ bio, usedFactIds, usedLinkKeys, missingInfo }`

**Key design constraint:** The API route enforces strict factuality — it embeds facts from `data/profile.json` directly in the prompt and includes "ABSOLUTE RULES" preventing the model from inventing anything. Only facts with IDs from that file may appear in generated bios.

**`data/profile.json`** is the single source of truth for all personal/professional facts. Any new facts to be referenced in bios must be added here with a unique fact ID.

## Environment

Requires `GEMINI_API_KEY` in `.env.local`.
