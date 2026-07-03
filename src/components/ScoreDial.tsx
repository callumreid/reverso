"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

export interface ScoreDialProps {
  score: number | null;
}

const COUNT_UP_DURATION_MS = 1200;

/**
 * Circular gauge summarizing the round score, counting up on reveal.
 */
export function ScoreDial({ score }: ScoreDialProps) {
  const safeScore = Math.max(0, Math.min(100, score ?? 0));
  const displayed = useCountUp(safeScore);
  const descriptor = getDescriptor(safeScore);
  const gradient = `conic-gradient(from -90deg, rgba(255,79,203,0.9) 0% ${displayed}%, rgba(255,255,255,0.05) ${displayed}% 100%)`;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-panel-alt)] shadow-[var(--shadow-glow-magenta)]">
        <div
          className="absolute inset-3 rounded-full opacity-70"
          style={{ background: gradient }}
          aria-hidden
        />
        <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[rgba(4,1,11,0.85)] text-center">
          <span className="text-xs lowercase tracking-[0.3em] text-[var(--text-secondary)]">Score</span>
          <span className="text-4xl font-bold text-[var(--text-primary)]">{displayed}</span>
          <span className="text-sm text-[var(--text-secondary)]">/ 100</span>
        </div>
        <span className="pointer-events-none absolute inset-4 rounded-full border border-[rgba(255,255,255,0.08)]" />
      </div>
      <p className="mt-4 text-sm font-semibold lowercase tracking-[0.18em] text-[var(--accent-tertiary)]">{descriptor}</p>
    </div>
  );
}

function useCountUp(target: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_UP_DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return value;
}

function getDescriptor(value: number) {
  if (value >= 81) {
    return "Uncanny";
  }
  if (value >= 41) {
    return "Pretty Convincing";
  }
  return "Pure Chaos";
}

export interface MetricChipProps {
  label: string;
  value: number;
  max?: number;
}

export function MetricChip({ label, value, max = 3 }: MetricChipProps) {
  const bars = Array.from({ length: max }, (_, index) => index < value);
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[rgba(12,0,24,0.7)] px-4 py-2 text-xs lowercase tracking-[0.2em] text-[var(--text-secondary)]">
      <span>{label}</span>
      <div className="flex gap-1">
        {bars.map((filled, index) => (
          <span
            key={`${label}-${index}`}
            className={cn(
              "h-2 w-4 rounded-full bg-[rgba(255,255,255,0.08)]",
              filled && "bg-[var(--accent-secondary)]",
            )}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
