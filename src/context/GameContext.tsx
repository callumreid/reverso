"use client";

import { createContext, useCallback, useMemo, useReducer } from "react";
import type {
  GameAction,
  GameContextValue,
  GameScreen,
  GameState,
} from "@/types/game";

const initialState: GameState = {
  currentScreen: "input",
  originalRecording: null,
  mimicRecording: null,
  originalBackwardsBuffer: null,
  mimicForwardBuffer: null,
  originalTranscription: null,
  mimicTranscription: null,
  score: null,
  isRecording: false,
  isPlayingAudio: false,
  recordingSFXPlayed: false,
  recordingMeta: {},
  microphonePermission: "prompt",
  lastError: null,
  isProcessingRound: false,
  statusMessage: null,
};

const reducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "SET_SCREEN":
      return { ...state, currentScreen: action.payload };
    case "SET_STATE":
      return { ...state, ...action.payload };
    case "RESET_ROUND":
      return {
        ...initialState,
        microphonePermission: state.microphonePermission,
      };
    default:
      return state;
  }
};

const GameContext = createContext<GameContextValue | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
}

/**
 * Supplies global state for the round-based Reverso gameplay loop.
 */
export function GameProvider({ children }: ProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startRound = useCallback(() => {
    dispatch({ type: "RESET_ROUND" });
    dispatch({ type: "SET_SCREEN", payload: "input" });
  }, []);

  const nextRound = useCallback(() => {
    dispatch({ type: "RESET_ROUND" });
  }, []);

  const goToScreen = useCallback((screen: GameScreen) => {
    dispatch({ type: "SET_SCREEN", payload: screen });
  }, []);

  const setError = useCallback((message: string | null) => {
    dispatch({ type: "SET_STATE", payload: { lastError: message } });
  }, []);

  const value = useMemo<GameContextValue>(() => {
    return {
      state,
      dispatch,
      startRound,
      nextRound,
      goToScreen,
      setError,
    };
  }, [goToScreen, nextRound, setError, state, startRound]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export default GameContext;
