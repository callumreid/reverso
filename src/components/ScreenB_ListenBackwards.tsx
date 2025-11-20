"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    autoLoopRef.current = autoLoop;
  }, [autoLoop]);

  const handlePlay = useCallback(() => {
    if (!state.originalBackwardsBuffer) {
      return;
    }
    void play(state.originalBackwardsBuffer, {
      onEnded: () => {
        if (autoLoopRef.current) {
          setTimeout(() => {
            handlePlay();
          }, 200);
        }
      },
    });
  }, [play, state.originalBackwardsBuffer]);

  const handleReady = useCallback(() => {
    stop();
    goToScreen("tryBackwards");
  }, [goToScreen, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const roundLabel = String(state.roundNumber ?? 1).padStart(2, "0");

  return (
    <ScreenFrame
      metaLabel="Reversed"
      title="Listen backwards"
      ghostText="Sdrawkcab Netsil"
      instructions="When you think you’ve got its rhythm, pass the device and tap READY."
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
          isActive={isPlaying}
        />
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[rgba(6,0,18,0.8)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={isPlaying ? stop : handlePlay}
              disabled={!state.originalBackwardsBuffer}
              className="rounded-[var(--radius-pill)] border border-[var(--accent-secondary)] px-6 py-2 text-sm font-semibold lowercase tracking-[0.3em] text-[var(--accent-secondary)] transition hover:bg-[rgba(92,242,255,0.1)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <span>Auto loop</span>
              <button
                type="button"
                onClick={() => setAutoLoop((prev) => !prev)}
                className={cnToggle(autoLoop)}
              >
                <span
                  className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition-transform"
                  style={{ transform: `translateX(${autoLoop ? 16 : 0}px)` }}
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
    "relative h-5 w-10 rounded-full border border-[var(--border-subtle)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-secondary)]",
    active ? "bg-[var(--accent-secondary)]" : "bg-[rgba(8,0,23,0.6)]",
  );
}
