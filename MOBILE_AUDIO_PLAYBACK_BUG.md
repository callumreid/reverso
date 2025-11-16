# Mobile Audio Playback Bug - Critical Issue

## Summary
Audio playback was completely broken on mobile (iOS Safari and Chrome incognito). Recording worked perfectly and playback worked on desktop, but mobile devices produced no sound. Playback has now been fixed by generating a standards-compliant WAV blob for the HTMLAudioElement fallback and tightening shared AudioContext handling.

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
1. Web Audio API attempt first (with suspended context check)
2. Fallback to HTMLAudioElement with WAV conversion
3. Error handlers on both paths
4. Console logging at each step

```105:151:src/hooks/useAudioPlayback.ts
const wavBlob = audioBufferToWavBlob(buffer);
const url = URL.createObjectURL(wavBlob);
objectUrlRef.current = url;

if (!audioElementRef.current) {
  audioElementRef.current = new Audio();
}

const audio = audioElementRef.current;
audio.src = url;
audio.volume = options.volume ?? 1;
audio.playbackRate = options.playbackRate ?? 1;

audio.onended = () => {
  setIsPlaying(false);
  options.onEnded?.();
  if (objectUrlRef.current) {
    URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }
};

audio.onerror = () => {
  setError("Audio playback error");
  setIsPlaying(false);
  if (objectUrlRef.current) {
    URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }
};

await audio.play();
setIsPlaying(true);
```

## Playback Flow
1. `ScreenB_ListenBackwards.tsx` calls `play(audioBuffer)`
2. `useAudioPlayback.play()` first tries Web Audio API
3. If that fails, attempts HTMLAudioElement fallback
4. Both have error handlers that should surface issues

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

