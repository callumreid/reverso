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

/**
 * Squishy neon record orb with mirrored chrome details.
 */
export function MicButton({
  label = "Tap to record",
  onClick,
  isActive = false,
  disabled = false,
  timer,
}: MicButtonProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        onClick();
      }
    },
    [disabled, onClick],
  );

  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        className={cn(
          "group relative flex h-40 w-40 items-center justify-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-secondary)]",
          disabled ? "cursor-not-allowed opacity-60" : "hover:scale-105 active:scale-95",
        )}
        disabled={disabled}
        aria-pressed={isActive}
        onClick={() => {
          if (!disabled) {
            onClick();
          }
        }}
        onKeyDown={handleKeyDown}
      >
        <span
          className={cn(
            "absolute inset-0 rounded-full border-[3px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,79,203,0.7),rgba(6,0,18,0.95))]",
            "shadow-[0_0_35px_rgba(255,79,203,0.45)]",
            isActive ? "border-[rgba(92,242,255,0.8)]" : "border-[rgba(255,79,203,0.4)]",
          )}
          aria-hidden
        />
        <span
          className={cn(
            "absolute inset-2 rounded-full border border-[rgba(255,255,255,0.15)]",
            isActive && "animate-[pulse_1.4s_ease-in-out_infinite]",
          )}
          aria-hidden
        />
        <span
          className="absolute inset-4 rounded-full bg-[linear-gradient(180deg,#15002c,#080014)] opacity-90"
          aria-hidden
        />
        <span
          className={cn(
            "absolute inset-4 rounded-full border border-dashed border-[rgba(255,255,255,0.12)] transition-all",
            isActive && "border-[rgba(255,228,92,0.8)]",
          )}
          aria-hidden
        />
        <span className="pointer-events-none flex flex-col items-center justify-center gap-1 text-center text-sm font-semibold lowercase tracking-[0.3em]">
          <span>{label}</span>
        </span>
        <span className="orbit-dot" style={{ top: 12, left: "50%" }} aria-hidden />
        <span className="orbit-dot" data-variant="2" style={{ bottom: 18, left: "35%" }} aria-hidden />
        <span className="orbit-dot" data-variant="3" style={{ top: 30, right: "30%" }} aria-hidden />
      </button>
      <div className="mt-4 flex flex-col items-center gap-1">
        <span className="text-[11px] lowercase tracking-[0.3em] text-[var(--text-secondary)]">
          {isActive ? "Press to stop" : "Press to speak"}
        </span>
        {timer && isActive ? (
          <span className="font-mono text-xs text-[var(--accent-secondary)]">{timer}</span>
        ) : null}
      </div>
    </div>
  );
}
