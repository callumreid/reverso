"use client";

import { useCallback, useEffect, useState } from "react";
import { MicButton } from "@/components/MicButton";
import { ScreenFrame } from "@/components/ScreenFrame";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useAudioReversal } from "@/hooks/useAudioReversal";
import { useGameContext } from "@/hooks/useGameContext";
import { useScratchSfx } from "@/hooks/useScratchSfx";
import { useWaveformAnalyzer } from "@/hooks/useWaveformAnalyzer";
import { useSpacebarToggle } from "@/hooks/useSpacebarToggle";
import { scoreAttempt, transcribeAudioBuffer } from "@/utils/apiClients";
import { formatDuration } from "@/utils/formatDuration";

export function ScreenC() {
  const { state, dispatch, goToScreen, setError } = useGameContext();
  const { waveform, attach, detach, isActive } = useWaveformAnalyzer();
  const { reverse } = useAudioReversal();
  const { play: playScratch } = useScratchSfx();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleProcessing = useCallback(
    async (mimicForward: AudioBuffer, metadata: { durationMs: number; createdAt: number }) => {
      try {
        dispatch({ type: "SET_STATE", payload: { isProcessingRound: true, statusMessage: "Scoring your attempt..." } });
        let originalText = state.originalTranscription;
        if (!originalText && state.originalRecording) {
          setStatusMessage("Transcribing the original phrase...");
          originalText = await transcribeAudioBuffer(state.originalRecording);
          dispatch({ type: "SET_STATE", payload: { originalTranscription: originalText } });
        }
        setStatusMessage("Transcribing your attempt...");
        const mimicText = await transcribeAudioBuffer(mimicForward);
        dispatch({ type: "SET_STATE", payload: { mimicTranscription: mimicText } });
        setStatusMessage("Calculating similarity score...");
        const score = await scoreAttempt(originalText ?? "", mimicText);
        dispatch({
          type: "SET_STATE",
          payload: {
            score,
            isProcessingRound: false,
            statusMessage: null,
            recordingMeta: {
              ...state.recordingMeta,
              mimic: {
                createdAt: metadata.createdAt,
                durationMs: metadata.durationMs,
                source: "mimic",
              },
            },
          },
        });
        goToScreen("results");
      } catch (flowError) {
        const message = flowError instanceof Error ? flowError.message : "Something went wrong while scoring.";
        dispatch({ type: "SET_STATE", payload: { isProcessingRound: false, statusMessage: null } });
        setError(message);
      } finally {
        setStatusMessage(null);
      }
    },
    [dispatch, goToScreen, setError, state.originalRecording, state.originalTranscription, state.recordingMeta],
  );

  const handleRecordingReady = useCallback(
    async (result: { audioBuffer: AudioBuffer; durationMs: number; createdAt: number }) => {
      try {
        const mimicForward = await reverse(result.audioBuffer);
        dispatch({
          type: "SET_STATE",
          payload: {
            mimicRecording: result.audioBuffer,
            mimicForwardBuffer: mimicForward,
            lastError: null,
          },
        });
        await playScratch();
        await handleProcessing(mimicForward, {
          durationMs: result.durationMs,
          createdAt: result.createdAt,
        });
      } catch (flowError) {
        const message = flowError instanceof Error ? flowError.message : "Unable to process your attempt.";
        setError(message);
      }
    },
    [dispatch, handleProcessing, playScratch, reverse, setError],
  );

  const {
    status,
    error,
    durationMs,
    permission,
    supportsRecording,
    requestPermission,
    startRecording,
    stopRecording,
  } = useAudioRecording({
    onRecordingReady: handleRecordingReady,
    onStreamAvailable: (stream) => {
      if (stream) {
        void attach(stream);
      } else {
        detach();
      }
    },
  });

  useEffect(() => {
    dispatch({
      type: "SET_STATE",
      payload: {
        isRecording: status === "recording",
        microphonePermission: permission,
      },
    });
  }, [dispatch, permission, status]);

  useEffect(() => {
    if (error) {
      setError(error);
    }
  }, [error, setError]);

  const handleToggleRecording = useCallback(() => {
    if (status === "recording") {
      void stopRecording();
      return;
    }
    if (permission === "denied") {
      void requestPermission();
      return;
    }
    void startRecording();
  }, [permission, requestPermission, startRecording, status, stopRecording]);

  const recordingSupported = supportsRecording !== false;
  const disabled =
    !recordingSupported ||
    status === "requesting" ||
    status === "stopping" ||
    state.isProcessingRound;

  useSpacebarToggle(handleToggleRecording, !disabled);

  return (
    <ScreenFrame
      title="Try to say it backwards"
      subtitle="Tap once (or press space) to start mimicking, then tap again to finish."
      footer={
        <div className="space-y-2 text-center">
          <p className="text-sm text-[#d6bcfa]">
            Recording length: {formatDuration(durationMs)} · Permission: {permission}
          </p>
          {state.isProcessingRound ? (
            <p className="text-sm text-[#fffb96]">
              {statusMessage ?? state.statusMessage ?? "Processing..."}
            </p>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6">
        <MicButton
          label={status === "recording" ? "Tap to stop" : "Tap to start"}
          onClick={handleToggleRecording}
          isActive={status === "recording"}
          disabled={disabled}
        />
        <WaveformVisualizer samples={waveform} isActive={isActive && status === "recording"} />
        <p className="text-center text-base text-[#f8f7ff]">
          Speak confidently; articulation matters less than matching the rhythm.
        </p>
      </div>
    </ScreenFrame>
  );
}
