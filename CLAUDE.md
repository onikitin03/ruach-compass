# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run mobile        # Start Expo dev server

# Build shared package (required after changes)
cd packages/shared && npm run build && cd ../..

# Testing
npm test                                    # All workspaces
npm test --workspace=packages/shared        # Single workspace
npm test --workspace=apps/mobile

# Production builds
cd apps/mobile && eas build                 # Build mobile (EAS)

# Supabase (Edge Functions)
supabase functions serve                    # Local dev server
supabase db push                            # Push migrations
supabase functions deploy <name>            # Deploy function
```

## Architecture

**Monorepo with npm workspaces:**
- `apps/mobile` - React Native (Expo) mobile app with Expo Router
- `packages/shared` - TypeScript types, Zod schemas, AI prompt templates
- `supabase/functions` - Edge Functions for AI generation (Deno)
- `supabase/migrations` - Database migrations

**Backend (Supabase):**
- **Auth**: Email/password authentication via Supabase Auth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Edge Functions**: Serverless functions for AI (generate-quests, generate-scripts, generate-reset)
- **CI/CD**: GitHub Actions auto-deploy on push to main

**Data flow:**
1. User authenticates via Supabase Auth
2. Mobile app collects daily state (energy, stress, sleep, focus)
3. Edge Function receives state, calls Gemini AI with prompt templates
4. AI generates personalized quests/scripts, saved to database
5. Mobile syncs with Supabase and caches for offline use

**Key patterns:**
- All types defined in `packages/shared/src/types/index.ts` - exported as `@ruach/shared`
- AI prompts in `packages/shared/src/prompts/templates/`
- Mobile state management: Zustand store at `apps/mobile/store/useStore.ts`
- Auth context: `apps/mobile/contexts/AuthContext.tsx`
- Supabase client: `apps/mobile/lib/supabase.ts`
- Offline fallbacks: pre-built reset protocols when offline

**Database tables:**
- `user_profiles` - User settings (values, triggers, tone preference)
- `daily_states` - Daily check-ins (energy, stress, focus, etc.)
- `quests` - Generated quests with completion tracking
- `scripts_cache` - Cached conversation scripts
- `api_requests` - Rate limiting (10 requests/minute per user)

**Domain model (Russian-language content):**
- 5 Ruach States: calm, tense, triggered, focused, drained
- 6 Trigger Types: jealousy, uncertainty, anger, shame, loneliness, overwhelm
- 10 Scenario Types for relationship scripts (provocation, accusation, coldness, etc.)
- 2-Minute Reset: 5-step Tzimtzum protocol (label → breath → reframe → action → anchor)

## Environment Setup

```bash
# Mobile (apps/mobile/.env)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Edge Functions (set in Supabase Dashboard)
GEMINI_API_KEY=your-gemini-key

# GitHub Secrets (for CI/CD)
SUPABASE_ACCESS_TOKEN=your-access-token
SUPABASE_PROJECT_ID=your-project-id
```

## Important Notes

- **Rebuild shared after changes:** Changes to `packages/shared` require `npm run build` before they're available to apps
- **Russian UI language:** All user-facing strings in types end with `Ru` suffix (e.g., `titleRu`, `whyRu`)
- **Auth required:** All Edge Functions require valid Supabase auth token
- **Rate limiting:** 10 requests/minute per user, enforced at Edge Function level
- **Gemini model:** Using `gemini-3-flash-preview` for AI generation
