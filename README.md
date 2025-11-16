# Reverso

Reverso is a retro-styled, pass-and-play party game where players record phrases, listen to them backwards, and try to mimic what they heard. The reversed attempt is transcribed with OpenAI Whisper, compared against the original transcription, and scored from 0–100.

## Features
- Press-and-hold microphone capture with live waveform visuals
- Automatic reversal of recordings plus scratch SFX transitions between phases
- Guided flow across four screens: Say Phrase → Listen Backwards → Try Backwards → Results
- Whisper transcription + Levenshtein scoring, surfaced with clip-by-clip playback controls
- Built with Next.js App Router, TypeScript, Tailwind, and Web Audio APIs

## Technical Design Reference
- Full spec: [`docs/TECHNICAL_DESIGN.md`](docs/TECHNICAL_DESIGN.md)
- Phase plans + progress logs: [`docs/`](docs)

## Getting Started
1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`
3. Start the dev server: `pnpm dev`
4. Visit `http://localhost:3000`

## Environment Variables
| Name | Description |
| --- | --- |
| `OPENAI_API_KEY` | Required for `/api/transcribe` to proxy Whisper requests |

## Scripts
| Script | Description |
| --- | --- |
| `pnpm dev` | Run Next.js in development mode |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint over the codebase |

## Project Structure
```
src/
├── app/                # Next.js App Router entry + API routes
├── assets/             # Static audio/media placements
├── components/         # Shared UI + screen components
├── context/            # Game context + provider
├── hooks/              # Audio + game-specific hooks
├── types/              # Shared TypeScript types
├── utils/              # Audio helpers, API clients, formatting
└── styles/             # Theme extensions and global CSS
```

## Deployment
The app targets Vercel. Configure the project in the Vercel dashboard, add `OPENAI_API_KEY` to the Production environment, and deploy the `main` branch. The default build command (`pnpm run build`) and output directory (`.next`) work out of the box.
