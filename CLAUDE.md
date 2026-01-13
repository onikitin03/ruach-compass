# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run api           # Start API dev server (port 3001, hot reload)
npm run mobile        # Start Expo dev server

# Build shared package (required after changes)
cd packages/shared && npm run build && cd ../..

# Testing
npm test                                    # All workspaces
npm test --workspace=packages/shared        # Single workspace
npm test --workspace=apps/api
npm test --workspace=apps/mobile

# Production builds
npm run build:api                           # Build API
cd apps/mobile && eas build                 # Build mobile (EAS)
```

## Architecture

**Monorepo with npm workspaces:**
- `apps/api` - Express backend proxy for Gemini AI (port 3001)
- `apps/mobile` - React Native (Expo) mobile app with Expo Router
- `packages/shared` - TypeScript types, Zod schemas, AI prompt templates

**Data flow:**
1. Mobile app collects daily state (energy, stress, sleep, focus)
2. API receives state + user profile, calls Gemini with prompt templates from shared package
3. AI generates personalized quests/scripts, validated via Zod schemas
4. Mobile caches responses for offline use via Zustand + AsyncStorage

**Key patterns:**
- All types defined in `packages/shared/src/types/index.ts` - exported as `@ruach/shared`
- AI prompts in `packages/shared/src/prompts/templates/` - quest-generation, script-generation, reset-protocol, safety
- Mobile state management: Zustand store at `apps/mobile/store/useStore.ts`
- API routes: `apps/api/src/routes/ai.ts` handles `/ai/quests`, `/ai/script`, `/ai/reset`, `/ai/safety`
- Offline fallbacks: pre-built reset protocols when API unavailable

**Domain model (Russian-language content):**
- 5 Ruach States: calm, tense, triggered, focused, drained
- 6 Trigger Types: jealousy, uncertainty, anger, shame, loneliness, overwhelm
- 10 Scenario Types for relationship scripts (provocation, accusation, coldness, etc.)
- 2-Minute Reset: 5-step Tzimtzum protocol (label → breath → reframe → action → anchor)

## Environment Setup

```bash
# Backend (apps/api/.env)
GEMINI_API_KEY=your_key_here   # Required
PORT=3001                       # Optional
CORS_ORIGIN=*                   # Optional

# Mobile (apps/mobile/.env) - use local IP for physical devices
EXPO_PUBLIC_API_URL=http://localhost:3001
```

## Important Notes

- **Rebuild shared after changes:** Changes to `packages/shared` require `npm run build` before they're available to apps
- **Russian UI language:** All user-facing strings in types end with `Ru` suffix (e.g., `titleRu`, `whyRu`)
- **Safety-critical:** The `/ai/safety` endpoint and `SafetyFlag` types handle crisis detection - maintain intervention messaging
