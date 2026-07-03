export const RECORDING_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: false,
    sampleRate: 44100,
    channelCount: 1,
  },
};

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

/**
 * Picks recorder options the current browser actually supports. iOS Safari
 * throws on unsupported mimeTypes, so an empty options object (browser
 * default) is the fallback rather than a hardcoded codec.
 */
export function pickMediaRecorderOptions(): MediaRecorderOptions {
  if (
    typeof MediaRecorder === "undefined" ||
    typeof MediaRecorder.isTypeSupported !== "function"
  ) {
    return {};
  }
  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return { mimeType, audioBitsPerSecond: 128_000 };
    }
  }
  return {};
}

export const DEFAULT_SAMPLE_RATE = 44_100;
export const SCRATCH_SFX_PATH = "/sfx/record-scratch.wav";
export const MAX_RECORDING_DURATION_MS = 10_000;
