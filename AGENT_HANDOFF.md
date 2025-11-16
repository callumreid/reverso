# Agent Handoff

## Current State
- Next.js 16 + App Router project scaffolded with TypeScript, Tailwind, and pnpm.
- Game flow implemented across Screens A–D with context-driven state, audio hooks, and retro styling.
- Mic button now toggles recording with clicks/spacebar; hydration mismatch resolved by lazy capability checks.
- Whisper proxy (`/api/transcribe`) and scoring endpoint (`/api/score`) live; frontend clients wrap them with timeout handling.
- README and per-phase progress docs updated through Phase 5; deployment target is Vercel (`reverso-6xvl19jfc-house-boat-studios.vercel.app`, currently SSO-protected).

## Environment & Commands
- Install: `pnpm install`
- Dev server: `pnpm dev`
- Lint: `pnpm lint`
- Build: `pnpm build`
- Deploy: `npx vercel deploy --prod`

## Open Work / Next Steps
1. **UI polish:** add transition animations between screens and enhance MicButton visual feedback for its toggled state.
2. **Accessibility:** audit focus order and ARIA hints on Screen D playback buttons + MicButton instructions.
3. **Testing:** add unit tests for audio utilities/hooks and smoke tests for API routes.
4. **Deployment hardening:** configure public alias or adjust Vercel SSO so external testers can reach production without logging in.
5. **Future features:** consider caching transcriptions to cut duplicate Whisper calls if rounds repeat.

## Notes for Next Agent
- Avoid `window` access during initial render; prefer effect-based detection (pattern shown in `useAudioRecording`).
- Media APIs require HTTPS + user gesture; keep toggled recording interactions aligned with spec (tap to start/stop, spacebar shortcut).
- No inline comments unless JSDoc per owner’s directive.
