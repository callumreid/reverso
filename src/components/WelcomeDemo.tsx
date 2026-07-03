"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { useGameContext } from "@/hooks/useGameContext";
import { reverseAudioBuffer } from "@/utils/audioProcessor";
import { cn } from "@/utils/cn";

const DEMO_AUDIO_PATH = "/audio/say-your-phrase.wav";
const SEEN_KEY = "reverso-demo-seen";

let autoAttemptDone = false;

type DemoPhase = "idle" | "loading" | "forward" | "reversed";

const phaseLabels: Record<DemoPhase, string> = {
  idle: "▶ hear it",
  loading: "…",
  forward: "“say your phrase”…",
  reversed: "…flipped: the same!",
};

/**
 * First-visit-of-session banner: plays "say your phrase" forward, then
 * reversed — the whole game in four seconds. Tries to autoplay once per page
 * load; browsers that block it get a one-tap button instead. Cancels itself
 * the moment a recording starts so demo audio never bleeds into a take.
 */
export function WelcomeDemo() {
  const { state } = useGameContext();
  const { play, stop } = useAudioPlayback();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const bufferRef = useRef<AudioBuffer | null>(null);
  const runningRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || state.roundNumber > 1) {
      return;
    }
    try {
      if (!window.sessionStorage.getItem(SEEN_KEY)) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, [state.roundNumber]);

  const markSeen = useCallback(() => {
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // storage unavailable — banner just reappears next load
    }
  }, []);

  const cancelDemo = useCallback(() => {
    cancelledRef.current = true;
    stop();
  }, [stop]);

  const dismiss = useCallback(() => {
    cancelDemo();
    markSeen();
    setVisible(false);
  }, [cancelDemo, markSeen]);

  useEffect(() => {
    if (state.isRecording && visible) {
      dismiss();
    }
  }, [dismiss, state.isRecording, visible]);

  const playThrough = useCallback(
    (buffer: AudioBuffer) =>
      new Promise<boolean>((resolve) => {
        let settled = false;
        let failsafe: ReturnType<typeof setTimeout> | null = null;
        const settle = (value: boolean) => {
          if (settled) {
            return;
          }
          settled = true;
          if (failsafe !== null) {
            clearTimeout(failsafe);
          }
          resolve(value);
        };
        void play(buffer, { onEnded: () => settle(true) }).then((started) => {
          if (!started) {
            settle(false);
            return;
          }
          failsafe = setTimeout(() => settle(true), buffer.duration * 1000 + 2000);
        });
      }),
    [play],
  );

  const runDemo = useCallback(async () => {
    if (runningRef.current) {
      return;
    }
    runningRef.current = true;
    cancelledRef.current = false;
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
      if (cancelledRef.current) {
        return;
      }
      const buffer = bufferRef.current;
      setPhase("forward");
      const playedForward = await playThrough(buffer);
      if (!playedForward || cancelledRef.current) {
        return;
      }
      await new Promise((r) => setTimeout(r, 300));
      if (cancelledRef.current) {
        return;
      }
      setPhase("reversed");
      await playThrough(reverseAudioBuffer(buffer));
      if (cancelledRef.current) {
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
      markSeen();
      setVisible(false);
    } catch {
      // the demo is decorative — never block the game on it
    } finally {
      setPhase("idle");
      runningRef.current = false;
    }
  }, [markSeen, playThrough]);

  useEffect(() => {
    if (!visible || autoAttemptDone) {
      return;
    }
    const timer = setTimeout(() => {
      if (autoAttemptDone) {
        return;
      }
      autoAttemptDone = true;
      void runDemo();
    }, 700);
    return () => clearTimeout(timer);
    // One auto-attempt per page load; a blocked attempt leaves the tap button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  if (!visible) {
    return null;
  }

  const busy = phase !== "idle";

  return (
    <div className="flex min-h-[48px] items-center gap-2 rounded-[var(--radius-lg)] border border-[rgba(92,242,255,0.35)] bg-[var(--bg-card)] py-1 pl-3 pr-1">
      <p className="min-w-0 flex-1 truncate text-sm text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">“say your phrase”</span> works backwards —
      </p>
      <button
        type="button"
        onClick={() => void runDemo()}
        disabled={busy}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-2 py-2 text-sm font-semibold lowercase tracking-[0.05em] text-[var(--accent-secondary)]",
          busy ? "cursor-default" : "hover:underline",
        )}
      >
        <span className={cn("vinyl-disc h-5 w-5 shrink-0 rounded-full", busy && "vinyl-spinning")} aria-hidden />
        {phaseLabels[phase]}
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss example"
        className="flex h-10 w-8 shrink-0 items-center justify-center rounded-full text-base text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
      >
        ✕
      </button>
    </div>
  );
}
