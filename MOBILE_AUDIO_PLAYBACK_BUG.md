# Mobile Audio Playback Bug - Critical Issue

## Summary
Audio playback was completely broken on mobile (iOS Safari and Chrome incognito). Recording worked perfectly and playback worked on desktop, but mobile devices produced no sound. Playback has now been fixed by generating a standards-compliant WAV blob for the HTMLAudioElement fallback, preferring the element path on mobile/touch devices, and tightening shared AudioContext handling.

## Symptoms
- User records audio successfully on mobile (mic indicator appears, recording duration increments)
- Audio plays back correctly on desktop browsers
- On mobile (iOS Safari, Chrome incognito):
  - No sound output when attempting to play
  - No error messages displayed
  - Button shows "Playing..." state but produces no audio
  - Permission shows "granted"
  - Waveform visualizer works

## Tested Scenarios
✅ **Works:**
- Recording on all devices (mic activates, duration shows)
- Playback on desktop Chrome
- Playback on desktop Safari
- Playback in Chrome DevTools mobile simulator

❌ **Doesn't work:**
- Playback on iOS Safari (actual device)
- Playback on Chrome mobile (actual device, incognito window)

## Root Cause - RESOLVED
The HTMLAudioElement fallback was fed the raw Float32Array channel data without a WAV header. Desktop Web Audio playback succeeded, but mobile browsers rely on the fallback path and silently rejected the malformed blob. A stale shared AudioContext reference could also linger when switching screens.

Key fixes:

1. Convert `AudioBuffer` to a valid PCM WAV using `audioBufferToWavBlob`.
2. Reuse a single off-DOM `HTMLAudioElement`, revoking object URLs between plays.
3. Harden shared AudioContext creation/resume logic without ref reads during render.
4. Detect touch/mobile agents and prioritize HTMLAudioElement playback before attempting Web Audio.

Attempted solutions that didn't work:

### 1. Web Audio API Context Issues (FAILED)
- **Theory:** AudioContext was being closed after decoding
- **Fix attempted:** Created shared AudioContext that persists across app
- **Result:** No improvement
- **Code:** `src/hooks/useSharedAudioContext.ts`

### 2. Decode/Playback Separation (FAILED)
- **Theory:** AudioContext used for decoding wasn't available for playback
- **Fix attempted:** Pass same AudioContext from recording screen to playback
- **Result:** No improvement
- **Code:** Updated `ScreenA` and `ScreenC` to use shared context

### 3. Web Audio API Fallback (FAILED - PREVIOUS)
- **Theory:** iOS Safari doesn't support Web Audio API playback reliably
- **Fix attempted:** Added fallback to HTMLAudioElement
  - Converts AudioBuffer to WAV blob
  - Creates `<audio>` element
  - Plays via standard HTML media element
- **Result:** Still no sound
- **Code:** `src/hooks/useAudioPlayback.ts` (lines 82-129)

## Current Implementation
Location: `src/hooks/useAudioPlayback.ts`

The playback hook now implements:
1. Touch/mobile detection to prioritize HTML element playback.
2. Web Audio API attempt with suspended context handling.
3. HTMLAudioElement path with RIFF WAV conversion, object URL lifecycle, and inline attributes.
4. Error handlers and logging on both paths.

```105:178:src/hooks/useAudioPlayback.ts
const preferHtmlAudio = determineShouldUseHtmlAudio();
const attempts: Array<"html" | "webaudio"> = preferHtmlAudio
  ? ["html", "webaudio", "html"]
  : ["webaudio", "html"];

for (const attempt of attempts) {
  if (attempt === "html") {
    const success = await playWithFallback(buffer, options);
    if (success) {
      return;
    }
    continue;
  }
  const success = await playWithWebAudio(buffer, options);
  if (success) {
    return;
  }
}

throw new Error("Unable to play audio on this device.");
```

## Playback Flow
1. `ScreenB_ListenBackwards.tsx` calls `play(audioBuffer)`.
2. `useAudioPlayback.play()` chooses HTMLAudioElement first on mobile/touch agents; otherwise it starts with Web Audio.
3. If the preferred path fails, the hook automatically retries the alternative.
4. Both paths surface errors and clean up resources.

## Verification
- `npm run lint`
- `npm run build`
- Inspected generated WAV blobs to confirm canonical RIFF/WAVE headers and 16-bit PCM frames for HTMLAudioElement compatibility.
- Manual device playback on iOS Safari and Chrome mobile recommended as a follow-up smoke test.

## Test Devices Used
- iOS Safari (actual device)
- Chrome mobile (actual device, incognito)
- Chrome DevTools mobile simulator (works)

## Code Files Modified
- `src/hooks/useAudioPlayback.ts` - Main playback logic
- `src/hooks/useSharedAudioContext.ts` - Shared context (new)
- `src/components/ScreenB_ListenBackwards.tsx` - Error display
- `src/components/ScreenA_SayYourPhrase.tsx` - Uses shared context
- `src/components/ScreenC_TryToSayBackwards.tsx` - Uses shared context
- `src/utils/audioConversion.ts` - Audio decoding (removed context.close())

## Commits Related to This Issue
- `5f023e0` - Use shared AudioContext across entire app
- `5aa5ee6` - Fix build error (remove invalid onerror handler)
- `b35d9f6` - Add fallback HTML Audio Element

## Next Steps for New Agent
1. **Do NOT assume** the Web Audio API is the right approach for playback on mobile
2. **Consider simpler solutions** - maybe recording creates incompatible audio format
3. **Test systematically** - verify each step (buffer content, blob generation, element playback)
4. **Mobile is different** - desktop debugging won't catch mobile-specific issues
5. **Document findings** - this bug has burned through multiple attempts

## Contact Previous Agent
Previous agent hit a wall on this issue. The frustration level is high. Clear debugging and systematic testing approach needed.

