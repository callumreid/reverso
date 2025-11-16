export const RECORDING_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: false,
    sampleRate: 44100,
    channelCount: 1,
  },
};

export const MEDIA_RECORDER_OPTIONS: MediaRecorderOptions = {
  mimeType: "audio/webm;codecs=opus",
  audioBitsPerSecond: 128_000,
};

export const DEFAULT_SAMPLE_RATE = 44_100;
export const SCRATCH_SFX_PATH = "/sfx/record-scratch.mp3";
export const MAX_RECORDING_DURATION_MS = 10_000;
