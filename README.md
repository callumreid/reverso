# Reverso

Reverso is a mobile-first, pass-and-play party game where players record phrases, listen to them backwards, and try to mimic what they heard. The MVP focuses on:
- Rapid local gameplay with four core screens (Say Phrase → Listen Backwards → Try Backwards → Results)
- Audio capture, reversal, playback, and scoring powered by WebAudio + OpenAI Whisper
- Retro/glitch aesthetic with responsive UI optimized for touch interactions

## Technical Design Reference
- Full specification: [`docs/TECHNICAL_DESIGN.md`](docs/TECHNICAL_DESIGN.md)
- Implementation roadmap: see the per-phase plans in [`docs/`](docs)

## Getting Started
1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`
3. Run the dev server: `pnpm dev`
4. Visit `http://localhost:3000`

## Scripts
- `pnpm dev` – Next.js dev server
- `pnpm build` – Production build
- `pnpm start` – Start production server (after build)
- `pnpm lint` – ESLint

## Project Structure
```
src/
├── app/            # Next.js App Router entry
├── assets/         # Static audio + media
├── components/     # Shared UI components
├── context/        # Game context + providers
├── hooks/          # Audio + game hooks
├── styles/         # Global styles/theme assets
├── types/          # Shared TypeScript types
└── utils/          # Audio + API utilities
```

Additional design notes, scope decisions, and future phases live in the [`docs/`](docs) directory.
