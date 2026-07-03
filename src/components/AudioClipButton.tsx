"use client";

import { cn } from "@/utils/cn";

export interface AudioClipButtonProps {
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  auxiliary?: string;
}

/**
 * Disco console row used for clip playback in the results view.
 */
export function AudioClipButton({
  label,
  onClick,
  isActive = false,
  disabled = false,
  auxiliary,
}: AudioClipButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[rgba(10,0,24,0.85)] px-3 py-2 text-left text-base text-[var(--text-primary)] transition",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-secondary)]",
        isActive && "border-[var(--accent-secondary)] shadow-[var(--shadow-glow-cyan)]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] text-sm",
          isActive ? "bg-[rgba(92,242,255,0.15)]" : "bg-transparent",
        )}
      >
        ▶
      </span>
      <div className="flex flex-1 flex-col">
        <span className="font-semibold">{label}</span>
        <span className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
          <span
            className={cn(
              "inline-block h-full w-full origin-left scale-x-0 bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-primary)] transition-transform duration-700",
              isActive && "scale-x-100",
            )}
          />
        </span>
      </div>
      {auxiliary ? (
        <span className="text-xs lowercase tracking-[0.3em] text-[var(--text-secondary)]">{auxiliary}</span>
      ) : null}
    </button>
  );
}
