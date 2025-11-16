# Reverso — Technical Design Document (MVP)

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile Web Browser                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React Application (TypeScript)                       │  │
│  │  ├── UI Components (Screen A, B, C, D)               │  │
│  │  ├── Audio Recording & Playback                       │  │
│  │  ├── Audio Reversal (WebAudio API)                    │  │
│  │  └── State Management (React Hooks)                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
         ┌──────────────────────────────────┐
         │  Vercel Serverless Functions     │
         ├──────────────────────────────────┤
         │  /api/transcribe                 │
         │  /api/score                      │
         └──────────────────────────────────┘
                            │
                            ↓
              ┌─────────────────────────┐
              │  OpenAI Whisper API     │
              │  (Transcription &       │
              │   Similarity Scoring)   │
              └─────────────────────────┘
```

### 1.2 Technology Stack

| Layer       | Technology                         | Version    | Purpose                                  |
|-------------|-----------------------------------|------------|------------------------------------------|
| **Frontend** | React                             | ^18.0      | UI framework                             |
|             | TypeScript                        | ^5.0       | Type safety                              |
|             | Next.js (optional)                | ^14.0      | Optional SSR & API routes                |
|             | Tailwind CSS / custom CSS         | -          | Styling with gradient/glitch effects     |
|             | WebAudio API                      | native     | Audio reversal & playback                |
|             | MediaRecorder API                 | native     | Microphone recording                     |
| **Backend** | Node.js / Vercel Functions        | ^18.0      | Serverless compute                       |
|             | OpenAI Whisper API                | latest     | Transcription & scoring                  |
|             | Axios / fetch                     | -          | HTTP client for API calls                |
| **Build**   | pnpm                              | ^8.0       | Package management                       |
|             | Vercel CLI                        | latest     | Local dev & deployment                   |
| **Versioning** | Conventional Commits + Semantic Release | - | Git workflow & version management       |

---

## 2. Frontend Architecture

### 2.1 Component Structure

```
src/
├── components/
│   ├── ScreenA_SayYourPhrase.tsx
│   ├── ScreenB_ListenBackwards.tsx
│   ├── ScreenC_TryToSayBackwards.tsx
│   ├── ScreenD_Results.tsx
│   ├── MicButton.tsx (press-and-hold, waveform)
│   ├── WaveformVisualizer.tsx (canvas-based)
│   ├── AudioPlayer.tsx (unified playback control)
│   └── Layout.tsx (screen wrapper)
├── hooks/
│   ├── useAudioRecording.ts
│   ├── useAudioReversal.ts
│   ├── useAudioPlayback.ts
│   └── useGameState.ts
├── context/
│   └── GameContext.ts (round state, recordings, results)
├── utils/
│   ├── audioProcessor.ts (WebAudio reversing)
│   ├── audioToBlob.ts (format conversion)
│   ├── transcriptionClient.ts (Whisper API calls)
│   ├── scoringClient.ts (Whisper-based similarity)
│   └── audioConstants.ts (sample rates, formats)
├── assets/
│   └── sfx/
│       └── recordScratch.mp3 (DJ scratch SFX)
├── pages/ (or app/ if using Next.js app router)
│   ├── index.tsx (main game)
│   └── api/
│       ├── transcribe.ts
│       └── score.ts
├── styles/
│   └── globals.css (gradients, glitchy theme)
├── types/
│   └── index.ts (TypeScript interfaces)
└── App.tsx

package.json
tsconfig.json
next.config.js (if using Next.js)
```

### 2.2 State Management Architecture

Use React Context API for global game state (no Redux needed for MVP scope).

```typescript
// GameContext structure
interface GameState {
  currentScreen: 'input' | 'listenBackwards' | 'tryBackwards' | 'results';
  
  // Round data
  originalRecording: AudioBuffer | null;
  mimicRecording: AudioBuffer | null;
  
  // Derived audio
  originalBackwardsBuffer: AudioBuffer | null;
  mimicForwardBuffer: AudioBuffer | null;
  
  // Transcriptions & scoring
  originalTranscription: string | null;
  mimicTranscription: string | null;
  score: number | null;
  
  // UI state
  isRecording: boolean;
  isPlayingAudio: boolean;
  recordingSFXPlayed: boolean;
}

interface GameContextValue {
  state: GameState;
  dispatch: (action: GameAction) => void;
  // Helper methods
  startRound: () => void;
  nextRound: () => void;
}
```

---

## 3. Audio Processing Pipeline

### 3.1 Recording Capture (MediaRecorder API)

**Flow:**
1. User presses mic button → `onMouseDown` / `onTouchStart`
2. Start MediaRecorder stream from `navigator.mediaDevices.getUserMedia()`
3. Collect `dataavailable` events into chunks array
4. User releases button → `onMouseUp` / `onTouchEnd`
5. Finalize and convert to AudioBuffer
6. Store in GameContext

**Implementation:**

```typescript
// Recording configuration
const RECORDING_CONFIG = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: false,
  },
};

const MEDIA_RECORDER_OPTIONS = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000,
};

async function startRecording(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia(RECORDING_CONFIG.audio);
  const recorder = new MediaRecorder(stream, MEDIA_RECORDER_OPTIONS);
  const chunks: Blob[] = [];
  
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.start();
  
  return new Promise((resolve) => {
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const buffer = await blobToAudioBuffer(blob);
      resolve();
    };
  });
}

async function blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  return await audioContext.decodeAudioData(arrayBuffer);
}
```

### 3.2 Audio Reversal (WebAudio API)

**Flow:**
1. Take AudioBuffer (either original or mimic)
2. Create new offline context with same sample rate
3. Reverse samples in-place
4. Render to new AudioBuffer
5. Store or play directly

**Implementation:**

```typescript
async function reverseAudioBuffer(buffer: AudioBuffer): Promise<AudioBuffer> {
  const audioContext = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );
  
  const reversed = audioContext.createBuffer(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );
  
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const originalData = buffer.getChannelData(channel);
    const reversedData = reversed.getChannelData(channel);
    
    for (let i = 0; i < originalData.length; i++) {
      reversedData[i] = originalData[originalData.length - 1 - i];
    }
  }
  
  return reversed;
}
```

### 3.3 Audio Playback

**Unified playback interface:**

```typescript
interface AudioClip {
  id: 'original-forward' | 'original-backwards' | 'mimic-backwards' | 'mimic-forward';
  buffer: AudioBuffer;
  label: string;
}

async function playAudioBuffer(buffer: AudioBuffer, onEnd?: () => void): Promise<void> {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  
  source.onended = () => {
    if (onEnd) onEnd();
  };
  
  source.start(0);
}
```

### 3.4 SFX Playback (Record Scratch)

**When to trigger:**
- After original recording finishes (before showing backwards playback)
- When mimic recording finishes (before showing results)
- Optionally when toggling audio directions in results screen

**Implementation:**

```typescript
const scratchSFX = new Audio('/sfx/recordScratch.mp3');
scratchSFX.volume = 0.7;

async function playScratchSFX(): Promise<void> {
  scratchSFX.currentTime = 0;
  await scratchSFX.play();
}
```

### 3.5 Waveform Visualizer

**Canvas-based, real-time during recording; optional for playback.**

**Implementation approach:**
- Use `AnalyserNode` from WebAudio API
- Get frequency data via `getByteFrequencyData()`
- Draw bars onto canvas each frame
- Style: low-fidelity, pixelated, retro CRT aesthetic

---

## 4. Transcription & Scoring

### 4.1 Whisper Integration

**Two separate API calls per round:**

1. **Transcribe Original Forward Recording**
   - Input: AudioBuffer (original forward)
   - Output: Text transcription (used for target phrase display)
   - Called: After step 1 (or lazily in step 5)

2. **Transcribe Mimic Forward Recording**
   - Input: AudioBuffer (mimic reversed back to forward)
   - Output: Text transcription (used for scoring)
   - Called: After step 3

3. **Score Similarity**
   - Input: Original transcription + Mimic transcription
   - Output: 0–100 score
   - Called: Before displaying results

### 4.2 Backend API Routes

**POST /api/transcribe**

```typescript
// Request
interface TranscribeRequest {
  audio: string; // base64-encoded audio blob
  format: 'webm' | 'wav'; // MIME type hint
}

// Response
interface TranscribeResponse {
  text: string;
  confidence?: number;
}

// Implementation
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { audio } = req.body;
  const audioBuffer = Buffer.from(audio, 'base64');
  
  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  });
  
  const data = await response.json();
  res.status(200).json({ text: data.text, confidence: data.confidence || 0 });
}
```

**POST /api/score**

```typescript
// Request
interface ScoreRequest {
  originalTranscription: string;
  mimicTranscription: string;
}

// Response
interface ScoreResponse {
  score: number; // 0–100
  details?: {
    tokenSimilarity: number;
    lengthDifference: number;
  };
}

// Implementation (Levenshtein-based similarity)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { originalTranscription, mimicTranscription } = req.body;
  
  const similarity = computeSimilarity(originalTranscription, mimicTranscription);
  const score = Math.round(similarity * 100);
  
  res.status(200).json({ score });
}

function computeSimilarity(original: string, mimic: string): number {
  const dist = levenshteinDistance(
    original.toLowerCase(),
    mimic.toLowerCase()
  );
  
  const maxLen = Math.max(original.length, mimic.length);
  if (maxLen === 0) return 1;
  
  return Math.max(0, 1 - (dist / maxLen));
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}
```

### 4.3 Frontend Transcription Client

```typescript
// Client wrapper for transcription API
async function transcribeAudio(buffer: AudioBuffer): Promise<string> {
  const blob = await audioBufferToBlob(buffer);
  const base64 = await blobToBase64(blob);
  
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio: base64,
      format: 'webm',
    }),
  });
  
  if (!response.ok) throw new Error('Transcription failed');
  
  const { text } = await response.json();
  return text;
}

async function scoreAttempt(
  originalText: string,
  mimicText: string
): Promise<number> {
  const response = await fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalTranscription: originalText,
      mimicTranscription: mimicText,
    }),
  });
  
  if (!response.ok) throw new Error('Scoring failed');
  
  const { score } = await response.json();
  return score;
}
```

---

## 5. Component Specifications

### 5.1 Screen A: "Say Your Phrase"

**File:** `components/ScreenA_SayYourPhrase.tsx`

**Props:** None (reads from GameContext)

**State:**
- `isRecording: boolean`
- `recordingTime: number`

**UI Elements:**
- Title text: "Think of a phrase and press and hold to say it"
- Central MicButton component
- Conditional waveform visualizer (shown only while recording)
- Optional: timer display

**Behavior:**
- On mic press → start recording + show waveform
- On mic release → finalize recording + play scratch SFX
- On scratch SFX end → transition to Screen B

### 5.2 Screen B: "Listen Backwards"

**File:** `components/ScreenB_ListenBackwards.tsx`

**Props:** None (reads from GameContext)

**State:**
- `isPlaying: boolean`

**UI Elements:**
- Title text: "Listen to the backwards version. The next player should learn this sound."
- "Play Original (Backwards)" button
- Helper text: "You can play this as many times as you want"
- "Ready to Try It" CTA button

**Behavior:**
- On play button → play reversed original audio
- Play button toggles enabled/disabled based on playback state
- Ready button → transition to Screen C

### 5.3 Screen C: "Try to Say It Backwards"

**File:** `components/ScreenC_TryToSayBackwards.tsx`

**Props:** None (reads from GameContext)

**State:**
- `isRecording: boolean`

**UI Elements:**
- Title text: "Now try to say what you heard, backwards"
- MicButton component
- Waveform visualizer (recording only)

**Behavior:**
- On mic press → start recording + show waveform
- On mic release → finalize + reverse + transcribe + score
- During transcription/scoring → show loading UI
- On completion → transition to Screen D

### 5.4 Screen D: "Results"

**File:** `components/ScreenD_Results.tsx`

**Props:** None (reads from GameContext)

**State:**
- `playingClip: string | null`

**UI Elements:**
- Target phrase text (from original transcription)
- Large score display: "Score: 73 / 100"
- Four playback buttons with labels:
  - "Play Original (Forward)"
  - "Play Original (Backwards)"
  - "Play Mimic (As Spoken Backwards)"
  - "Play Mimic (Forward Result)"
- "Next Round" button

**Behavior:**
- Audio buttons → play corresponding AudioBuffer
- Play scratch SFX when transitioning between forward/backwards clips (optional UX refinement)
- Next Round → reset GameContext + return to Screen A

### 5.5 MicButton Component

**File:** `components/MicButton.tsx`

**Props:**
```typescript
interface MicButtonProps {
  onPressStart: () => void;
  onPressEnd: () => void;
  isActive?: boolean;
}
```

**Behavior:**
- `mouseDown` / `touchStart` → call `onPressStart()`
- `mouseUp` / `touchEnd` → call `onPressEnd()`
- Visual feedback: pulsing border/glow while pressed
- Accessibility: proper ARIA labels

### 5.6 WaveformVisualizer Component

**File:** `components/WaveformVisualizer.tsx`

**Props:**
```typescript
interface WaveformVisualizerProps {
  analyser?: AnalyserNode; // Live frequency data during recording
  buffer?: AudioBuffer; // Static visualization for playback
  isActive: boolean; // Show/hide
}
```

**Implementation:**
- Canvas element with requestAnimationFrame loop
- Draw vertical bars for frequency bins (pixel art style)
- Color: retro neon or glitchy gradient

---

## 6. Data Flow Diagrams

### 6.1 Complete Round Flow

```
User Input
    ↓
[Screen A] ← originalRecording: AudioBuffer
    ↓ (mic release)
reverseAudioBuffer(originalRecording) → originalBackwardsBuffer
    ↓
playScratchSFX()
    ↓
[Screen B] → User hears originalBackwardsBuffer (looped playback)
    ↓ (Ready button)
[Screen C] ← mimicRecording: AudioBuffer (what user said backwards)
    ↓ (mic release)
reverseAudioBuffer(mimicRecording) → mimicForwardBuffer
    ↓
playScratchSFX()
    ↓
transcribeAudio(originalRecording) → originalTranscription
transcribeAudio(mimicForwardBuffer) → mimicTranscription
scoreAttempt(originalTranscription, mimicTranscription) → score: 0–100
    ↓
[Screen D] Display results with playback options
    ↓ (Next Round button)
Reset GameContext → back to [Screen A]
```

### 6.2 Audio Format Transformations

```
Microphone (PCM Stream)
    ↓ [MediaRecorder]
WebM/Opus Blob
    ↓ [decodeAudioData]
AudioBuffer (PCM samples in memory)
    ↓ [reverseAudioBuffer OR transcribeAudio]
    ├→ Reversed AudioBuffer (for playback)
    └→ Base64 (for API upload to Whisper)
```

---

## 7. Type Definitions

**File:** `types/index.ts`

```typescript
export type ScreenType = 'input' | 'listenBackwards' | 'tryBackwards' | 'results';

export type AudioClipId = 
  | 'original-forward' 
  | 'original-backwards' 
  | 'mimic-backwards' 
  | 'mimic-forward';

export interface AudioClip {
  id: AudioClipId;
  buffer: AudioBuffer;
  label: string;
}

export interface GameRoundState {
  // Raw recordings
  originalRecording: AudioBuffer | null;
  mimicRecording: AudioBuffer | null;
  
  // Processed audio
  originalBackwardsBuffer: AudioBuffer | null;
  mimicForwardBuffer: AudioBuffer | null;
  
  // Transcriptions
  originalTranscription: string | null;
  mimicTranscription: string | null;
  
  // Score
  score: number | null;
  
  // UI state
  currentScreen: ScreenType;
  isRecording: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface GameAction {
  type:
    | 'SET_SCREEN'
    | 'SET_ORIGINAL_RECORDING'
    | 'SET_MIMIC_RECORDING'
    | 'SET_ORIGINAL_BACKWARDS'
    | 'SET_MIMIC_FORWARD'
    | 'SET_ORIGINAL_TRANSCRIPTION'
    | 'SET_MIMIC_TRANSCRIPTION'
    | 'SET_SCORE'
    | 'SET_RECORDING'
    | 'SET_LOADING'
    | 'SET_ERROR'
    | 'RESET_ROUND';
  payload: any;
}

export interface TranscribeResponse {
  text: string;
  confidence?: number;
}

export interface ScoreResponse {
  score: number;
  details?: {
    tokenSimilarity: number;
    lengthDifference: number;
  };
}

export interface AudioProcessingError {
  code: string;
  message: string;
}
```

---

## 8. Error Handling & Edge Cases

### 8.1 Microphone Access

**Scenarios:**
1. User denies microphone permission → Show friendly error, offer retry
2. No microphone detected → Show error UI
3. Another app using microphone → Graceful degradation

**Implementation:**

```typescript
async function requestMicrophoneAccess(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        // User denied permission
        dispatch({ type: 'SET_ERROR', payload: 'Microphone permission denied' });
      } else if (error.name === 'NotFoundError') {
        // No microphone
        dispatch({ type: 'SET_ERROR', payload: 'No microphone found' });
      }
    }
    return false;
  }
}
```

### 8.2 Audio Processing Failures

**Scenarios:**
1. Audio blob too large or corrupted → API rejection
2. Whisper API timeout or rate limit → Retry logic
3. Audio buffer decoding fails → Show error

**Implementation:**

```typescript
const MAX_AUDIO_SIZE_MB = 25; // Whisper API limit

async function transcribeWithRetry(
  buffer: AudioBuffer,
  maxRetries = 3
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const text = await transcribeAudio(buffer);
      return text;
    } catch (error) {
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      } else {
        throw error;
      }
    }
  }
}
```

### 8.3 Network Issues

**Scenarios:**
1. User offline during transcription → Show error (but can still play audio locally)
2. API down → Retry or fallback to dummy score
3. Slow network → Loading indicator

**Strategy:**
- All audio recording & playback works offline (WebAudio API is local)
- Transcription & scoring require network (show loading state)
- Implement timeout and user-friendly error messages

---

## 9. Performance Considerations

### 9.1 Audio Buffer Memory Management

**Considerations:**
- AudioBuffer can be large (e.g., 30 seconds @ 48kHz = ~2.8MB per channel)
- Two buffers per round (original + mimic) + two reversed versions
- Keep only current round in memory; clear on "Next Round"

**Implementation:**

```typescript
function clearAudioBuffers(dispatch: Dispatch) {
  dispatch({ type: 'SET_ORIGINAL_RECORDING', payload: null });
  dispatch({ type: 'SET_MIMIC_RECORDING', payload: null });
  dispatch({ type: 'SET_ORIGINAL_BACKWARDS', payload: null });
  dispatch({ type: 'SET_MIMIC_FORWARD', payload: null });
}
```

### 9.2 Waveform Rendering

**Optimization:**
- Use requestAnimationFrame for smooth 60fps animation
- Downsample frequency data if canvas is small
- Debounce canvas redraws on resize

### 9.3 API Call Optimization

**Strategies:**
- Batch transcription calls if needed (not in MVP)
- Cache Whisper results in sessionStorage (optional)
- Lazy-load scratch SFX on first use

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Scope:**
- `levenshteinDistance()` function
- `audioBufferToBlob()` / `blobToAudioBuffer()` conversions
- Type validation functions

**Framework:** Vitest or Jest

### 10.2 Integration Tests

**Scope:**
- Transcription API responses
- Scoring algorithm with known inputs
- State management (GameContext)

### 10.3 E2E Tests

**Scope:** 
- Not required for MVP (manual testing sufficient)
- Can add Playwright/Cypress later for critical user flows

### 10.4 Manual Testing Checklist

```
[ ] Recording: Can press and hold to record
[ ] Recording: Waveform displays during capture
[ ] Recording: Stops on release
[ ] Reversal: Reversed audio sounds backwards
[ ] Playback: All four audio clips play correctly
[ ] Transcription: Whisper correctly transcribes phrases
[ ] Scoring: Score reflects phonetic similarity (0–100)
[ ] SFX: Scratch sound plays at transitions
[ ] Mobile: Touch events work on iPhone/Android
[ ] Mobile: Microphone permission prompt appears
[ ] Flow: Can complete full round and reset
```

---

## 11. Deployment & Infrastructure

### 11.1 Project Structure for Vercel

```
project/
├── public/
│   └── sfx/
│       └── recordScratch.mp3
├── src/
│   ├── pages/ (or app/)
│   │   ├── index.tsx
│   │   └── api/
│   │       ├── transcribe.ts
│   │       └── score.ts
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── styles/
├── package.json
├── tsconfig.json
├── next.config.js
├── .env.local (dev environment)
├── .env.production (prod environment)
└── vercel.json (optional deployment config)
```

### 11.2 Environment Variables

**Local (.env.local):**
```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_API_BASE=http://localhost:3000
```

**Production (.env.production):**
```
OPENAI_API_KEY=sk-... (set in Vercel dashboard)
NEXT_PUBLIC_API_BASE=https://reverso.vercel.app
```

### 11.3 Vercel Configuration

**vercel.json:**
```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "devCommand": "pnpm run dev",
  "env": {
    "OPENAI_API_KEY": "@openai_api_key"
  },
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

### 11.4 GitHub Actions (Optional CI/CD)

**Minimal workflow for semantic-release:**

```yaml
name: Release
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: pnpm
      - run: pnpm install
      - run: pnpm run build
      - uses: cycjimmy/semantic-release-action@v3
        with:
          semantic_version: 19
          branches: |
            [
              'main'
            ]
```

---

## 12. Security & Privacy

### 12.1 Data Handling

**In-Memory Only:**
- AudioBuffers are never persisted
- Transcription text is only held for the current round
- Scores are computed and immediately displayed

**Whisper API:**
- Audio sent to OpenAI as per their terms
- Recommend checking OpenAI data retention policy for compliance

**Client-Side:**
- No cookies or localStorage for sensitive data
- Session-only storage (sessionStorage) for non-sensitive state (optional)

### 12.2 HTTPS Enforcement

- Vercel enforces HTTPS automatically
- Microphone access requires secure context (HTTPS)
- All API calls are HTTPS

### 12.3 API Key Protection

- `OPENAI_API_KEY` stored in Vercel secrets (not in repo)
- Never expose in client-side code
- Serverless functions use backend environment variable only

---

## 13. Styling & Visual Identity

### 13.1 Design System

**Color Palette:**
- Primary: Neon purple/pink (#B300FF, #FF006E)
- Secondary: Lime green (#39FF14)
- Accent: Cyan (#00FFFF)
- Background: Dark blue/black with gradient (#0A0E27, #1a1a2e)

**Typography:**
- Font: Pixel art / retro monospace (e.g., Press Start 2P, VT323)
- Sizes: Large buttons (48px+), readable body text

**Visual Effects:**
- Gooey/slimy gradients using radial-gradient()
- Glitch effect via text-shadow + offset animation
- Pulsing mic button via @keyframes animation
- Pixelated waveform (low-resolution canvas)

### 13.2 Responsive Layout

**Mobile-first:**
- Base layout for 320px width
- Buttons: 48px min height (touch-friendly)
- Mic button: centered, 80px diameter
- Screen wrapper: max-width 100vw, padding 1rem

**Desktop (optional):**
- Center content in viewport
- Max-width 600px for content
- No significant layout changes needed

---

## 14. Development Workflow

### 14.1 Local Setup

```bash
git clone <repo>
cd reverso
pnpm install
pnpm run dev
# Open http://localhost:3000
```

### 14.2 Conventional Commits

**Examples:**
```
feat(audio): add waveform visualizer to recording screen
fix(transcribe): retry on Whisper timeout
chore(deps): upgrade react to 18.3
refactor(scoring): optimize levenshtein distance algorithm
```

### 14.3 Semantic Release

**Automated on push to main:**
- `feat:` commit → minor version bump (1.0.0 → 1.1.0)
- `fix:` commit → patch bump (1.0.0 → 1.0.1)
- Breaking changes in commit body → major bump (1.0.0 → 2.0.0)

**Commands:**
```bash
git add .
git commit -m "feat(scoring): implement phonetic similarity algorithm"
git push origin main
# Automatic semantic-release runs, tags version, deploys to Vercel
```

---

## 15. Known Limitations & Future Enhancements

### 15.1 MVP Limitations

- No persistence of past rounds
- Single-device pass-and-play only (no multiplayer networking)
- Scoring is text-based (not audio waveform-based)
- No user profiles or leaderboards
- Recording duration is unlimited (user-controlled via button press)

### 15.2 Future Enhancements (Post-MVP)

- Multi-player over WebRTC
- Preset phrase categories
- Daily challenges / leaderboards
- Audio analytics per player
- Phrase packs / custom phrase lists
- PWA offline support
- Social sharing (record & share rounds)

---

## 16. API Rate Limiting & Costs

### 16.1 Whisper API Costs

**Pricing:** $0.006 per minute of audio (as of Nov 2024)

**Per round:** ~2–3 API calls × ~10 seconds = ~$0.0001–0.0002 per round

**Estimation:** 1000 rounds/month ≈ $0.20 cost

### 16.2 Rate Limiting Strategy

- Whisper: Monitor usage; Vercel functions have built-in concurrency limits
- No rate limiting required for MVP (low usage expected)

---

## 17. Monitoring & Debugging

### 17.1 Client-Side Logging

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

export function log(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[Reverso] ${message}`, data);
  }
}

export function logError(message: string, error: Error) {
  console.error(`[Reverso Error] ${message}`, error);
}
```

### 17.2 Vercel Logs

- Check Vercel dashboard for function logs
- Monitor OpenAI API usage and errors

### 17.3 Error Tracking (Optional)

- Integrate Sentry for production error reporting
- Not required for MVP

---

## 18. Summary: Build Checklist

- [ ] Set up Next.js project with TypeScript
- [ ] Create GameContext + useReducer for state management
- [ ] Implement recording (MediaRecorder + WebAudio)
- [ ] Implement audio reversal (WebAudio reverse samples)
- [ ] Implement audio playback (HTMLAudioElement / WebAudio)
- [ ] Build UI components (Screens A–D)
- [ ] Create MicButton + WaveformVisualizer
- [ ] Add SFX (record scratch)
- [ ] Implement Whisper transcription API route
- [ ] Implement scoring API route + Levenshtein algorithm
- [ ] Integrate frontend with transcription & scoring
- [ ] Style with retro/glitchy aesthetic
- [ ] Mobile responsiveness testing
- [ ] Manual testing (full round flow)
- [ ] Set up Vercel deployment
- [ ] Set up GitHub + Semantic Release
- [ ] Deploy MVP to production

