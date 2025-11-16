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
 */
export function useAudioPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const getAudioContext = useCallback(async () => {
    if (typeof window === "undefined") {
      throw new Error("AudioContext is unavailable during SSR");
    }
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const stop = useCallback(() => {
    sourceRef.current?.stop();
    sourceRef.current?.disconnect();
    gainRef.current?.disconnect();
    sourceRef.current = null;
    gainRef.current = null;
    setIsPlaying(false);
  }, []);

  const play = useCallback(
    async (buffer: AudioBuffer, options: PlayOptions = {}) => {
      try {
        setError(null);
        stop();
        const context = await getAudioContext();
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
      } catch (playError) {
        const message =
          playError instanceof Error ? playError.message : "Unable to play audio.";
        setError(message);
        setIsPlaying(false);
        logError("Playback failed", playError);
        throw playError;
      }
    },
    [getAudioContext, stop],
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
