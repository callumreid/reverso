"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ReversalTimelineStrip } from "@/components/ui/ReversalTimelineStrip";
import { WaveformConsole } from "@/components/ui/WaveformConsole";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RecordOrb } from "@/components/ui/RecordOrb";
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

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);

  const handleRecordingReady = useCallback(
    async (result: { audioBuffer: AudioBuffer; durationMs: number; createdAt: number }) => {
      setIsProcessing(true);
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
        setHasRecorded(true);
      } catch (flowError) {
        const message = flowError instanceof Error ? flowError.message : "Unable to process your attempt.";
        setError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [dispatch, reverse, setError, state.recordingMeta],
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
    setHasRecorded(false);
    void startRecording();
  }, [permission, requestPermission, startRecording, status, stopRecording]);

  const recordingSupported = supportsRecording !== false;
  const disabled =
    !recordingSupported ||
    status === "requesting" ||
    status === "stopping" ||
    isProcessing;

  useSpacebarToggle(handleToggleRecording, !disabled && !hasRecorded);

  const currentAmplitude = useMemo(() => {
     if (!waveform || !isActive || status !== "recording") return 0;
     return Math.max(...waveform);
  }, [waveform, isActive, status]);

  // Reference samples (Original Backwards)
  const referenceSamples = useMemo(() => {
    const buffer = state.originalBackwardsBuffer;
    if (!buffer) return undefined;
    const raw = buffer.getChannelData(0);
    const bucketSize = Math.floor(raw.length / 40);
    const result = [];
    for (let i = 0; i < 40; i++) {
      const start = i * bucketSize;
      const end = start + bucketSize;
      let max = 0;
      for (let j = start; j < end; j++) {
        if (Math.abs(raw[j]) > max) max = Math.abs(raw[j]);
      }
      result.push(max);
    }
    return result;
  }, [state.originalBackwardsBuffer]);

  const handleNext = async () => {
      await playScratch();
      goToScreen("results");
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
       {/* Meta */}
       <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Round 01 • Your Backwards
        </span>
        <h1 className="font-display text-3xl font-black uppercase tracking-wider text-white drop-shadow-[0_0_15px_var(--shadow-glow-magenta)]">
            Try to Say It Backwards
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
            Tap to record, mimic the nonsense, then tap again.
        </p>
      </div>

      {/* Core */}
      <div className="flex flex-col items-center justify-center py-4">
        <RecordOrb 
            isRecording={status === "recording"}
            isProcessing={isProcessing}
            onClick={handleToggleRecording}
            disabled={disabled}
            amplitude={currentAmplitude}
        />
      </div>

      {/* Waveform Console */}
      <WaveformConsole 
        samples={waveform}
        comparisonSamples={referenceSamples}
        label={hasRecorded ? "MIMIC RECORDED" : "YOUR BACKWARDS TAKE"}
        isActive={true}
        isReversed={false} 
      />

      {/* Timeline */}
      <ReversalTimelineStrip currentStep="mimic" />

      {/* Footer */}
       <div className="flex w-full flex-col items-center gap-4">
        <p className="text-xs text-[var(--text-muted)]">
            Tip: Match the rhythm more than the consonants.
        </p>
        
        <PrimaryButton 
            fullWidth 
            onClick={handleNext}
            disabled={!hasRecorded || isProcessing}
            className={!hasRecorded ? "opacity-50 grayscale" : ""}
        >
            Flip it Forward
        </PrimaryButton>
      </div>

      {!recordingSupported && (
        <div className="text-xs text-[var(--accent-danger)]">
            Recording not supported.
        </div>
      )}
    </div>
  );
}
