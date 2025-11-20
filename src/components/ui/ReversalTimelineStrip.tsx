import { cn } from "@/utils/cn";
import { Check, Mic, Play, Rewind, Sparkles } from "lucide-react";

export type TimelineStep = "original" | "reversed" | "mimic" | "result";

interface ReversalTimelineStripProps {
  currentStep: TimelineStep;
}

export function ReversalTimelineStrip({ currentStep }: ReversalTimelineStripProps) {
  const steps: { id: TimelineStep; label: string; icon: React.ElementType }[] = [
    { id: "original", label: "ORIGINAL", icon: Mic },
    { id: "reversed", label: "REVERSED", icon: Rewind },
    { id: "mimic", label: "YOUR BACKWARDS", icon: Play },
    { id: "result", label: "YOUR FORWARD", icon: Sparkles },
  ];

  const getCurrentIndex = () => steps.findIndex((s) => s.id === currentStep);
  const currentIndex = getCurrentIndex();

  return (
    <div className="relative mx-auto mb-8 mt-4 flex w-full max-w-[360px] items-center justify-between rounded-full border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-4 py-3 shadow-lg">
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isUpcoming = index > currentIndex;

        const Icon = step.icon;

        return (
          <div key={step.id} className="relative flex flex-col items-center justify-center">
             {/* Connector Line (except for first item) */}
            {index > 0 && (
              <div 
                className={cn(
                  "absolute right-[140%] top-1/2 h-[2px] w-[40px] -translate-y-1/2 transform transition-colors duration-500",
                   isCompleted || isCurrent ? "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]" : "bg-[var(--border-subtle)]"
                )} 
              />
            )}

            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                isCurrent && "scale-110 bg-[var(--accent-primary)] text-white shadow-[var(--shadow-glow-magenta)]",
                isCompleted && "bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]",
                isUpcoming && "border border-[var(--border-subtle)] text-[var(--text-muted)]"
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            
            {/* Label - Only show for current step on mobile to save space, or show simplified */}
            <span className={cn(
                "absolute -bottom-5 text-[9px] font-bold uppercase tracking-wider transition-opacity duration-300 whitespace-nowrap",
                isCurrent ? "opacity-100 text-[var(--accent-primary)]" : "opacity-0"
            )}>
                {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

