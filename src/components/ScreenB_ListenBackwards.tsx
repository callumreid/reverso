"use client";

import { useCallback, useEffect } from "react";
import { AudioClipButton } from "@/components/AudioClipButton";
import { ScreenFrame } from "@/components/ScreenFrame";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { useGameContext } from "@/hooks/useGameContext";

export function ScreenB() {
  const { state, goToScreen } = useGameContext();
  const { play, stop, isPlaying, error } = useAudioPlayback();

  const handlePlay = useCallback(() => {
    if (!state.originalBackwardsBuffer) {
      return;
    }
    void play(state.originalBackwardsBuffer);
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

  return (
    <ScreenFrame
      title="Listen backwards"
      subtitle="Replay the backwards clip as much as you’d like, then continue."
      footer={
        <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
          <p className="text-sm text-[#d6bcfa]">Tip: close your eyes and focus on the cadence.</p>
          <button
            type="button"
            onClick={handleReady}
            className="rounded-full border border-[#8be9fd] px-6 py-2 text-sm font-semibold uppercase tracking-wide text-[#8be9fd] transition hover:bg-[#8be9fd]/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8be9fd]"
            disabled={!state.originalBackwardsBuffer}
          >
            Ready to try it
          </button>
        </div>
      }
    >
      <div className="flex w-full flex-col gap-6">
        <AudioClipButton
          label={isPlaying ? "Playing backwards..." : "Play original (backwards)"}
          onClick={handlePlay}
          isActive={isPlaying}
          disabled={!state.originalBackwardsBuffer}
        />
        {error ? (
          <p className="rounded-2xl border border-[#ff5f87] bg-[#2a001a] px-4 py-3 text-sm text-[#ffb3c1]">
            {error}
          </p>
        ) : null}
        <p className="text-center text-base text-[#f8f7ff]">
          Pass the device to the next player once they’re confident they can mimic what they heard.
        </p>
      </div>
    </ScreenFrame>
  );
}
