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

type RevealPhase = "original" | "reveal" | "done";

export function ScreenD() {
  const { state, dispatch, nextRound } = useGameContext();
  const { play, stop, isPlaying, error: playbackError } = useAudioPlayback();
  const [activeClip, setActiveClip] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [revealPhase, setRevealPhase] = useState<RevealPhase>("original");
  const revealStartedRef = useRef(false);
  const revealAbortedRef = useRef(false);
  const leavingRef = useRef(false);

  const clips = useMemo<ClipConfig[]>(
    () => [
      { id: "original-forward", label: "Original phrase", buffer: state.originalRecording },
      { id: "mimic-forward", label: "The reveal: mimic flipped forward", buffer: state.mimicForwardBuffer },
      { id: "original-backwards", label: "Original, backwards", buffer: state.originalBackwardsBuffer },
      { id: "mimic-backwards", label: "Mimic, as spoken", buffer: state.mimicRecording },
    ],
    [state.mimicForwardBuffer, state.mimicRecording, state.originalBackwardsBuffer, state.originalRecording],
  );

  const playOnce = useCallback(
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
          failsafe = setTimeout(() => settle(true), buffer.duration * 1000 + 2500);
        });
      }),
    [play],
  );

  useEffect(() => {
    let cancelled = false;
    const aborted = () => cancelled || revealAbortedRef.current;
    const timer = setTimeout(async () => {
      if (revealStartedRef.current || aborted()) {
        return;
      }
      revealStartedRef.current = true;
      const original = state.originalRecording;
      const reveal = state.mimicForwardBuffer;
      if (!original || !reveal) {
        setRevealPhase("done");
        return;
      }
      setActiveClip("original-forward");
      const playedOriginal = await playOnce(original);
      if (aborted()) {
        return;
      }
      if (!playedOriginal) {
        setActiveClip(null);
        setRevealPhase("done");
        return;
      }
      await new Promise((r) => setTimeout(r, 450));
      if (aborted()) {
        return;
      }
      setRevealPhase("reveal");
      setActiveClip("mimic-forward");
      await playOnce(reveal);
      if (aborted()) {
        return;
      }
      setActiveClip(null);
      setRevealPhase("done");
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Runs once on mount with the buffers present at arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlay = useCallback(
    (clip: ClipConfig) => {
      if (!clip.buffer) {
        return;
      }
      revealAbortedRef.current = true;
      setRevealPhase("done");
      setActiveClip(clip.id);
      void play(clip.buffer, {
        onEnded: () => {
          setActiveClip(null);
        },
      });
    },
    [play],
  );

  const handleNextRound = useCallback(() => {
    if (leavingRef.current) {
      return;
    }
    leavingRef.current = true;
    revealAbortedRef.current = true;
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
  const revealBanner =
    revealPhase === "original"
      ? "▶ the original phrase…"
      : revealPhase === "reveal"
        ? "▶ …and the mimic, flipped forward:"
        : null;

  return (
    <ScreenFrame
      metaLabel="Results"
      title="The reveal"
      ghostText="?UOY EREW ESOLC WOH"
      footer={
        <div className="flex flex-col gap-2">
          <PrimaryButton onClick={handleNextRound} className="w-full text-base">
            next round
          </PrimaryButton>
          <button
            type="button"
            onClick={handleShare}
            className="min-h-[44px] text-base lowercase tracking-[0.2em] text-[var(--accent-secondary)] underline-offset-4 hover:underline"
          >
            {shareFeedback ?? "share this game"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {revealBanner ? (
          <p className="text-center text-base font-semibold text-[var(--accent-tertiary)]" aria-live="polite">
            {revealBanner}
          </p>
        ) : null}
        <div className="flex flex-col items-center gap-3">
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
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <span className="vinyl-disc vinyl-spinning h-12 w-12 rounded-full border border-[rgba(255,255,255,0.12)]" aria-hidden />
              <p className="text-sm lowercase tracking-[0.2em] text-[var(--text-secondary)]">
                decoding the chaos…
              </p>
            </div>
          ) : null}
          {scoringPhase === "error" ? (
            <div className="flex w-full flex-col items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-4 text-center">
              <p className="text-base text-[var(--text-secondary)]">
                Scoring is offline — the clips still tell the truth.
              </p>
              <button
                type="button"
                onClick={handleRetryScoring}
                className="min-h-[44px] rounded-[var(--radius-pill)] border border-[var(--accent-secondary)] px-6 text-sm font-semibold lowercase tracking-[0.2em] text-[var(--accent-secondary)] transition hover:bg-[rgba(92,242,255,0.1)]"
              >
                retry scoring
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
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
          <p className="rounded-[var(--radius-md)] border border-[var(--accent-danger)] bg-[var(--bg-danger)] px-4 py-3 text-xs text-[var(--accent-danger)]">
            {playbackError}
          </p>
        ) : null}
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
