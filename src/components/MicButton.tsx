"use client";

import { useCallback, type KeyboardEvent } from "react";
import { cn } from "@/utils/cn";

export interface MicButtonProps {
  label?: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  timer?: string;
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 11.5C6.62 11.5 5.5 10.38 5.5 9V4C5.5 2.62 6.62 1.5 8 1.5C9.38 1.5 10.5 2.62 10.5 4V9C10.5 10.38 9.38 11.5 8 11.5ZM12.5 9C12.5 11.21 10.71 13 8.5 13H7.5C5.29 13 3.5 11.21 3.5 9H4.75C4.75 10.52 6.03 11.75 7.55 11.75H8.45C9.97 11.75 11.25 10.52 11.25 9H12.5ZM8.75 13.75V15H7.25V13.75H8.75Z"
        fill={active ? "var(--accent-danger)" : "var(--accent-secondary)"}
      />
    </svg>
  );
}

/**
 * Vinyl-record mic orb — the one obvious thing to tap on a recording screen.
 */
export function MicButton({
  label = "Tap to record",
  onClick,
  isActive = false,
  disabled = false,
  timer,
}: MicButtonProps) {
  const handleActivate = useCallback(() => {
    if (disabled) {
      return;
    }
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(30);
    }
    onClick();
  }, [disabled, onClick]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        handleActivate();
      }
    },
    [disabled, handleActivate],
  );

  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        className={cn(
          "group relative flex h-44 w-44 items-center justify-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-secondary)]",
          disabled ? "cursor-not-allowed opacity-60" : "hover:scale-105 active:scale-95",
          !disabled && !isActive && "animate-[pulse_2.6s_ease-in-out_infinite]",
        )}
        disabled={disabled}
        aria-pressed={isActive}
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
      >
        <span
          className={cn(
            "absolute inset-0 rounded-full border-[3px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,79,203,0.7),rgba(28,17,58,0.95))]",
            "shadow-[0_0_35px_rgba(255,79,203,0.45)]",
            isActive ? "border-[rgba(92,242,255,0.8)]" : "border-[rgba(255,79,203,0.4)]",
          )}
          aria-hidden
        />
        <span
          className={cn(
            "vinyl-disc absolute inset-4 rounded-full opacity-95",
            isActive && "vinyl-spinning",
          )}
          aria-hidden
        />
        <span
          className={cn(
            "absolute inset-4 rounded-full border border-dashed border-[rgba(255,255,255,0.12)] transition-all",
            isActive && "border-[rgba(255,228,92,0.8)]",
          )}
          aria-hidden
        />
        <span className="pointer-events-none relative z-10 flex flex-col items-center justify-center gap-1.5 rounded-full bg-[rgba(24,14,52,0.5)] px-5 py-4 text-center">
          <MicIcon active={isActive} />
          <span className="text-base font-bold lowercase tracking-[0.1em] text-[var(--text-primary)]">
            {label}
          </span>
          {isActive && timer ? (
            <span className="font-mono text-sm text-[var(--accent-secondary)]" aria-live="polite">
              {timer} / 0:10
            </span>
          ) : (
            <span className="text-xs lowercase tracking-[0.15em] text-[var(--text-secondary)]">
              up to 10s
            </span>
          )}
        </span>
        <span className="orbit-dot" style={{ top: 12, left: "50%" }} aria-hidden />
        <span className="orbit-dot" data-variant="2" style={{ bottom: 18, left: "35%" }} aria-hidden />
        <span className="orbit-dot" data-variant="3" style={{ top: 30, right: "30%" }} aria-hidden />
      </button>
    </div>
  );
}
