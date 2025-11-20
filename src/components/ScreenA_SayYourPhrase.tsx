"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ReversalTimelineStrip } from "@/components/ui/ReversalTimelineStrip";
import { RecordOrb } from "@/components/ui/RecordOrb";
import { WaveformConsole } from "@/components/ui/WaveformConsole";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useAudioReversal } from "@/hooks/useAudioReversal";
import { useGameContext } from "@/hooks/useGameContext";
import { useScratchSfx } from "@/hooks/useScratchSfx";
import { useWaveformAnalyzer } from "@/hooks/useWaveformAnalyzer";
import { useSpacebarToggle } from "@/hooks/useSpacebarToggle";
import { useSharedAudioContext } from "@/hooks/useSharedAudioContext";
import { formatDuration } from "@/utils/formatDuration";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { Play, Square } from "lucide-react";

export function ScreenA() {
  const { state, dispatch, goToScreen, setError } = useGameContext();
  const { waveform, attach, detach, isActive } = useWaveformAnalyzer();
  const { reverse } = useAudioReversal();
  const { play: playScratch } = useScratchSfx();
  const audioContext = useSharedAudioContext();

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  
  // For playback of the original after recording
  const { play: playOriginal, stop: stopOriginal, isPlaying: isPlayingOriginal } = useAudioPlayback(audioContext);

  const handleRecordingReady = useCallback(
    async (result: { audioBuffer: AudioBuffer; durationMs: number; createdAt: number }) => {
      setIsProcessing(true);
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
        setHasRecorded(true);
      } catch (flowError) {
        const message = flowError instanceof Error ? flowError.message : "Unable to process recording.";
        setError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [dispatch, reverse, setError],
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
    if (hasRecorded) return; // Prevent recording again if we have one? Or allow retry? 
                             // Spec says "Tap to finish". Usually implies one take or re-record.
                             // "Play icon appears on the waveform to replay".
                             // Let's assume we can re-record if we want, but for now let's handle the basic flow.
                             // If hasRecorded, maybe we should reset?
                             
    if (status === "recording") {
      void stopRecording();
      return;
    }
    if (permission === "denied") {
      void requestPermission();
      return;
    }
    // Reset if we are starting a new recording
    setHasRecorded(false); 
    void startRecording();
  }, [permission, requestPermission, startRecording, status, stopRecording, hasRecorded]);

  const recordingSupported = supportsRecording !== false;
  const disabled = !recordingSupported || status === "requesting" || status === "stopping" || isProcessing;

  useSpacebarToggle(handleToggleRecording, !disabled && !hasRecorded);

  const currentAmplitude = useMemo(() => {
     if (!waveform || !isActive || status !== "recording") return 0;
     // Waveform is array of 0-1 floats usually
     return Math.max(...waveform);
  }, [waveform, isActive, status]);

  const handleNext = async () => {
      await playScratch();
      goToScreen("listenBackwards");
  };

  const handlePlayOriginal = () => {
      if (state.originalRecording) {
          if (isPlayingOriginal) {
              stopOriginal();
          } else {
              playOriginal(state.originalRecording);
          }
      }
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        
      {/* Meta */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Round 01 • Original
        </span>
        <h1 className="font-display text-3xl font-black uppercase tracking-wider text-white drop-shadow-[0_0_15px_var(--shadow-glow-magenta)]">
            Say Your Phrase
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
            {state.targetPhrase ? `"${state.targetPhrase}"` : "Tap to record, then speak it like you mean it."}
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
        samples={hasRecorded && state.originalRecording ? undefined : waveform} // If recorded, we might want to show the full buffer but WaveformVisualizer takes live samples. 
                                                                               // WaveformConsole needs to support full buffer visualization if we pass it.
                                                                               // For now, pass live waveform or empty.
                                                                               // Actually, if we have `originalRecording`, we can't easily get "samples" array unless we decode it again or use the live buffer we captured.
                                                                               // Let's just show the live waveform during recording.
        label={hasRecorded ? "RECORDING COMPLETE" : "LIVE INPUT"}
        isActive={true}
        onPlay={hasRecorded ? handlePlayOriginal : undefined}
      />
      {/* Note: To visualize the full recorded buffer, we'd need to process audioBuffer to numbers. 
          For now, let's keep it simple.
      */}
      
      {hasRecorded && (
          <button 
            onClick={handlePlayOriginal}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-secondary)] hover:text-white"
          >
            {isPlayingOriginal ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
            {isPlayingOriginal ? "Stop Playback" : "Review Recording"}
          </button>
      )}

      {/* Timeline */}
      <ReversalTimelineStrip currentStep="original" />

      {/* Footer */}
      <div className="flex w-full flex-col items-center gap-4">
        <p className="text-xs text-[var(--text-muted)]">
            Tip: don’t over-enunciate. Your future self won’t.
        </p>
        
        <PrimaryButton 
            fullWidth 
            onClick={handleNext}
            disabled={!hasRecorded || isProcessing}
            className={!hasRecorded ? "opacity-50 grayscale" : ""}
        >
            Send it to the future
        </PrimaryButton>
      </div>
      
      {!recordingSupported && (
          <div className="text-xs text-[var(--accent-danger)]">
              Recording not supported in this browser.
          </div>
      )}
    </div>
  );
}
