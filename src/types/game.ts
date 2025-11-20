import type { Dispatch } from "react";

export type GameScreen = "input" | "listenBackwards" | "tryBackwards" | "results";

export interface RecordingMetadata {
  createdAt: number;
  durationMs: number;
  source: "original" | "mimic";
}

export interface GameState {
  currentScreen: GameScreen;
  roundNumber: number;
  originalRecording: AudioBuffer | null;
  mimicRecording: AudioBuffer | null;
  originalBackwardsBuffer: AudioBuffer | null;
  mimicForwardBuffer: AudioBuffer | null;
  originalTranscription: string | null;
  mimicTranscription: string | null;
  score: number | null;
  isRecording: boolean;
  isPlayingAudio: boolean;
  recordingSFXPlayed: boolean;
  recordingMeta: {
    original?: RecordingMetadata;
    mimic?: RecordingMetadata;
  };
  microphonePermission: PermissionState;
  lastError: string | null;
  isProcessingRound: boolean;
  statusMessage: string | null;
}

export type GameAction =
  | { type: "SET_SCREEN"; payload: GameScreen }
  | { type: "SET_STATE"; payload: Partial<GameState> }
  | { type: "RESET_ROUND" }
  | { type: "NEXT_ROUND" };

export interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  startRound: () => void;
  nextRound: () => void;
  goToScreen: (screen: GameScreen) => void;
  setError: (message: string | null) => void;
}
