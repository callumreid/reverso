"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AudioClipButton } from "@/components/AudioClipButton";
import { PhraseDiffCard } from "@/components/PhraseDiffCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScoreDial, MetricChip } from "@/components/ScoreDial";
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

  const roundLabel = String(state.roundNumber ?? 1).padStart(2, "0");
  const score = state.score ?? null;
  const metrics = buildMetrics(score);

  return (
    <ScreenFrame
      metaLabel="Results"
      title="How close were you?"
      ghostText="?UOY EREW ESOLC WOH"
      instructions="Share this round or spin a new phrase. Weirdness loves momentum."
      footer={
        <div className="flex flex-col gap-3">
          <PrimaryButton onClick={handleNextRound}>Next round</PrimaryButton>
          <button
            type="button"
            className="text-sm lowercase tracking-[0.3em] text-[var(--accent-secondary)] underline-offset-4 hover:underline"
          >
            Share this round
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[rgba(6,0,18,0.8)] p-4">
          <p className="text-xs lowercase tracking-[0.3em] text-[var(--text-secondary)]">Clips</p>
          <div className="mt-3 flex flex-col gap-3">
            {clips.map((clip) => (
              <AudioClipButton
                key={clip.id}
                label={clip.label}
                onClick={() => handlePlay(clip)}
                disabled={!clip.buffer}
                isActive={activeClip === clip.id && isPlaying}
                auxiliary={clip.label.includes("backwards") ? "∞" : "▶"}
              />
            ))}
          </div>
        </div>
        <PhraseDiffCard original={state.originalTranscription} mimic={state.mimicTranscription} />
      </div>
    </ScreenFrame>
  );
}

function buildMetrics(score: number | null) {
  const base = Math.max(0, Math.min(100, score ?? 50));
  return [
    { label: "Rhythm", value: Math.min(3, Math.round((base / 100) * 3)) },
    { label: "Vowels", value: Math.min(3, Math.round((base / 100) * 2.5)) },
    { label: "Consonants", value: Math.min(3, Math.round((base / 100) * 2)) },
  ];
}
