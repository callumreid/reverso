"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SCRATCH_SFX_PATH } from "@/utils/audioConstants";

/**
 * Loads and plays the record-scratch SFX used between recording phases.
 */
export function useScratchSfx(customUrl?: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const targetUrl = customUrl ?? SCRATCH_SFX_PATH;

  useEffect(() => {
    if (typeof window === "undefined") {
      return () => undefined;
    }
    const audio = new Audio(targetUrl);
    audio.preload = "auto";
    const handleReady = () => {
      setIsLoaded(true);
    };
    const handleError = () => {
      setIsLoaded(false);
    };
    audio.addEventListener("canplaythrough", handleReady, { once: true });
    audio.addEventListener("error", handleError);
    audioRef.current = audio;
    return () => {
      audio.removeEventListener("canplaythrough", handleReady);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audioRef.current = null;
    };
  }, [targetUrl]);

  const play = useCallback(() => {
    if (!audioRef.current) {
      return Promise.resolve();
    }
    audioRef.current.currentTime = 0;
    return new Promise<void>((resolve) => {
      const handleEnded = () => {
        audioRef.current?.removeEventListener("ended", handleEnded);
        audioRef.current?.removeEventListener("error", handleError);
        resolve();
      };
      const handleError = () => {
        audioRef.current?.removeEventListener("ended", handleEnded);
        audioRef.current?.removeEventListener("error", handleError);
        resolve();
      };
      audioRef.current?.addEventListener("ended", handleEnded, { once: true });
      audioRef.current?.addEventListener("error", handleError, { once: true });
      audioRef.current?.play().catch(() => resolve());
    });
  }, []);

  return { play, isLoaded };
}
