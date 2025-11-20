import { cn } from "@/utils/cn";

interface GhostTextProps {
  text: string;
  className?: string;
}

export function GhostText({ text, className }: GhostTextProps) {
  return (
    <div 
      className={cn(
        "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-8xl font-bold uppercase text-[var(--text-ghost)]/10 blur-sm",
        "scale-y-[-1] select-none", 
        className
      )}
      aria-hidden="true"
    >
      {text}
    </div>
  );
}

