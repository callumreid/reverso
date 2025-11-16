"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AudioClipButton } from "@/components/AudioClipButton";
import { ScreenFrame } from "@/components/ScreenFrame";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { useGameContext } from "@/hooks/useGameContext";

interface ClipConfig {
  id: string;
  label: string;
  buffer: AudioBuffer | null;
}

export function ScreenD() {
  const { state, nextRound, goToScreen } = useGameContext();
  const { play, stop, isPlaying } = useAudioPlayback();
  const [activeClip, setActiveClip] = useState<string | null>(null);

  const clips = useMemo<ClipConfig[]>(
    () => [
      { id: "original-forward", label: "Play original (forward)", buffer: state.originalRecording },
      { id: "original-backwards", label: "Play original (backwards)", buffer: state.originalBackwardsBuffer },
      { id: "mimic-backwards", label: "Play mimic (as spoken)", buffer: state.mimicRecording },
      { id: "mimic-forward", label: "Play mimic (forward result)", buffer: state.mimicForwardBuffer },
    ],
    [state.mimicForwardBuffer, state.mimicRecording, state.originalBackwardsBuffer, state.originalRecording],
  );

  const handlePlay = useCallback(
    (clip: ClipConfig) => {
      if (!clip.buffer) {
        return;
      }
      setActiveClip(clip.id);
      void play(clip.buffer, {
        onEnded: () => {
          setActiveClip(null);
        },
      }).catch(() => {
        setActiveClip(null);
      });
    },
    [play],
  );

  const handleNextRound = useCallback(() => {
    stop();
    nextRound();
    goToScreen("input");
  }, [goToScreen, nextRound, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return (
    <ScreenFrame
      title="Results"
      subtitle="Compare each clip and see how close you were."
      footer={
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">Score: {state.score ?? "—"} / 100</p>
            <p className="text-sm text-[#d6bcfa]">Original: {state.originalTranscription ?? "…"}</p>
            <p className="text-sm text-[#d6bcfa]">You said: {state.mimicTranscription ?? "…"}</p>
          </div>
          <button
            type="button"
            onClick={handleNextRound}
            className="rounded-full border border-[#fffb96] px-6 py-2 text-sm font-semibold uppercase tracking-wide text-[#fffb96] transition hover:bg-[#fffb96]/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#fffb96]"
          >
            Next round
          </button>
        </div>
      }
    >
      <div className="grid w-full gap-4 md:grid-cols-2">
        {clips.map((clip) => (
          <AudioClipButton
            key={clip.id}
            label={clip.label}
            onClick={() => handlePlay(clip)}
            disabled={!clip.buffer}
            isActive={activeClip === clip.id && isPlaying}
          />
        ))}
      </div>
    </ScreenFrame>
  );
}
