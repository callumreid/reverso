"use client";

import { useEffect, useState } from "react";

interface AudioContextWindow extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

let sharedAudioContext: AudioContext | null = null;

/**
 * Returns a shared AudioContext instance that persists across the entire app.
 * This ensures recording and playback use the same context.
 */
export function useSharedAudioContext(): AudioContext | null {
  const [context, setContext] = useState<AudioContext | null>(() => sharedAudioContext);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!sharedAudioContext) {
      const audioWindow = window as AudioContextWindow;
      const AudioContextCtor =
        audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
      if (!AudioContextCtor) {
        console.error("Web Audio API is not supported in this environment.");
        return;
      }
      try {
        sharedAudioContext = new AudioContextCtor();
      } catch (error) {
        console.error("Failed to create AudioContext:", error);
        return;
      }
    }

    Promise.resolve().then(() => {
      setContext(sharedAudioContext);
    });

    if (sharedAudioContext?.state === "suspended") {
      sharedAudioContext
        .resume()
        .catch((error) => {
          console.error("Failed to resume AudioContext:", error);
        });
    }
  }, []);

  return context;
}

