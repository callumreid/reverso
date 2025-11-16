# Phase 2 – Core State & Audio Utilities

## Objectives
- Implement `GameContext`, reducer, and TypeScript types for round management
- Build reusable audio hooks/utilities for recording, reversing, playback, conversions, and scratch SFX
- Handle microphone permission flows, error states, and logging helpers

## Tasks
1. Define types in `types/index.ts` and reducer actions per design
2. Create `GameContext` provider with `useReducer`, helper methods, and tests
3. Implement `useAudioRecording`, `useAudioReversal`, `useAudioPlayback` hooks
4. Create utility helpers for blob/buffer conversions and base64 encoding
5. Add scratch SFX loader and waveform analyser setup
6. Wire error + permission handling, expose user-friendly messages

## Deliverables
- Context provider exporting state/actions with unit coverage
- Audio utility suite validated in isolation
- Documented error handling strategy and logging helpers
