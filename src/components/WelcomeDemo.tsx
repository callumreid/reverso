"use client";

import { useCallback, useRef, useState } from "react";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { reverseAudioBuffer } from "@/utils/audioProcessor";
import { cn } from "@/utils/cn";

const DEMO_AUDIO_PATH = "/audio/say-your-phrase.wav";

type DemoPhase = "idle" | "loading" | "forward" | "reversed";

const phaseLabels: Record<DemoPhase, string> = {
  idle: "drop the needle",
  loading: "spinning up…",
  forward: "“say your phrase”…",
  reversed: "…now backwards",
};

/**
 * One-tap intro: plays the phrase "say your phrase" forward, then reversed —
 * it survives the flip almost intact, which is the whole game in four seconds.
 */
export function WelcomeDemo() {
  const { play } = useAudioPlayback();
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const bufferRef = useRef<AudioBuffer | null>(null);

  const playThrough = useCallback(
    (buffer: AudioBuffer) =>
      new Promise<void>((resolve) => {
        const failsafe = setTimeout(resolve, buffer.duration * 1000 + 1500);
        void play(buffer, {
          onEnded: () => {
            clearTimeout(failsafe);
            resolve();
          },
        });
      }),
    [play],
  );

  const handleDemo = useCallback(async () => {
    if (phase !== "idle") {
      return;
    }
    try {
      setPhase("loading");
      if (!bufferRef.current) {
        const response = await fetch(DEMO_AUDIO_PATH);
        const raw = await response.arrayBuffer();
        const context = new AudioContext();
        try {
          bufferRef.current = await context.decodeAudioData(raw);
        } finally {
          void context.close().catch(() => undefined);
        }
      }
      const buffer = bufferRef.current;
      setPhase("forward");
      await playThrough(buffer);
      await new Promise((r) => setTimeout(r, 300));
      setPhase("reversed");
      await playThrough(reverseAudioBuffer(buffer));
    } catch {
      // the demo is decorative — never block the game on it
    } finally {
      setPhase("idle");
    }
  }, [phase, playThrough]);

  const busy = phase !== "idle";

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-sm text-[var(--text-secondary)]">
        New here? This phrase sounds the same flipped:
      </p>
      <button
        type="button"
        onClick={handleDemo}
        disabled={busy}
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--accent-secondary)] py-2 pl-2 pr-4 text-xs font-semibold lowercase tracking-[0.2em] text-[var(--accent-secondary)] transition hover:bg-[rgba(92,242,255,0.1)]",
          busy && "cursor-default opacity-80",
        )}
      >
        <span
          className={cn("vinyl-disc h-7 w-7 rounded-full", busy && "vinyl-spinning")}
          aria-hidden
        />
        {phaseLabels[phase]}
      </button>
    </div>
  );
}
