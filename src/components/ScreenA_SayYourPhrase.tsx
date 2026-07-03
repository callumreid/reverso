"use client";

import { useCallback, useEffect, useMemo } from "react";
import { MicButton } from "@/components/MicButton";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenFrame } from "@/components/ScreenFrame";
import { WaveformConsole } from "@/components/WaveformConsole";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useAudioReversal } from "@/hooks/useAudioReversal";
import { useGameContext } from "@/hooks/useGameContext";
import { useScratchSfx } from "@/hooks/useScratchSfx";
import { useWaveformAnalyzer } from "@/hooks/useWaveformAnalyzer";
import { useSpacebarToggle } from "@/hooks/useSpacebarToggle";
import { useSharedAudioContext } from "@/hooks/useSharedAudioContext";
import { formatDuration } from "@/utils/formatDuration";

export function ScreenA() {
  const { state, dispatch, goToScreen, setError } = useGameContext();
  const { waveform, attach, detach, isActive } = useWaveformAnalyzer();
  const { reverse } = useAudioReversal();
  const { play: playScratch } = useScratchSfx();
  const audioContext = useSharedAudioContext();

  const handleRecordingReady = useCallback(
    async (result: { audioBuffer: AudioBuffer; durationMs: number; createdAt: number }) => {
      dispatch({ type: "SET_STATE", payload: { isProcessingRound: true } });
      try {
        const reversed = await reverse(result.audioBuffer);
        dispatch({
          type: "SET_STATE",
          payload: {
            originalRecording: result.audioBuffer,
            originalBackwardsBuffer: reversed,
            originalTranscription: null,
            originalTranscriptionStatus: "idle",
            score: null,
            scoreStatus: "idle",
            recordingMeta: {
              original: {
                createdAt: result.createdAt,
                durationMs: result.durationMs,
                source: "original",
              },
            },
            lastError: null,
          },
        });
        void playScratch();
      } catch (flowError) {
        const message = flowError instanceof Error ? flowError.message : "Unable to process recording.";
        setError(message);
      } finally {
        dispatch({ type: "SET_STATE", payload: { isProcessingRound: false } });
      }
    },
    [dispatch, playScratch, reverse, setError],
  );

  const handleStreamAvailable = useCallback(
    (stream: MediaStream | null) => {
      if (stream) {
        void attach(stream);
      } else {
        detach();
      }
    },
    [attach, detach],
  );

  const audioRecordingOptions = useMemo(
    () => ({
      audioContext: audioContext ?? undefined,
      onRecordingReady: handleRecordingReady,
      onStreamAvailable: handleStreamAvailable,
    }),
    [audioContext, handleRecordingReady, handleStreamAvailable],
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
  } = useAudioRecording(audioRecordingOptions);

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
    setError(null);
    if (permission === "denied") {
      void requestPermission().then((granted) => {
        if (granted) {
          void startRecording();
        }
      });
      return;
    }
    void startRecording();
  }, [permission, requestPermission, setError, startRecording, status, stopRecording]);

  const recordingSupported = supportsRecording !== false;
  const disabled =
    !recordingSupported || status === "requesting" || status === "stopping" || state.isProcessingRound;

  useSpacebarToggle(handleToggleRecording, !disabled);

  const hasTake = Boolean(state.originalBackwardsBuffer);
  const canAdvance = hasTake && !state.isProcessingRound && status !== "recording";

  return (
    <ScreenFrame
      metaLabel="Player 1"
      title="Say your phrase"
      subtitle="Something short and punchy."
      ghostText="ESARHP A YAS"
      footer={
        <PrimaryButton
          onClick={() => goToScreen("listenBackwards")}
          disabled={!canAdvance}
          className="w-full text-base"
        >
          {state.isProcessingRound ? "reversing…" : "said it! → pass the phone"}
        </PrimaryButton>
      }
    >
      <div className="flex flex-col items-center gap-3">
        <MicButton
          label={status === "recording" ? "tap to stop" : hasTake ? "redo take" : "tap to record"}
          onClick={handleToggleRecording}
          isActive={status === "recording"}
          disabled={disabled}
          timer={formatDuration(durationMs)}
        />
        {status === "recording" ? (
          <WaveformConsole
            label="Current take"
            samples={waveform}
            isActive={isActive}
            compact
          />
        ) : null}
        {hasTake && status !== "recording" ? (
          <p className="text-base text-[var(--accent-success)]">Take locked in ✓</p>
        ) : null}
        {supportsRecording === false ? (
          <p className="rounded-[var(--radius-md)] border border-[var(--accent-danger)] bg-[rgba(35,0,18,0.8)] px-4 py-3 text-sm text-[var(--accent-danger)]">
            Recording is not supported in this browser. Try Chrome or Safari on a device with a microphone.
          </p>
        ) : null}
      </div>
    </ScreenFrame>
  );
}
