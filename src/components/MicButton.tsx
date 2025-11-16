"use client";

import { useCallback, type KeyboardEvent } from "react";
import { cn } from "@/utils/cn";

export interface MicButtonProps {
  label?: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

/**
 * Toggle-style microphone control with keyboard + pointer support.
 */
export function MicButton({
  label = "Tap to record",
  onClick,
  isActive = false,
  disabled = false,
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
    <button
      type="button"
      className={cn(
        "group relative h-40 w-40 select-none rounded-full border-4 border-[#f489ff] bg-gradient-to-br from-[#1b0025] to-[#42005b] text-white transition-all",
        "shadow-[0_0_20px_rgba(244,137,255,0.6)]",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8be9fd]",
        {
          "opacity-50 cursor-not-allowed": disabled,
          "scale-95": disabled,
          "animate-pulse border-[#8be9fd] shadow-[0_0_25px_rgba(139,233,253,0.8)]": isActive && !disabled,
        },
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
      <span className="pointer-events-none text-center text-lg font-semibold uppercase tracking-wide">
        {label}
      </span>
      <span
        className={cn(
          "pointer-events-none absolute inset-1 rounded-full border-2 border-dashed border-transparent transition-colors",
          isActive && !disabled ? "border-[#fffb96]" : "border-[#5f2b80]",
        )}
      />
      <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-[#d6bcfa]">
        Space to toggle
      </span>
    </button>
  );
}
