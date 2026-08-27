# FactCheck AI — API & Architecture Specification

**FactCheck AI** ("*Verify Before You Believe*") provides a production-quality REST API and WebSocket streaming architecture for fake news verification, conversational news intelligence, and moderation.

---

## Base URLs
- **REST API**: `http://localhost:5000/api`
- **WebSocket (Socket.IO)**: `ws://localhost:5000/ws/chat`

---

## Authentication & Headers
Pass the JWT Bearer token in the `Authorization` header for protected endpoints:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
Create a new user account.
```json
{
  "name": "Aditi Sharma",
  "email": "aditi@example.com",
  "password": "SecurePassword123!",
  "phone": "+919876543210",
  "role": "user"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account registered successfully.",
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "_id": "65db8...",
      "name": "Aditi Sharma",
      "email": "aditi@example.com",
      "role": "user"
    }
  }
}
```

### `POST /api/auth/login`
Authenticate user credentials.
```json
{
  "email": "aditi@example.com",
  "password": "SecurePassword123!"
}
```

### `GET /api/auth/me`
Retrieve currently authenticated user session.

### `POST /api/auth/demo-switch`
Quickly switch roles (`user`, `moderator`, `admin`) for development and demonstration.

---

## 2. Verification Pipeline Endpoints (`/api/verify`)

### `POST /api/verify/text`
Verify raw text or WhatsApp forwarded message claims.
```json
{
  "text": "Breaking News! Government has announced ₹50,000 for every student from next month. Claim now!",
  "inputType": "whatsapp",
  "skipCache": false
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "analysisId": "analysis_65d8...",
  "verdict": "false",
  "confidence": 96,
  "summary": "This claim is FALSE. PIB Fact Check confirmed no ₹50,000 scholarship or cash disbursement exists.",
  "explanation": "This claim has been debunked by authoritative fact-checking and official sources.",
  "whyPoints": [
    "Officially debunked by Press Information Bureau (PIB Fact Check).",
    "No Ministry of Education circular or budgetary allocation exists.",
    "Contains viral forwarding patterns and unverified urgency markers."
  ],
  "claims": [
    {
      "claimText": "Government has announced ₹50,000 for every student from next month.",
      "normalizedClaim": "government has announced 50 000 for every student from next month",
      "verdict": "false",
      "confidence": 96,
      "evidence": [...]
    }
  ],
  "sources": [
    {
      "name": "PIB Fact Check",
      "url": "https://pib.gov.in/FactCheck",
      "reliabilityScore": 0.98,
      "isGovernment": true,
      "isFactChecker": false
    }
  ],
  "processingTimeMs": 340,
  "stagesCompleted": [
    "Reading content...",
    "Extracting claims...",
    "Searching fact-check sources...",
    "Comparing evidence...",
    "Generating explanation...",
    "Verification complete."
  ],
  "createdAt": "2026-08-25T10:15:00.000Z"
}
```

### `POST /api/verify/url`
Verify news URLs, YouTube videos, Instagram Reels, Facebook posts, or X/Twitter links.
```json
{
  "url": "https://pib.gov.in/FactCheck/student-grant-fake"
}
```

### `POST /api/verify/image` (Multipart Form-Data)
Upload screenshot or image for OCR text extraction and claim verification.
- **Fields**: `image` (binary file), `inputType` (`screenshot` | `image`).

### `POST /api/verify/video` (Multipart Form-Data)
Upload video file for speech-to-text transcription and frame OCR analysis.
- **Fields**: `video` (binary file).

### `GET /api/verify/history`
Retrieve past verification analyses with filtering.
- **Query params**: `verdict` (`all` | `verified` | `false` | `misleading` | `unverifiable`), `search` (keyword), `page`, `limit`.

---

## 3. Conversational AI Assistant (`/api/chat` & `/ws/chat`)

### `POST /api/chat` (REST Fallback)
```json
{
  "message": "Is it true that board exams are being cancelled next year?",
  "mode": "verification"
}
```

### WebSocket Streaming (`/ws/chat`)
- **Connection**: Connect to `http://localhost:5000/ws/chat`.
- **Emit `authenticate`**: `{ "token": "<JWT_TOKEN>" }`
- **Emit `message`**: `{ "message": "...", "mode": "general" | "news" | "verification" }`
- **Listen `typing`**: `{ "isTyping": true | false }`
- **Listen `response_chunk`**: `{ "chunk": "...", "fullContent": "..." }`
- **Listen `response_complete`**: `{ "message": { "role": "assistant", "content": "...", "sources": [...] } }`

---

## 4. Verified News & Daily Briefings (`/api/news`)

### `GET /api/news`
List verified news items with category filtering (`India`, `World`, `Technology`, `Science`, `Politics`, `Business`, `Health`, `Education`).

### `GET /api/news/trending`
Retrieve trending verified fact-checks and news updates.

### `GET /api/news/daily-briefing`
Generate personalized daily news briefing based on user interests.

---

## 5. Moderation Queue (`/api/moderation`)

*(Requires `moderator` or `admin` role)*

### `GET /api/moderation/stats`
Retrieve moderation statistics:
```json
{
  "success": true,
  "data": {
    "stats": {
      "pending": 1,
      "reviewing": 0,
      "approved": 2,
      "rejected": 0,
      "total": 3,
      "reportsToday": 1
    }
  }
}
```

### `GET /api/moderation/queue`
List pending flagged reports with priority flags.

### `POST /api/moderation/:id/review`
Adjudicate a flagged analysis item.
```json
{
  "action": "approve",
  "finalVerdict": "false",
  "notes": "Confirmed by primary PIB Fact Check release PR-2026-08."
}
```

### `GET /api/moderation/sources`
List all domain trust reliability scores.
