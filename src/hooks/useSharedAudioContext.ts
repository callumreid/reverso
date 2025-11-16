"use client";

import { useEffect, useRef } from "react";

let sharedAudioContext: AudioContext | null = null;

/**
 * Returns a shared AudioContext instance that persists across the entire app.
 * This ensures recording and playback use the same context.
 */
export function useSharedAudioContext(): AudioContext | null {
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!sharedAudioContext) {
      try {
        sharedAudioContext = new AudioContext();
      } catch (error) {
        console.error("Failed to create AudioContext:", error);
        return;
      }
    }

    contextRef.current = sharedAudioContext;

    if (sharedAudioContext.state === "suspended") {
      const resumeContext = async () => {
        try {
          await sharedAudioContext!.resume();
        } catch (error) {
          console.error("Failed to resume AudioContext:", error);
        }
      };
      void resumeContext();
    }

    return () => {
    };
  }, []);

  return contextRef.current;
}

