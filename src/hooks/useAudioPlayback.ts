"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logError } from "@/utils/logger";

export interface PlayOptions {
  volume?: number;
  playbackRate?: number;
  onEnded?: () => void;
}

/**
 * Provides imperative AudioContext-driven playback controls.
 * Uses fallback to HTMLAudioElement for maximum mobile compatibility.
 */
export function useAudioPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const getAudioContext = useCallback(async () => {
    if (typeof window === "undefined") {
      throw new Error("AudioContext is unavailable during SSR");
    }
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    const context = audioContextRef.current;
    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch (resumeError) {
        console.warn("Failed to resume AudioContext, will try HTMLAudioElement", resumeError);
      }
    }
    return context;
  }, []);

  const stop = useCallback(() => {
    sourceRef.current?.stop();
    sourceRef.current?.disconnect();
    gainRef.current?.disconnect();
    sourceRef.current = null;
    gainRef.current = null;
    setIsPlaying(false);
  }, []);

  const playWithWebAudio = useCallback(
    async (buffer: AudioBuffer, options: PlayOptions = {}): Promise<boolean> => {
      try {
        const context = await getAudioContext();
        if (context.state === "suspended") {
          return false;
        }
        const source = context.createBufferSource();
        const gainNode = context.createGain();
        source.buffer = buffer;
        source.playbackRate.value = options.playbackRate ?? 1;
        gainNode.gain.value = options.volume ?? 1;
        source.connect(gainNode).connect(context.destination);
        source.onended = () => {
          setIsPlaying(false);
          options.onEnded?.();
        };
        source.start();
        sourceRef.current = source;
        gainRef.current = gainNode;
        setIsPlaying(true);
        return true;
      } catch (audioError) {
        console.warn("Web Audio playback failed, will try fallback", audioError);
        return false;
      }
    },
    [getAudioContext],
  );

  const playWithFallback = useCallback(
    async (buffer: AudioBuffer, options: PlayOptions = {}) => {
      try {
        const audioBuffer = buffer;
        const wavBlob = new Blob(
          [
            new Uint8Array(
              audioBuffer.getChannelData(0).buffer,
              audioBuffer.getChannelData(0).byteOffset,
              audioBuffer.getChannelData(0).byteLength,
            ),
          ],
          { type: "audio/wav" },
        );
        const url = URL.createObjectURL(wavBlob);

        if (!audioElementRef.current) {
          audioElementRef.current = new Audio();
        }

        const audio = audioElementRef.current;
        audio.src = url;
        audio.volume = options.volume ?? 1;
        audio.playbackRate = options.playbackRate ?? 1;

        audio.onended = () => {
          setIsPlaying(false);
          options.onEnded?.();
          URL.revokeObjectURL(url);
        };

        audio.onerror = () => {
          setError("Audio playback error");
          setIsPlaying(false);
          URL.revokeObjectURL(url);
        };

        await audio.play();
        setIsPlaying(true);
      } catch (fallbackError) {
        console.error("Fallback playback failed:", fallbackError);
        setError("Unable to play audio on this device.");
        setIsPlaying(false);
        logError("Fallback audio playback failed", fallbackError);
      }
    },
    [],
  );

  const play = useCallback(
    async (buffer: AudioBuffer, options: PlayOptions = {}) => {
      try {
        setError(null);
        stop();

        if (!buffer || buffer.length === 0) {
          throw new Error("Audio buffer is empty or invalid");
        }

        const webAudioSuccess = await playWithWebAudio(buffer, options);
        if (webAudioSuccess) {
          return;
        }

        await playWithFallback(buffer, options);
      } catch (playError) {
        const message =
          playError instanceof Error ? playError.message : "Unable to play audio.";
        setError(message);
        setIsPlaying(false);
        logError("Playback failed", playError);
      }
    },
    [getAudioContext, stop, playWithWebAudio, playWithFallback],
  );

  const setVolume = useCallback((value: number) => {
    if (gainRef.current) {
      gainRef.current.gain.value = value;
    }
  }, []);

  const dispose = useCallback(async () => {
    stop();
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [stop]);

  useEffect(() => {
    return () => {
      void dispose();
    };
  }, [dispose]);

  return {
    play,
    stop,
    dispose,
    setVolume,
    isPlaying,
    error,
  };
}
