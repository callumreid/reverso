"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audioBufferToWavBlob } from "@/utils/audioConversion";
import { logError } from "@/utils/logger";

interface AudioContextWindow extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

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
  const objectUrlRef = useRef<string | null>(null);

  const getAudioContext = useCallback(async () => {
    if (typeof window === "undefined") {
      throw new Error("AudioContext is unavailable during SSR");
    }
    if (!audioContextRef.current) {
      const audioWindow = window as AudioContextWindow;
      const AudioContextCtor =
        audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
      if (!AudioContextCtor) {
        throw new Error("Web Audio API is not supported in this browser");
      }
      audioContextRef.current = new AudioContextCtor();
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
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current.src = "";
      audioElementRef.current.onended = null;
      audioElementRef.current.onerror = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
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
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        const wavBlob = audioBufferToWavBlob(buffer);
        const url = URL.createObjectURL(wavBlob);
        objectUrlRef.current = url;

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
          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
          }
        };

        audio.onerror = () => {
          setError("Audio playback error");
          setIsPlaying(false);
          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
          }
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
    [stop, playWithWebAudio, playWithFallback],
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
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
      audioElementRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
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
