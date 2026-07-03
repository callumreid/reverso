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
    audio.volume = 0.35;
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
      let settled = false;
      const settle = () => {
        if (settled) {
          return;
        }
        settled = true;
        audioRef.current?.removeEventListener("ended", settle);
        audioRef.current?.removeEventListener("error", settle);
        clearTimeout(failsafe);
        resolve();
      };
      // A stalled download (or a codec the browser rejects without firing
      // "error") can leave play() pending forever — never block gameplay on it.
      const failsafe = setTimeout(settle, 2_500);
      audioRef.current?.addEventListener("ended", settle, { once: true });
      audioRef.current?.addEventListener("error", settle, { once: true });
      audioRef.current?.play().catch(() => settle());
    });
  }, []);

  return { play, isLoaded };
}
