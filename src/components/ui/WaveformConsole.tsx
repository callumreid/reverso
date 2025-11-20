import { useMemo } from "react";
import { cn } from "@/utils/cn";

export interface WaveformConsoleProps {
  samples?: number[];
  comparisonSamples?: number[]; // For comparing player vs original
  label?: string;
  isActive?: boolean;
  isReversed?: boolean;
  onPlay?: () => void;
}

export function WaveformConsole({ 
  samples = [], 
  comparisonSamples,
  label = "WAVEFORM", 
  isActive = true,
  isReversed = false,
  onPlay
}: WaveformConsoleProps) {
  
  const processSamples = (data: number[]) => {
      if (!data?.length) return new Array(40).fill(0.02);
      
      const bucketSize = Math.max(1, Math.floor(data.length / 40));
      const buckets: number[] = [];
      for (let i = 0; i < data.length; i += bucketSize) {
        const slice = data.slice(i, i + bucketSize);
        const peak = slice.reduce((acc, value) => Math.max(acc, Math.abs(value)), 0);
        buckets.push(peak);
      }
      // Ensure we have exactly 40 bars
      return buckets.slice(0, 40);
  };

  const bars = useMemo(() => processSamples(samples), [samples]);
  const comparisonBars = useMemo(() => comparisonSamples ? processSamples(comparisonSamples) : null, [comparisonSamples]);

  // If reversed, flip the bars array visually
  const displayBars = isReversed ? [...bars].reverse() : bars;
  const displayComparisonBars = isReversed && comparisonBars ? [...comparisonBars].reverse() : comparisonBars;

  return (
    <div 
      className={cn(
        "relative flex h-[72px] w-full flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-alt)] p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)] transition-all",
        isActive ? "opacity-100" : "opacity-60",
        onPlay && "cursor-pointer hover:border-[var(--border-strong)]"
      )}
      onClick={onPlay}
    >
      {/* Label */}
      <div className="absolute left-3 top-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
        {label} {isReversed && "• REVERSED"}
      </div>

      {/* Visualizer Area */}
      <div className="flex h-full w-full items-end justify-between gap-[2px] pt-4">
        {displayBars.map((value, index) => (
            <div key={`bar-${index}`} className="relative flex h-full w-full flex-col justify-end">
                {/* Comparison Layer (Background/Underlay) - Cyan */}
                {displayComparisonBars && (
                     <div 
                        className="absolute bottom-0 w-full rounded-full bg-[var(--accent-secondary)] opacity-40 mix-blend-screen transition-all duration-300"
                        style={{ height: `${Math.max(5, displayComparisonBars[index] * 100)}%` }}
                     />
                )}

                {/* Main Layer - Magenta */}
                <div 
                    className={cn(
                        "w-full rounded-full transition-all duration-300",
                        displayComparisonBars ? "bg-[var(--accent-primary)] mix-blend-screen opacity-80" : "bg-gradient-to-t from-[var(--accent-primary)] to-[var(--accent-tertiary)]"
                    )}
                    style={{ height: `${Math.max(5, value * 100)}%` }}
                />
            </div>
        ))}
      </div>
    </div>
  );
}

