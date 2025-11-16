"use client";

import { useMemo } from "react";
import { cn } from "@/utils/cn";

export interface WaveformVisualizerProps {
  samples: number[];
  isActive?: boolean;
}

/**
 * Retro-styled waveform made of vertical neon bars.
 */
export function WaveformVisualizer({ samples, isActive = false }: WaveformVisualizerProps) {
  const bars = useMemo(() => {
    if (!samples?.length) {
      return new Array(24).fill(0.05);
    }
    const bucketSize = Math.max(1, Math.floor(samples.length / 32));
    const buckets: number[] = [];
    for (let i = 0; i < samples.length; i += bucketSize) {
      const slice = samples.slice(i, i + bucketSize);
      const peak = slice.reduce((acc, value) => Math.max(acc, Math.abs(value)), 0);
      buckets.push(peak);
    }
    return buckets.slice(0, 32);
  }, [samples]);

  return (
    <div
      className={cn(
        "flex h-32 w-full max-w-xl items-end justify-between rounded-3xl border border-[#5f2b80] bg-[#140018]/80 p-4 transition-opacity",
        isActive ? "opacity-100" : "opacity-40",
      )}
      aria-hidden="true"
    >
      {bars.map((value, index) => (
        <span
          key={`bar-${index}`}
          className="mx-[1px] w-1 rounded-full bg-gradient-to-b from-[#f489ff] to-[#8be9fd]"
          style={{ height: `${Math.max(10, value * 100)}%` }}
        />
      ))}
    </div>
  );
}
