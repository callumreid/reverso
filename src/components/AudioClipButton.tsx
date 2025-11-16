"use client";

import { cn } from "@/utils/cn";

export interface AudioClipButtonProps {
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

/**
 * Styled button used for audio playback controls on the results screen.
 */
export function AudioClipButton({
  label,
  onClick,
  isActive = false,
  disabled = false,
}: AudioClipButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full rounded-2xl border border-[#5f2b80] bg-[#170028] px-4 py-3 text-left text-base font-medium text-white transition",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8be9fd]",
        isActive && "border-[#8be9fd] bg-[#240046] shadow-[0_0_15px_rgba(139,233,253,0.4)]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {label}
    </button>
  );
}
