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

export function ScreenC() {
  const { state, dispatch, goToScreen, setError } = useGameContext();
  const { waveform, attach, detach, isActive } = useWaveformAnalyzer();
  const { reverse } = useAudioReversal();
  const { play: playScratch } = useScratchSfx();
  const audioContext = useSharedAudioContext();

  const handleRecordingReady = useCallback(
    async (result: { audioBuffer: AudioBuffer; durationMs: number; createdAt: number }) => {
      dispatch({ type: "SET_STATE", payload: { isProcessingRound: true } });
      try {
        const mimicForward = await reverse(result.audioBuffer);
        dispatch({
          type: "SET_STATE",
          payload: {
            mimicRecording: result.audioBuffer,
            mimicForwardBuffer: mimicForward,
            lastError: null,
            recordingMeta: {
              ...state.recordingMeta,
              mimic: {
                createdAt: result.createdAt,
                durationMs: result.durationMs,
                source: "mimic",
              },
            },
          },
        });
        await playScratch();
      } catch (flowError) {
        const message = flowError instanceof Error ? flowError.message : "Unable to process your attempt.";
        setError(message);
      } finally {
        dispatch({ type: "SET_STATE", payload: { isProcessingRound: false } });
      }
    },
    [dispatch, playScratch, reverse, setError, state.recordingMeta],
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
    if (permission === "denied") {
      void requestPermission();
      return;
    }
    void startRecording();
  }, [permission, requestPermission, startRecording, status, stopRecording]);

  const recordingSupported = supportsRecording !== false;
  const disabled =
    !recordingSupported || status === "requesting" || status === "stopping" || state.isProcessingRound;

  useSpacebarToggle(handleToggleRecording, !disabled);

  const roundLabel = String(state.roundNumber ?? 1).padStart(2, "0");
  const canAdvance = Boolean(state.mimicForwardBuffer) && !state.isProcessingRound;

  return (
    <ScreenFrame
      metaLabel={`Round ${roundLabel} • Your Backwards`}
      title="Try to say it backwards"
      subtitle="Tap to record, mimic the nonsense, then tap again."
      ghostText="SDRAWKCAB"
      instructions="Tip: match the rhythm more than the consonants. Your brain will fill the gaps."
      footer={
        <div className="flex flex-col gap-3">
          <PrimaryButton onClick={() => goToScreen("results")} disabled={!canAdvance}>
            Flip it forward
          </PrimaryButton>
          <p className="text-center text-xs text-[var(--text-muted)]">
            Recording length {formatDuration(durationMs)} · Permission {permission}
          </p>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-5">
        <MicButton
          label={status === "recording" ? "Tap to stop" : "Tap to start"}
          onClick={handleToggleRecording}
          isActive={status === "recording"}
          disabled={disabled}
        />
        <WaveformConsole
          label="Your backwards take"
          samples={waveform}
          palette="magenta"
          isActive={isActive && status === "recording"}
          caption="Overlay shows the remembered cadence"
        />
        {!recordingSupported ? (
          <p className="rounded-[var(--radius-md)] border border-[var(--accent-danger)] bg-[rgba(35,0,18,0.8)] px-4 py-3 text-sm text-[var(--accent-danger)]">
            Recording is not supported in this browser.
          </p>
        ) : null}
      </div>
    </ScreenFrame>
  );
}
