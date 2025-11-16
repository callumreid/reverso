"use client";

import { useCallback, useEffect, useMemo } from "react";
import { MicButton } from "@/components/MicButton";
import { ScreenFrame } from "@/components/ScreenFrame";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";
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
        goToScreen("results");
      } catch (flowError) {
        const message = flowError instanceof Error ? flowError.message : "Unable to process your attempt.";
        setError(message);
      }
    },
    [dispatch, goToScreen, playScratch, reverse, setError, state.recordingMeta],
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
        <p className="text-sm text-[#d6bcfa]">
          Recording length: {formatDuration(durationMs)} · Permission: {permission}
        </p>
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
