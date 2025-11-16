# Phase 4 – Backend APIs & Integration

## Objectives
- Implement `/api/transcribe` and `/api/score` serverless routes per design
- Connect frontend clients to Whisper and scoring endpoints with retries
- Ensure audio encoding, payload limits, and secure env handling are respected

## Tasks
1. Create Next.js API routes with OpenAI Whisper integration and Levenshtein scoring
2. Add utility functions for similarity scoring and transcription retries
3. Build frontend API clients, managing loading/error states in context
4. Validate large audio handling, timeouts, and exponential backoff logic
5. Secure `.env` usage, Vercel config, and document setup
6. End-to-end test Screen C/D pipeline with mock + live calls (if possible)

## Deliverables
- Functioning API routes with tests/mocks
- Frontend integration triggering transcription + score flow
- Documentation covering env setup and API usage limits
