import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "pill" | "circle" | "ghost";
  fullWidth?: boolean;
}

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, variant = "pill", fullWidth = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "group relative flex items-center justify-center overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-secondary)] disabled:cursor-not-allowed disabled:opacity-50",
          
          // Variants
          variant === "pill" && [
            "h-[52px] rounded-full border border-white/25 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-tertiary)]",
            "text-[13px] font-bold uppercase tracking-wider text-black shadow-[var(--shadow-soft)]",
            "hover:scale-105 hover:border-white/50 hover:shadow-[var(--shadow-glow-magenta)]",
            "active:scale-95"
          ],
          
          variant === "circle" && [
             "h-14 w-14 rounded-full border border-white/20 bg-[var(--bg-panel-alt)] text-white",
             "hover:border-[var(--accent-primary)] hover:bg-[var(--bg-panel)] hover:text-[var(--accent-primary)] hover:shadow-[var(--shadow-glow-magenta)]",
             "active:scale-90"
          ],

           variant === "ghost" && [
            "h-[40px] rounded-full border border-transparent bg-transparent text-[var(--text-secondary)]",
            "hover:bg-white/5 hover:text-white",
            "active:scale-95"
          ],

          fullWidth ? "w-full" : "w-auto px-8",
          className
        )}
        {...props}
      >
         {/* Noise overlay for pill variant */}
        {variant === "pill" && (
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-overlay pointer-events-none" />
        )}
        
        <span className="relative z-10 flex items-center gap-2">
            {children}
        </span>
      </button>
    );
  }
);

PrimaryButton.displayName = "PrimaryButton";

