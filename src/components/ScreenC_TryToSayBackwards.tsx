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

  const targetSamples = useMemo(() => {
    const buffer = state.originalBackwardsBuffer;
    if (!buffer) {
      return [];
    }
    const channel = buffer.getChannelData(0);
    const step = Math.max(1, Math.floor(channel.length / 480));
    const samples: number[] = [];
    for (let i = 0; i < channel.length; i += step) {
      samples.push(channel[i]);
    }
    return samples;
  }, [state.originalBackwardsBuffer]);
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
            mimicTranscription: null,
            mimicTranscriptionStatus: "idle",
            score: null,
            scoreStatus: "idle",
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
        void playScratch();
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

  const hasTake = Boolean(state.mimicForwardBuffer);
  const canAdvance = hasTake && !state.isProcessingRound && status !== "recording";

  return (
    <ScreenFrame
      metaLabel="Player 2"
      title="Say the gibberish"
      subtitle="Match the rhythm — your brain fills the gaps."
      ghostText="SDRAWKCAB"
      footer={
        <PrimaryButton
          onClick={() => goToScreen("results")}
          disabled={!canAdvance}
          className="w-full text-base"
        >
          {state.isProcessingRound ? "flipping…" : "flip it forward!"}
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
            label="Your backwards take"
            samples={waveform}
            palette="magenta"
            isActive={isActive}
            compact
          />
        ) : (
          <WaveformConsole
            label="Target rhythm"
            samples={targetSamples}
            palette="cyan"
            compact
            caption="the shape you're chasing"
          />
        )}
        {hasTake && status !== "recording" ? (
          <p className="text-base text-[var(--accent-success)]">Take locked in ✓</p>
        ) : null}
        {!recordingSupported ? (
          <p className="rounded-[var(--radius-md)] border border-[var(--accent-danger)] bg-[rgba(35,0,18,0.8)] px-4 py-3 text-sm text-[var(--accent-danger)]">
            Recording is not supported in this browser.
          </p>
        ) : null}
      </div>
    </ScreenFrame>
  );
}
