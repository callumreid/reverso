import { useMemo } from "react";
import { cn } from "@/utils/cn";

export type WaveformPalette = "magenta" | "cyan" | "dual";

export interface WaveformConsoleProps {
  label: string;
  samples?: number[];
  overlaySamples?: number[];
  palette?: WaveformPalette;
  isActive?: boolean;
  caption?: string;
  compact?: boolean;
}

/**
 * Physical-feeling waveform deck with layered neon bars.
 */
export function WaveformConsole({
  label,
  samples = [],
  overlaySamples = [],
  palette = "magenta",
  isActive = false,
  caption,
  compact = false,
}: WaveformConsoleProps) {
  const primaryBars = useMemo(() => buildBars(samples), [samples]);
  const overlayBars = useMemo(() => buildBars(overlaySamples), [overlaySamples]);
  const paletteClass =
    palette === "cyan"
      ? "from-[rgba(92,242,255,0.85)] to-[rgba(92,242,255,0.3)]"
      : palette === "dual"
        ? "from-[rgba(92,242,255,0.8)] via-[rgba(255,79,203,0.8)] to-[rgba(255,228,92,0.6)]"
        : "from-[rgba(255,79,203,0.85)] to-[rgba(255,79,203,0.3)]";

  if (compact) {
    return (
      <div className="flex w-full flex-col items-center gap-1">
        <div
          className={cn(
            "flex h-10 w-full items-end gap-[2px] px-1 transition-opacity",
            isActive ? "opacity-100" : "opacity-70",
          )}
          aria-hidden
        >
          {primaryBars.map((value, index) => (
            <span
              key={`bar-${index}`}
              className={cn("w-full min-w-[2px] flex-1 rounded-full bg-gradient-to-b", paletteClass)}
              style={{ height: `${Math.max(8, value * 100)}%` }}
            />
          ))}
        </div>
        {caption ? (
          <p className="text-xs lowercase tracking-[0.2em] text-[var(--text-muted)]">{caption}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-panel-alt)]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        isActive ? "ring-2 ring-[rgba(255,79,203,0.4)]" : "opacity-90",
      )}
    >
      <div className="flex items-center justify-between text-[11px] lowercase tracking-[0.3em] text-[var(--text-secondary)]">
        <span>{label}</span>
        <span className="opacity-60" aria-hidden>
          {label.split("").reverse().join("")}
        </span>
      </div>
      <div className="relative mt-3 flex h-20 items-end gap-[2px] rounded-[var(--radius-md)] bg-[rgba(2,0,10,0.8)] px-3 py-4">
        {primaryBars.map((value, index) => (
          <span
            key={`primary-${index}`}
            className={cn("h-full w-[2px] rounded-full bg-gradient-to-b", paletteClass)}
            style={{ height: `${Math.max(10, value * 100)}%` }}
            aria-hidden
          />
        ))}
        {overlayBars.length
          ? overlayBars.map((value, index) => (
              <span
                key={`overlay-${index}`}
                className="absolute bottom-4 h-16 w-[2px] rounded-full bg-[rgba(92,242,255,0.6)] mix-blend-screen opacity-40"
                style={{
                  left: `${18 + index * 4}px`,
                  height: `${Math.max(8, value * 100)}%`,
                }}
                aria-hidden
              />
            ))
          : null}
        <span className="pointer-events-none absolute inset-0 rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.08)]" />
      </div>
      {caption ? <p className="mt-3 text-xs text-[var(--text-secondary)]">{caption}</p> : null}
    </div>
  );
}

function buildBars(values: number[]) {
  if (!values?.length) {
    return new Array(48).fill(0.05);
  }
  const bucketSize = Math.max(1, Math.floor(values.length / 48));
  const buckets: number[] = [];
  for (let i = 0; i < values.length; i += bucketSize) {
    const slice = values.slice(i, i + bucketSize);
    const peak = slice.reduce((acc, value) => Math.max(acc, Math.abs(value)), 0);
    buckets.push(peak);
  }
  return buckets.slice(0, 48);
}
