import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type PrimaryButtonVariant = "primary" | "ghost";

export interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PrimaryButtonVariant;
  isCircle?: boolean;
}

/**
 * Neon-pill button styled like a disco console control.
 */
export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(function PrimaryButton(
  { className, variant = "primary", isCircle = false, disabled, children, ...rest },
  ref,
) {
  const baseClasses =
    "relative inline-flex items-center justify-center overflow-hidden font-semibold lowercase tracking-[0.18em] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-secondary)]";
  const radius = isCircle ? "rounded-full" : "rounded-[var(--radius-pill)]";
  const size = isCircle ? "h-14 w-14" : "min-h-[52px] px-8";
  const variantClasses =
    variant === "primary"
      ? "bg-[linear-gradient(135deg,var(--accent-primary),var(--accent-tertiary))] text-[var(--bg-panel)] shadow-[var(--shadow-soft),var(--shadow-glow-magenta)] border border-[rgba(255,255,255,0.25)]"
      : "border border-[rgba(255,255,255,0.25)] text-[var(--text-secondary)] bg-transparent hover:border-[rgba(255,255,255,0.5)]";
  const disabledClasses = disabled
    ? "opacity-40 cursor-not-allowed shadow-none"
    : "hover:scale-[1.02] active:scale-[0.99]";

  return (
    <button
      ref={ref}
      className={cn(baseClasses, radius, size, variantClasses, disabledClasses, className)}
      disabled={disabled}
      {...rest}
    >
      <span className="pointer-events-none">{children}</span>
      <span className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen" />
    </button>
  );
});
