"use client";

import { useEffect, useRef } from "react";
import { useGameContext } from "@/hooks/useGameContext";
import { scoreAttempt, transcribeAudioBuffer } from "@/utils/apiClients";
import { logError } from "@/utils/logger";

/**
 * Drives the async transcribe-then-score pipeline for the current round.
 * Each recording is transcribed as soon as it exists so the results screen
 * usually has a score waiting. Two staleness guards protect the state: the
 * roundNonce check in the reducer drops responses from a previous round, and
 * the identity checks here drop responses for a take (or transcript pair)
 * that was replaced while the request was in flight.
 */
export function useRoundScoring() {
  const { state, dispatch } = useGameContext();
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    const buffer = state.originalRecording;
    if (!buffer || state.originalTranscriptionStatus !== "idle") {
      return;
    }
    const nonce = state.roundNonce;
    dispatch({
      type: "SET_ROUND_STATE",
      nonce,
      payload: { originalTranscriptionStatus: "pending" },
    });
    transcribeAudioBuffer(buffer)
      .then((text) => {
        if (stateRef.current.originalRecording !== buffer) {
          return;
        }
        dispatch({
          type: "SET_ROUND_STATE",
          nonce,
          payload: { originalTranscription: text, originalTranscriptionStatus: "done" },
        });
      })
      .catch((transcribeError) => {
        logError("Original transcription failed", transcribeError);
        if (stateRef.current.originalRecording !== buffer) {
          return;
        }
        dispatch({
          type: "SET_ROUND_STATE",
          nonce,
          payload: { originalTranscriptionStatus: "error" },
        });
      });
  }, [dispatch, state.originalRecording, state.originalTranscriptionStatus, state.roundNonce]);

  useEffect(() => {
    const buffer = state.mimicForwardBuffer;
    if (!buffer || state.mimicTranscriptionStatus !== "idle") {
      return;
    }
    const nonce = state.roundNonce;
    dispatch({
      type: "SET_ROUND_STATE",
      nonce,
      payload: { mimicTranscriptionStatus: "pending" },
    });
    transcribeAudioBuffer(buffer)
      .then((text) => {
        if (stateRef.current.mimicForwardBuffer !== buffer) {
          return;
        }
        dispatch({
          type: "SET_ROUND_STATE",
          nonce,
          payload: { mimicTranscription: text, mimicTranscriptionStatus: "done" },
        });
      })
      .catch((transcribeError) => {
        logError("Mimic transcription failed", transcribeError);
        if (stateRef.current.mimicForwardBuffer !== buffer) {
          return;
        }
        dispatch({
          type: "SET_ROUND_STATE",
          nonce,
          payload: { mimicTranscriptionStatus: "error" },
        });
      });
  }, [dispatch, state.mimicForwardBuffer, state.mimicTranscriptionStatus, state.roundNonce]);

  useEffect(() => {
    if (state.scoreStatus !== "idle") {
      return;
    }
    if (
      state.originalTranscriptionStatus !== "done" ||
      state.mimicTranscriptionStatus !== "done"
    ) {
      return;
    }
    const nonce = state.roundNonce;
    const original = state.originalTranscription ?? "";
    const mimic = state.mimicTranscription ?? "";
    const isStale = () =>
      (stateRef.current.originalTranscription ?? "") !== original ||
      (stateRef.current.mimicTranscription ?? "") !== mimic;
    dispatch({ type: "SET_ROUND_STATE", nonce, payload: { scoreStatus: "pending" } });
    scoreAttempt(original, mimic)
      .then((score) => {
        if (isStale()) {
          return;
        }
        dispatch({
          type: "SET_ROUND_STATE",
          nonce,
          payload: { score, scoreStatus: "done" },
        });
      })
      .catch((scoreError) => {
        logError("Scoring failed", scoreError);
        if (isStale()) {
          return;
        }
        dispatch({ type: "SET_ROUND_STATE", nonce, payload: { scoreStatus: "error" } });
      });
  }, [
    dispatch,
    state.mimicTranscription,
    state.mimicTranscriptionStatus,
    state.originalTranscription,
    state.originalTranscriptionStatus,
    state.roundNonce,
    state.scoreStatus,
  ]);
}
