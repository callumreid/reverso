"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioClipButton } from "@/components/AudioClipButton";
import { PhraseDiffCard } from "@/components/PhraseDiffCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScoreDial, MetricChip } from "@/components/ScoreDial";
import { ScreenFrame } from "@/components/ScreenFrame";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { useGameContext } from "@/hooks/useGameContext";
import type { AsyncStatus } from "@/types/game";

interface ClipConfig {
  id: string;
  label: string;
  buffer: AudioBuffer | null;
}

const SHARE_URL = "https://reverso.lol";

export function ScreenD() {
  const { state, dispatch, nextRound } = useGameContext();
  const { play, stop, isPlaying, error: playbackError } = useAudioPlayback();
  const [activeClip, setActiveClip] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const clips = useMemo<ClipConfig[]>(
    () => [
      { id: "mimic-forward", label: "The reveal: mimic flipped forward", buffer: state.mimicForwardBuffer },
      { id: "original-forward", label: "Original phrase", buffer: state.originalRecording },
      { id: "original-backwards", label: "Original, backwards", buffer: state.originalBackwardsBuffer },
      { id: "mimic-backwards", label: "Mimic, as spoken", buffer: state.mimicRecording },
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
      });
    },
    [play],
  );

  const leavingRef = useRef(false);
  const handleNextRound = useCallback(() => {
    if (leavingRef.current) {
      return;
    }
    leavingRef.current = true;
    stop();
    nextRound();
  }, [nextRound, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const scoringPhase = deriveScoringPhase(
    state.originalTranscriptionStatus,
    state.mimicTranscriptionStatus,
    state.scoreStatus,
  );

  const handleRetryScoring = useCallback(() => {
    dispatch({
      type: "SET_STATE",
      payload: {
        originalTranscriptionStatus:
          state.originalTranscriptionStatus === "error" ? "idle" : state.originalTranscriptionStatus,
        mimicTranscriptionStatus:
          state.mimicTranscriptionStatus === "error" ? "idle" : state.mimicTranscriptionStatus,
        scoreStatus: state.scoreStatus === "error" ? "idle" : state.scoreStatus,
      },
    });
  }, [dispatch, state.mimicTranscriptionStatus, state.originalTranscriptionStatus, state.scoreStatus]);

  const handleShare = useCallback(async () => {
    const scoreLine =
      state.score !== null
        ? `I scored ${state.score}/100 speaking backwards on Reverso.`
        : "We're talking backwards on Reverso.";
    const text = `${scoreLine} Think you can mimic reversed speech? ${SHARE_URL}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Reverso", text: scoreLine, url: SHARE_URL });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareFeedback("copied to clipboard!");
      setTimeout(() => setShareFeedback(null), 2500);
    } catch {
      setShareFeedback(null);
    }
  }, [state.score]);

  const metrics = state.score !== null ? buildMetrics(state.score) : null;

  return (
    <ScreenFrame
      metaLabel="Results"
      title="How close were you?"
      ghostText="?UOY EREW ESOLC WOH"
      instructions="Play the reveal out loud, then pass the phone and run it back."
      footer={
        <div className="flex flex-col gap-3">
          <PrimaryButton onClick={handleNextRound}>Next round</PrimaryButton>
          <button
            type="button"
            onClick={handleShare}
            className="text-sm lowercase tracking-[0.3em] text-[var(--accent-secondary)] underline-offset-4 hover:underline"
          >
            {shareFeedback ?? "share this game"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-4">
          {scoringPhase === "done" ? (
            <>
              <ScoreDial score={state.score} />
              {metrics ? (
                <div className="flex w-full flex-col gap-2">
                  {metrics.map((metric) => (
                    <MetricChip key={metric.label} label={metric.label} value={metric.value} />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
          {scoringPhase === "pending" ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="vinyl-disc vinyl-spinning h-14 w-14 rounded-full border border-[rgba(255,255,255,0.12)]" aria-hidden />
              <p className="text-sm lowercase tracking-[0.2em] text-[var(--text-secondary)]">
                decoding the chaos…
              </p>
            </div>
          ) : null}
          {scoringPhase === "error" ? (
            <div className="flex w-full flex-col items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[rgba(6,0,18,0.8)] px-4 py-5 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                Scoring is offline right now — the clips below still tell the truth.
              </p>
              <button
                type="button"
                onClick={handleRetryScoring}
                className="rounded-[var(--radius-pill)] border border-[var(--accent-secondary)] px-6 py-2 text-sm font-semibold lowercase tracking-[0.3em] text-[var(--accent-secondary)] transition hover:bg-[rgba(92,242,255,0.1)]"
              >
                retry scoring
              </button>
            </div>
          ) : null}
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[rgba(6,0,18,0.8)] p-4">
          <p className="text-xs lowercase tracking-[0.3em] text-[var(--text-secondary)]">Clips</p>
          <div className="mt-3 flex flex-col gap-3">
            {clips.map((clip) => (
              <AudioClipButton
                key={clip.id}
                label={clip.label}
                onClick={() => handlePlay(clip)}
                disabled={!clip.buffer}
                isActive={activeClip === clip.id && isPlaying && !playbackError}
              />
            ))}
          </div>
          {playbackError ? (
            <p className="mt-3 rounded-[var(--radius-md)] border border-[var(--accent-danger)] bg-[rgba(35,0,18,0.8)] px-4 py-3 text-xs text-[var(--accent-danger)]">
              {playbackError}
            </p>
          ) : null}
        </div>
        {scoringPhase === "done" || state.originalTranscription || state.mimicTranscription ? (
          <PhraseDiffCard original={state.originalTranscription} mimic={state.mimicTranscription} />
        ) : null}
      </div>
    </ScreenFrame>
  );
}

function deriveScoringPhase(
  original: AsyncStatus,
  mimic: AsyncStatus,
  score: AsyncStatus,
): "pending" | "done" | "error" {
  if (score === "done") {
    return "done";
  }
  if (original === "error" || mimic === "error" || score === "error") {
    return "error";
  }
  return "pending";
}

function buildMetrics(score: number) {
  const base = Math.max(0, Math.min(100, score));
  return [
    { label: "Rhythm", value: Math.min(3, Math.round((base / 100) * 3)) },
    { label: "Vowels", value: Math.min(3, Math.round((base / 100) * 2.5)) },
    { label: "Consonants", value: Math.min(3, Math.round((base / 100) * 2)) },
  ];
}
