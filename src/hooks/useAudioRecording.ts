"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_RECORDING_DURATION_MS,
  MEDIA_RECORDER_OPTIONS,
  RECORDING_CONSTRAINTS,
} from "@/utils/audioConstants";
import { blobToAudioBuffer } from "@/utils/audioConversion";
import { logError } from "@/utils/logger";

export type RecordingStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "stopping"
  | "error";

export interface RecordingResult {
  blob: Blob;
  audioBuffer: AudioBuffer;
  durationMs: number;
  createdAt: number;
}

export interface UseAudioRecordingOptions {
  audioContext?: AudioContext;
  maxDurationMs?: number;
  onRecordingReady?: (result: RecordingResult) => void;
  onStreamAvailable?: (stream: MediaStream | null) => void;
}

const DEFAULT_ERROR_MESSAGE = "Recording is not supported in this environment.";

const hasMediaAPIs = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.mediaDevices !== "undefined" &&
  typeof navigator.mediaDevices.getUserMedia === "function";

/**
 * Provides press-and-hold audio recording capabilities backed by MediaRecorder.
 */
export function useAudioRecording(options: UseAudioRecordingOptions = {}) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState>("prompt");
  const [durationMs, setDurationMs] = useState(0);
  const [supportsRecording, setSupportsRecording] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationRafRef = useRef<number | null>(null);
  const durationStartRef = useRef<number>(0);
  const durationSnapshotRef = useRef(0);
  const stopResolveRef = useRef<((value: RecordingResult | null) => void) | null>(
    null,
  );
  const stopRejectRef = useRef<((error: unknown) => void) | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const shouldEmitResultRef = useRef(true);

  useEffect(() => {
    setSupportsRecording(hasMediaAPIs());
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;
    options.onStreamAvailable?.(null);
  }, [options]);

  const resetDurationTicker = useCallback(() => {
    if (durationRafRef.current) {
      cancelAnimationFrame(durationRafRef.current);
      durationRafRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    durationStartRef.current = 0;
  }, []);

  const handleRecorderStop = useCallback(async () => {
    try {
      resetDurationTicker();
      cleanupStream();
      mediaRecorderRef.current = null;
      const blob = new Blob(chunksRef.current, {
        type: MEDIA_RECORDER_OPTIONS.mimeType,
      });
      chunksRef.current = [];
      if (!shouldEmitResultRef.current) {
        shouldEmitResultRef.current = true;
        stopResolveRef.current?.(null);
        stopResolveRef.current = null;
        stopRejectRef.current = null;
        setStatus("idle");
        return;
      }
      const audioBuffer = await blobToAudioBuffer(blob, options.audioContext);
      const result: RecordingResult = {
        blob,
        audioBuffer,
        durationMs: Math.round(durationSnapshotRef.current),
        createdAt: Date.now(),
      };
      options.onRecordingReady?.(result);
      setStatus("idle");
      stopResolveRef.current?.(result);
    } catch (recorderError) {
      const message = recorderError instanceof Error ? recorderError.message : DEFAULT_ERROR_MESSAGE;
      setError(message);
      setStatus("error");
      stopRejectRef.current?.(recorderError);
    } finally {
      stopResolveRef.current = null;
      stopRejectRef.current = null;
      shouldEmitResultRef.current = true;
    }
  }, [cleanupStream, options, resetDurationTicker]);

  const tickDuration = useCallback(() => {
    if (!durationStartRef.current) {
      return;
    }
    const now = performance.now();
    durationSnapshotRef.current = now - durationStartRef.current;
    setDurationMs(durationSnapshotRef.current);
    durationRafRef.current = requestAnimationFrame(tickDuration);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!hasMediaAPIs()) {
      setError(DEFAULT_ERROR_MESSAGE);
      setPermission("denied");
      return false;
    }
    try {
      setStatus("requesting");
      const stream = await navigator.mediaDevices.getUserMedia(
        RECORDING_CONSTRAINTS,
      );
      setPermission("granted");
      stream.getTracks().forEach((track) => track.stop());
      setStatus("idle");
      return true;
    } catch (permissionError) {
      const message =
        permissionError instanceof Error
          ? permissionError.message
          : DEFAULT_ERROR_MESSAGE;
      setError(message);
      setPermission("denied");
      setStatus("error");
      logError("Microphone permission denied", permissionError);
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) {
      return Promise.resolve<RecordingResult | null>(null);
    }
    if (status !== "recording" && status !== "requesting") {
      return Promise.resolve<RecordingResult | null>(null);
    }
    setStatus("stopping");
    return new Promise<RecordingResult | null>((resolve, reject) => {
      stopResolveRef.current = resolve;
      stopRejectRef.current = reject;
      shouldEmitResultRef.current = true;
      mediaRecorderRef.current?.stop();
    });
  }, [status]);

  const startRecording = useCallback(async () => {
    if (!hasMediaAPIs()) {
      setError(DEFAULT_ERROR_MESSAGE);
      setStatus("error");
      return false;
    }
    try {
      setStatus("requesting");
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia(
        RECORDING_CONSTRAINTS,
      );
      streamRef.current = stream;
      options.onStreamAvailable?.(stream);
      const recorder = new MediaRecorder(stream, MEDIA_RECORDER_OPTIONS);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = handleRecorderStop;
      recorder.onerror = (event) => {
        const message = event.error?.message ?? DEFAULT_ERROR_MESSAGE;
        setError(message);
        setStatus("error");
        logError("Recorder error", message);
      };
      recorder.start();
      setPermission("granted");
      setStatus("recording");
      durationStartRef.current = performance.now();
      tickDuration();
      const limit = options.maxDurationMs ?? MAX_RECORDING_DURATION_MS;
      timeoutRef.current = window.setTimeout(() => {
        stopRecording().catch((timeoutError) => {
          logError("Auto-stop failed", timeoutError);
        });
      }, limit);
      return true;
    } catch (startError) {
      const message =
        startError instanceof Error ? startError.message : DEFAULT_ERROR_MESSAGE;
      setError(message);
      setStatus("error");
      setPermission("denied");
      logError("Unable to start recording", startError);
      return false;
    }
  }, [
    handleRecorderStop,
    options,
    stopRecording,
    tickDuration,
  ]);

  const cancelRecording = useCallback(() => {
    resetDurationTicker();
    chunksRef.current = [];
    shouldEmitResultRef.current = false;
    mediaRecorderRef.current?.stop();
    cleanupStream();
    setStatus("idle");
  }, [cleanupStream, resetDurationTicker]);

  const reset = useCallback(() => {
    cancelRecording();
    setError(null);
    setPermission("prompt");
    setDurationMs(0);
  }, [cancelRecording]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return () => undefined;
    }
    const handleVisibilityChange = () => {
      if (document.hidden && status === "recording") {
        stopRecording().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status, stopRecording]);

  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, [cancelRecording]);

  return {
    status,
    error,
    isRecording: status === "recording",
    durationMs,
    permission,
    supportsRecording,
    requestPermission,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  };
}
