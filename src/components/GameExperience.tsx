"use client";

import { useMemo } from "react";
import { TimelineStrip, timelineSteps, type TimelineNode } from "@/components/TimelineStrip";
import { ScreenA } from "@/components/ScreenA_SayYourPhrase";
import { ScreenB } from "@/components/ScreenB_ListenBackwards";
import { ScreenC } from "@/components/ScreenC_TryToSayBackwards";
import { ScreenD } from "@/components/ScreenD_Results";
import { useGameContext } from "@/hooks/useGameContext";
import { cn } from "@/utils/cn";

const screenComponents = {
  input: <ScreenA />,
  listenBackwards: <ScreenB />,
  tryBackwards: <ScreenC />,
  results: <ScreenD />,
} as const;

const screenToStep = {
  input: "original",
  listenBackwards: "reversed",
  tryBackwards: "mimic",
  results: "forward",
} as const;

export function GameExperience() {
  const { state, setError } = useGameContext();

  const timelineNodes = useMemo(() => {
    const completion = {
      original: Boolean(state.originalRecording),
      reversed: Boolean(state.originalBackwardsBuffer),
      mimic: Boolean(state.mimicRecording),
      forward: Boolean(state.mimicForwardBuffer),
    };
    const current = screenToStep[state.currentScreen];

    return timelineSteps.map<TimelineNode>((step) => {
      let status: TimelineNode["status"] = "inactive";
      if (step.id === current) {
        status = "current";
      } else if (completion[step.id]) {
        status = "completed";
      }
      return { ...step, status };
    });
  }, [
    state.currentScreen,
    state.mimicForwardBuffer,
    state.mimicRecording,
    state.originalBackwardsBuffer,
    state.originalRecording,
  ]);

  const roundLabel = String(state.roundNumber ?? 1).padStart(2, "0");

  return (
    <div className="reverso-shell">
      <div className="reverso-panel">
        <div className="relative z-10 flex flex-col gap-6">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold lowercase tracking-[0.4em] text-[var(--accent-secondary)]">Reverso</p>
              <p className="text-sm text-[var(--text-secondary)]">Round {roundLabel}</p>
            </div>
          </header>
          <TimelineStrip nodes={timelineNodes} />
          {state.lastError ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--accent-danger)] bg-[rgba(35,0,18,0.8)] px-4 py-3 text-sm text-[var(--accent-danger)]">
              {state.lastError}
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-2 text-[var(--accent-tertiary)] underline-offset-2 hover:underline"
              >
                Dismiss
              </button>
            </div>
          ) : null}
          {screenComponents[state.currentScreen]}
        </div>
      </div>
    </div>
  );
}
