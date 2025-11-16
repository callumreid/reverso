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
import { formatDuration } from "@/utils/formatDuration";

export function ScreenA() {
  const { dispatch, goToScreen, setError } = useGameContext();
  const { waveform, attach, detach, isActive } = useWaveformAnalyzer();
  const { reverse } = useAudioReversal();
  const { play: playScratch } = useScratchSfx();

  const handleRecordingReady = useCallback(
    async (result: { audioBuffer: AudioBuffer; durationMs: number; createdAt: number }) => {
      try {
        const reversed = await reverse(result.audioBuffer);
        dispatch({
          type: "SET_STATE",
          payload: {
            originalRecording: result.audioBuffer,
            originalBackwardsBuffer: reversed,
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
        await playScratch();
        goToScreen("listenBackwards");
      } catch (flowError) {
        const message = flowError instanceof Error ? flowError.message : "Unable to process recording.";
        setError(message);
      }
    },
    [dispatch, goToScreen, playScratch, reverse, setError],
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
    onStreamAvailable: handleStreamAvailable,
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
  const disabled = !recordingSupported || status === "requesting" || status === "stopping";

  useSpacebarToggle(handleToggleRecording, !disabled);

  return (
    <ScreenFrame
      title="Say your phrase"
      subtitle="Tap the mic (or press space) to start, then tap again to finish."
      footer={
        <p className="text-center text-sm text-[#d6bcfa]">
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
        {supportsRecording === false ? (
          <p className="rounded-2xl border border-[#ff5f87] bg-[#2a001a] px-4 py-3 text-sm text-[#ffb3c1]">
            Recording is not supported in this browser. Try Chrome or Safari on a device with a microphone.
          </p>
        ) : null}
      </div>
    </ScreenFrame>
  );
}
