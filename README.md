# Руах Компас / Ruach Compass

Personal coaching app with AI-powered daily quests, relationship scripts, and 2-minute reset protocols. Built with React Native (Expo) and Node.js backend proxy for Gemini AI.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Setup

1. **Clone and install dependencies:**

```bash
cd ruach-compass
npm install
```

2. **Configure API key:**

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env and add your GEMINI_API_KEY
```

3. **Build shared package:**

```bash
cd packages/shared && npm run build && cd ../..
```

4. **Start the backend:**

```bash
npm run api
# API will run on http://localhost:3001
```

5. **Start the mobile app (new terminal):**

```bash
npm run mobile
# Expo will open. Press 'i' for iOS simulator or 'a' for Android
```

## Project Structure

```
ruach-compass/
├── apps/
│   ├── mobile/          # React Native (Expo) app
│   │   ├── app/         # Expo Router screens
│   │   ├── components/  # Reusable UI components
│   │   ├── services/    # API client
│   │   └── store/       # Zustand state management
│   │
│   └── api/             # Node.js backend proxy
│       ├── routes/      # API endpoints
│       ├── services/    # Gemini AI service
│       └── middleware/  # Rate limiting
│
└── packages/
    └── shared/          # Shared types, schemas, prompts
        ├── types/       # TypeScript types
        ├── schemas/     # Zod validation schemas
        └── prompts/     # Gemini prompt templates
```

## Features

### Daily Quests (AI-generated)
- Morning check-in (energy, stress, sleep, focus)
- Personalized quests based on current state
- Main quest + 2 side quests
- Kabbalah-inspired "why" for each quest
- Low-energy fail-safe versions

### 2-Minute Reset (Tzimtzum Mode)
- 90-second protocol for triggered states
- 6 trigger types: jealousy, uncertainty, anger, shame, loneliness, overwhelm
- 5 steps: Label → Breath → Reframe → Action → Anchor
- Works offline with fallback protocols

### Relationship Scripts
- 10 scenario types (provocation, accusation, coldness, etc.)
- 4 response variants: short, neutral, boundary, exit
- Copy to clipboard
- Cached for offline use

### Trust Anchor
- Customizable anchor word (default: ДОВЕРИЕ)
- Appears throughout the app
- Reinforces core principle: "I act correctly; outcome is not my control"

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/ai/quests` | POST | Generate daily quests |
| `/ai/script` | POST | Generate conversation scripts |
| `/ai/reset` | POST | Generate reset protocol |
| `/ai/safety` | POST | Check text for safety concerns |

## Environment Variables

### Backend (apps/api/.env)

```env
GEMINI_API_KEY=your_key_here   # Required
PORT=3001                       # Optional, default: 3001
CORS_ORIGIN=*                   # Optional, default: *
```

### Mobile (apps/mobile/.env)

```env
EXPO_PUBLIC_API_URL=http://localhost:3001  # Backend URL
```

For physical device testing, use your computer's local IP:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.xxx:3001
```

## Development

### Running Tests

```bash
# All workspaces
npm test

# Specific package
npm test --workspace=packages/shared
```

### Building for Production

```bash
# Build shared package
cd packages/shared && npm run build

# Build API
cd apps/api && npm run build

# Build mobile (EAS Build)
cd apps/mobile && eas build
```

## Tech Stack

- **Mobile:** React Native, Expo, Expo Router, Zustand
- **Backend:** Node.js, Express, Zod
- **AI:** Gemini 3 Flash/Pro via Google Gen AI SDK
- **Language:** TypeScript everywhere
- **UI Language:** Russian (app content)

## Safety

The app includes safety rails:
- Detects self-harm ideation, crisis states, substance mentions
- Provides supportive responses and crisis resources
- Does not diagnose or replace professional help

## License

Private/Personal Use
