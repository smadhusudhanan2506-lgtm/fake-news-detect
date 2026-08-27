# FactCheck AI — AI Fake News Detection & AI Assistant Platform

> **"Verify Before You Believe."**

**FactCheck AI** is a production-grade full-stack cross-platform mobile application and intelligent verification backend designed to detect fake news, analyze viral WhatsApp forwards, verify URLs, extract claims from OCR screenshots and video files, provide real-time grounded AI chat assistance, deliver daily personalized briefings, and empower human content moderators.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │   Flutter Mobile Application (Dart)   │
                      │  (Material 3, Riverpod, GoRouter)     │
                      └──────────────────┬────────────────────┘
                                         │  HTTPS / WSS
                                         ▼
                      ┌───────────────────────────────────────┐
                      │ Node.js / TypeScript Express + Socket │
                      └───────┬──────────┬────────────┬───────┘
                              │          │            │
           ┌──────────────────┴──┐ ┌─────┴───────┐ ┌──┴──────────────────┐
           │ Verification Engine │ │ AI Chat &   │ │ News & Briefings    │
           │ • Claim Extractor   │ │ Streaming   │ │ • RSS / Ingestion   │
           │ • Google FactCheck  │ │ • OpenAI    │ │ • Categories        │
           │ • Domain Trust (RB) │ │ • Citations │ │ • Daily Summarizer  │
           └──────────┬──────────┘ └─────┬───────┘ └──┬──────────────────┘
                      │                  │            │
                      └──────────────────┼────────────┘
                                         │
                                         ▼
                      ┌───────────────────────────────────────┐
                      │  MongoDB & In-Memory Fallback Cache   │
                      └───────────────────────────────────────┘
```

---

## Key Features

1. **Multimodal Claim Verification**:
   - **Raw Text & WhatsApp Forwarded Message Mode**: Automatically cleans forwarded headers and identifies sensationalist urgency markers.
   - **URL Verification**: Supports news websites, YouTube, Instagram Reels, X/Twitter posts, Facebook, and TikTok.
   - **Screenshot & Image OCR**: Optical Character Recognition pipeline parses text from screenshots and photos.
   - **Video Processing**: Audio transcription and video frame sampling pipeline.
   - **Share Sheet Integration**: Share content directly from WhatsApp or browsers to trigger automated verification.

2. **Transparent Evidence-Based Decision Engine**:
   - **Weighted Scoring**: Fact-check agreement (35%), Trusted news (25%), Source reliability (15%), Consistency (15%), AI reasoning (10%).
   - **Clear Verdicts**: `VERIFIED` (Green), `FALSE` (Red), `MISLEADING` (Yellow), `UNVERIFIABLE` (Orange).
   - **Confidence Metric**: Accompanied by explanation disclaimers.
   - **Zero Hallucination Rules**: Strict grounding in primary evidence and official government gazettes.

3. **Conversational AI Assistant**:
   - **3 Distinct Modes**: 🤖 General Assistant, 📰 Current News Query, 🔍 News Verification Mode.
   - **Real-Time Streaming**: Socket.IO token streaming chunks with markdown and code blocks.
   - **Voice Input (STT) & Audio Playback (TTS)**: Built-in voice recognition and Text-to-Speech audio reader.

4. **Curated News & Daily Briefing**:
   - Categorized verified news feed (*India, World, Tech, Science, Politics, Business, Sports, Health, Education*).
   - Morning Daily Briefing customized by user interests.

5. **Moderator & Admin Command Center**:
   - Priority review queue with flags for suspicious submissions.
   - Adjudication tools: approve, modify verdict, reject, and add audit notes.
   - Domain Trust & Reliability score configuration.

---

## Technology Stack

- **Mobile Client**: Flutter, Dart (Null Safety), Material 3, Flutter Riverpod, GoRouter, Dio, Socket.IO Client, FlutterTTS, SpeechToText, FlutterMarkdown.
- **Backend API**: Node.js, TypeScript (Strict Mode), Express.js, Socket.IO, Mongoose / MongoDB, Winston, Zod, Multer, Tesseract.js.
- **AI & Fact Checking**: OpenAI GPT-4o / GPT-3.5 API, Google Fact Check Tools API, PIB Fact Check, BOOM Live, Alt News registries.
- **Web Companion**: Vanilla HTML5, Modern CSS Design System, Responsive Phone Simulator.

---

## Getting Started & Running Locally

### 1. Prerequisites
- Node.js (v18+) and npm
- (Optional) Flutter SDK (v3.19+) for native Android/iOS compilation
- (Optional) MongoDB running locally or cloud MongoDB Atlas connection URI

---

### 2. Start the Backend Server

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# (Optional) Review environment configuration in .env
# If OPENAI_API_KEY is not set, system automatically runs on local deterministic AI reasoning mode

# Run automated tests
npm test

# Start the backend server
npm run dev
```
The server will boot on `http://localhost:5000`:
- **REST API**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`
- **WebSocket**: `ws://localhost:5000/ws/chat`

---

### 3. Test Immediately in Browser (Web Companion)

You can instantly open and test the full application locally in any browser without compiling Flutter:
```bash
# Simply open the file web-preview/index.html in your browser
# Or use any static server, for example:
npx serve web-preview
```

---

### 4. Running the Flutter Mobile Application

```bash
# Navigate to mobile directory
cd mobile

# Get Flutter packages
flutter pub get

# Run on connected device, Android Emulator, or iOS Simulator
flutter run

# To build production Android APK:
flutter build apk --release
```

---

## Directory Structure

```
fake news/
├── server/                    # Node.js + TypeScript Backend
│   ├── src/
│   │   ├── config/            # Env, Database, Logger, Memory Store
│   │   ├── models/            # Mongoose Schemas (User, Analysis, Claim, News, Conversation, Moderation)
│   │   ├── controllers/       # Auth, Verify, Chat, News, Moderation Controllers
│   │   ├── services/          # Verification Pipeline, Claim Extractor, FactCheck, OpenAI, OCR, News, Mod
│   │   ├── routes/            # Express REST Router Handlers
│   │   ├── middleware/        # Auth, RBAC, Rate Limiting, Error Handling
│   │   ├── websocket/         # Socket.IO Real-time Streaming Chat
│   │   ├── seeds/             # Sample Seed Data
│   │   └── index.ts           # Server Bootstrap
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                    # Flutter Mobile Application
│   ├── lib/
│   │   ├── core/              # Theme, Router, Network Client, Constants
│   │   ├── models/            # Dart Models (Analysis, Claim, News, ChatMessage, User)
│   │   ├── services/          # API, Auth, Chat Socket, TTS & Voice Services
│   │   ├── providers/         # Riverpod State Management Providers
│   │   ├── features/          # Feature UI (Splash, Onboarding, Auth, Home, Verify, Result, Chat, News, History, Moderator, Profile)
│   │   ├── widgets/           # Reusable Components (ConfidenceGauge, VerdictBadge, SourceCard, StageProgress)
│   │   └── main.dart          # App Entry
│   └── pubspec.yaml
│
├── web-preview/               # Interactive Browser Test Client & Simulator
│   ├── index.html
│   ├── style.css
│   └── app.js
│
└── docs/
    └── API_DOCUMENTATION.md   # Complete REST & WebSocket API Specs
```

---

## Environment Variables (`server/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP Server port | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `JWT_SECRET` | Secret key for JWT signing | `factcheck_super_secret_jwt_key_2026_production` |
| `MONGODB_URI` | MongoDB Connection URI | `mongodb://127.0.0.1:27017/factcheck_ai` |
| `OPENAI_API_KEY` | (Optional) OpenAI API Key for GPT-4o synthesis | *Local deterministic engine fallback if unset* |
| `GOOGLE_FACT_CHECK_API_KEY` | (Optional) Google Fact Check Tools API Key | *Local fact-check database fallback if unset* |
| `NEWS_API_KEY` | (Optional) News API key for live feed ingestion | *Curated feeds fallback if unset* |

---

## Testing

```bash
# Run backend unit and integration test suite
cd server
npm test
```

Expected output:
```
PASS src/__tests__/verification.test.ts
  FactCheck AI - Core Verification Pipeline Tests
    ✓ ClaimExtractor should extract atomic claims and normalize text
    ✓ SourceReliabilityService should accurately rate domains
    ✓ VerificationPipeline should classify debunked scholarship claim as FALSE
    ✓ OpenAiService chat should handle verification mode with citations

PASS src/__tests__/api.test.ts
  FactCheck AI - REST API Endpoints
    ✓ GET /api/health returns healthy status
    ✓ POST /api/auth/register creates user and returns JWT
    ✓ POST /api/auth/demo-switch retrieves moderator token
    ✓ POST /api/verify/text verifies text claim
    ✓ GET /api/news returns categorized verified news
    ✓ GET /api/news/daily-briefing returns morning briefing
    ✓ POST /api/chat handles AI assistant messages
    ✓ GET /api/moderation/queue allows moderator access

Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
```

---

## License

FactCheck AI is released under the **MIT License**.
