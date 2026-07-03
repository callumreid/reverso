# Agent Handoff

## Current State (2026-07-02 polish pass)
- Next.js 16 + App Router, TypeScript, Tailwind 4, framer-motion, pnpm.
- Full gameplay loop works end-to-end: record → reverse → listen → mimic → flip forward → Whisper transcription of both sides → Levenshtein score → animated results (ScoreDial, transcript diff, clip playback, share).
- Transcription/scoring runs in the background via `useRoundScoring` (starts as soon as each recording lands; `roundNonce` guard in the reducer drops stale async results).
- Recording picks a supported MediaRecorder mimeType at runtime (iOS Safari safe), guards reentrancy, stops cleanly on hide, rejects sub-400ms takes with a friendly message, and auto-stops at 10s.
- The old `public/sfx/record-scratch.mp3` was a corrupt HTML download that made `audio.play()` pend forever and soft-locked the round ("reversing…" forever). Replaced with a synthesized `record-scratch.wav`; `useScratchSfx.play()` now has a 2.5s failsafe and gameplay never awaits it.
- `/api/transcribe` is hardened: origin allowlist (reverso.lol, *.vercel.app, localhost), 3M-char base64 cap, 15 req/min per-IP per-instance rate limit, 40s upstream timeout, no error-body passthrough. `/api/score` normalizes punctuation/whitespace, caps input at 2k chars, returns 0 for empty transcripts.
- SEO/shareability: full metadata + OG/Twitter cards, generated `opengraph-image`/`icon`/`apple-icon` (ImageResponse), `manifest.ts`, `robots.ts`, `sitemap.ts`, JSON-LD VideoGame schema, crawlable how-to-play section on the page.
- Error boundary at `src/app/error.tsx`; viewport/themeColor/safe-area/dvh handled.

## Environment & Commands
- Install: `pnpm install`
- Dev server: `pnpm dev` (kills ports 3000/5173 first — use `pnpm exec next dev -p <port>` to avoid that)
- Lint: `pnpm lint` | Build: `pnpm build`
- Env: copy `.env.example` to `.env.local`, set `OPENAI_API_KEY`.

## Deployment
- Vercel, GitHub integration on `main` (`git@github.com:callumreid/reverso.git`), domain reverso.lol.
- **`OPENAI_API_KEY` must be set in Vercel Production env** — as of 2026-07-02 it was MISSING in prod (endpoint returned "Missing OpenAI API key"), so scoring has never worked live. The UI degrades gracefully ("Scoring is offline") until it's set.

## Open Work / Next Steps
1. Real-device smoke test (iOS Safari + Android Chrome): record, playback, full round, add-to-home-screen.
2. Rate limiting is per-lambda best-effort; for real abuse protection add Upstash/Vercel KV.
3. Consider round history / streaks across rounds (roundNumber already tracked).
4. Analytics funnel events (record started, round completed, share tapped) via @vercel/analytics `track`.

## Notes for Next Agent
- Media APIs require HTTPS + user gesture; recording auto-bails if the page is hidden when the mic resolves.
- Screen transitions use AnimatePresence keyed on `roundNonce-currentScreen`.
- No inline comments unless JSDoc per owner's directive.
