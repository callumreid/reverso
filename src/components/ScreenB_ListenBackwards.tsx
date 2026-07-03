"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenFrame } from "@/components/ScreenFrame";
import { WaveformConsole } from "@/components/WaveformConsole";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { useGameContext } from "@/hooks/useGameContext";
import { cn } from "@/utils/cn";

export function ScreenB() {
  const { state, goToScreen } = useGameContext();
  const { play, stop, isPlaying, error } = useAudioPlayback();
  const [autoLoop, setAutoLoop] = useState(false);
  const autoLoopRef = useRef(autoLoop);
  const loopTimeoutRef = useRef<number | null>(null);
  const replayRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    autoLoopRef.current = autoLoop;
  }, [autoLoop]);

  const clipSamples = useMemo(() => {
    const buffer = state.originalBackwardsBuffer;
    if (!buffer) {
      return [];
    }
    const channel = buffer.getChannelData(0);
    const step = Math.max(1, Math.floor(channel.length / 480));
    const samples: number[] = [];
    for (let i = 0; i < channel.length; i += step) {
      samples.push(channel[i]);
    }
    return samples;
  }, [state.originalBackwardsBuffer]);

  const clearLoopTimeout = useCallback(() => {
    if (loopTimeoutRef.current !== null) {
      window.clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
  }, []);

  const handlePlay = useCallback(() => {
    if (!state.originalBackwardsBuffer) {
      return;
    }
    clearLoopTimeout();
    void play(state.originalBackwardsBuffer, {
      onEnded: () => {
        if (autoLoopRef.current) {
          loopTimeoutRef.current = window.setTimeout(() => {
            replayRef.current();
          }, 250);
        }
      },
    });
  }, [clearLoopTimeout, play, state.originalBackwardsBuffer]);

  useEffect(() => {
    replayRef.current = handlePlay;
  }, [handlePlay]);

  const handleStop = useCallback(() => {
    clearLoopTimeout();
    stop();
  }, [clearLoopTimeout, stop]);

  const handleReady = useCallback(() => {
    handleStop();
    goToScreen("tryBackwards");
  }, [goToScreen, handleStop]);

  useEffect(() => {
    return () => {
      clearLoopTimeout();
      stop();
    };
  }, [clearLoopTimeout, stop]);

  return (
    <ScreenFrame
      metaLabel="Reversed"
      title="Listen backwards"
      subtitle="Player 2, this one's for your ears."
      ghostText="Sdrawkcab Netsil"
      instructions="Replay it as many times as you need. When you've got its rhythm, keep the phone and hit READY."
      footer={
        <PrimaryButton onClick={handleReady} disabled={!state.originalBackwardsBuffer}>
          Ready to mimic
        </PrimaryButton>
      }
    >
      <div className="flex w-full flex-col gap-5">
        <WaveformConsole
          label="Backwards playback"
          palette="cyan"
          samples={clipSamples}
          isActive={isPlaying}
        />
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[rgba(6,0,18,0.8)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={isPlaying ? handleStop : handlePlay}
              disabled={!state.originalBackwardsBuffer}
              className="rounded-[var(--radius-pill)] border border-[var(--accent-secondary)] px-6 py-3 text-sm font-semibold lowercase tracking-[0.3em] text-[var(--accent-secondary)] transition hover:bg-[rgba(92,242,255,0.1)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPlaying ? "Stop" : "Play"}
            </button>
            <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <span>Auto loop</span>
              <button
                type="button"
                onClick={() => setAutoLoop((prev) => !prev)}
                className={cnToggle(autoLoop)}
                role="switch"
                aria-checked={autoLoop}
              >
                <span
                  className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform"
                  style={{ transform: `translateX(${autoLoop ? 24 : 0}px)` }}
                />
              </button>
            </label>
          </div>
          {error ? (
            <p className="mt-4 rounded-[var(--radius-md)] border border-[var(--accent-danger)] bg-[rgba(35,0,18,0.8)] px-4 py-3 text-xs text-[var(--accent-danger)]">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </ScreenFrame>
  );
}

function cnToggle(active: boolean) {
  return cn(
    "relative h-8 w-14 rounded-full border border-[var(--border-subtle)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-secondary)]",
    active ? "bg-[var(--accent-secondary)]" : "bg-[rgba(8,0,23,0.6)]",
  );
}
