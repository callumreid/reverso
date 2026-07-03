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
  const [autoLoop, setAutoLoop] = useState(true);
  const autoLoopRef = useRef(autoLoop);
  const loopTimeoutRef = useRef<number | null>(null);
  const replayRef = useRef<() => void>(() => undefined);
  const autoStartedRef = useRef(false);

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
    autoStartedRef.current = true;
    clearLoopTimeout();
    void play(state.originalBackwardsBuffer, {
      onEnded: () => {
        if (autoLoopRef.current) {
          loopTimeoutRef.current = window.setTimeout(() => {
            if (autoLoopRef.current) {
              replayRef.current();
            }
          }, 400);
        }
      },
    });
  }, [clearLoopTimeout, play, state.originalBackwardsBuffer]);

  useEffect(() => {
    replayRef.current = handlePlay;
  }, [handlePlay]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (autoStartedRef.current) {
        return;
      }
      autoStartedRef.current = true;
      replayRef.current();
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const handleStop = useCallback(() => {
    autoStartedRef.current = true;
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
      metaLabel="Player 2"
      title="Listen backwards"
      subtitle="Learn the gibberish — it loops until you're ready."
      ghostText="Sdrawkcab Netsil"
      footer={
        <PrimaryButton
          onClick={handleReady}
          disabled={!state.originalBackwardsBuffer}
          className="w-full text-base"
        >
          got it — ready to mimic
        </PrimaryButton>
      }
    >
      <div className="flex w-full flex-col items-center gap-4">
        <WaveformConsole
          label="Backwards playback"
          palette="cyan"
          samples={clipSamples}
          isActive={isPlaying}
          compact
        />
        <div className="flex w-full items-center justify-center gap-6">
          <button
            type="button"
            onClick={isPlaying ? handleStop : handlePlay}
            disabled={!state.originalBackwardsBuffer}
            className={cn(
              "min-h-[56px] rounded-[var(--radius-pill)] border-2 border-[var(--accent-secondary)] px-10 text-base font-bold lowercase tracking-[0.2em] text-[var(--accent-secondary)] transition hover:bg-[rgba(92,242,255,0.1)] disabled:cursor-not-allowed disabled:opacity-40",
              !isPlaying && "animate-[pulse_2.4s_ease-in-out_infinite]",
            )}
          >
            {isPlaying ? "◼ stop" : "▶ play"}
          </button>
          <label className="flex items-center gap-2 text-base text-[var(--text-secondary)]">
            <span>loop</span>
            <button
              type="button"
              onClick={() => {
                if (autoLoop) {
                  clearLoopTimeout();
                }
                setAutoLoop((prev) => !prev);
              }}
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
          <p className="rounded-[var(--radius-md)] border border-[var(--accent-danger)] bg-[rgba(35,0,18,0.8)] px-4 py-3 text-sm text-[var(--accent-danger)]">
            {error}
          </p>
        ) : null}
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
