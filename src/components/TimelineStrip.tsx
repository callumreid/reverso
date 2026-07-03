import { cn } from "@/utils/cn";

export const timelineSteps = [
  { id: "original", label: "Say", icon: "play" },
  { id: "reversed", label: "Hear", icon: "rewind" },
  { id: "mimic", label: "Mimic", icon: "mic" },
  { id: "forward", label: "Reveal", icon: "spark" },
] as const;

export type TimelineStepId = (typeof timelineSteps)[number]["id"];

export type TimelineNodeStatus = "inactive" | "current" | "completed";

export interface TimelineNode {
  id: TimelineStepId;
  label: string;
  status: TimelineNodeStatus;
}

export interface TimelineStripProps {
  nodes: TimelineNode[];
}

function StepIcon({ type }: { type: string }) {
  if (type === "rewind") {
    return (
      <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M7 12L3 8L7 4V12ZM13 12L9 8L13 4V12Z"
          fill="currentColor"
          opacity={0.9}
        />
      </svg>
    );
  }
  if (type === "mic") {
    return (
      <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 11.5C6.62 11.5 5.5 10.38 5.5 9V4C5.5 2.62 6.62 1.5 8 1.5C9.38 1.5 10.5 2.62 10.5 4V9C10.5 10.38 9.38 11.5 8 11.5ZM12.5 9C12.5 11.21 10.71 13 8.5 13H7.5C5.29 13 3.5 11.21 3.5 9H4.75C4.75 10.52 6.03 11.75 7.55 11.75H8.45C9.97 11.75 11.25 10.52 11.25 9H12.5ZM8.75 13.75V15H7.25V13.75H8.75Z"
          fill="currentColor"
          opacity={0.9}
        />
      </svg>
    );
  }
  if (type === "spark") {
    return (
      <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 1L9.2 4.6L12.8 5.8L9.2 7L8 10.6L6.8 7L3.2 5.8L6.8 4.6L8 1ZM11 9.4L11.6 11.2L13.4 11.8L11.6 12.4L11 14.2L10.4 12.4L8.6 11.8L10.4 11.2L11 9.4ZM5 9.4L5.6 11.2L7.4 11.8L5.6 12.4L5 14.2L4.4 12.4L2.6 11.8L4.4 11.2L5 9.4Z"
          fill="currentColor"
          opacity={0.9}
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 2H6L11 8L6 14H3L8 8L3 2Z" fill="currentColor" opacity={0.9} />
    </svg>
  );
}

export function TimelineStrip({ nodes }: TimelineStripProps) {
  return (
    <div className="relative flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {nodes.map((node, index) => {
        const connector = index < nodes.length - 1;
        const statusClasses = {
          current:
            "border-[3px] border-[var(--accent-secondary)] bg-[rgba(92,242,255,0.18)] text-[var(--text-primary)] shadow-[0_0_22px_rgba(92,242,255,0.55)] scale-110",
          completed:
            "bg-[rgba(255,79,203,0.3)] text-[var(--accent-primary)] border border-[rgba(255,79,203,0.35)]",
          inactive: "bg-transparent text-[var(--text-muted)] border border-[rgba(255,255,255,0.15)] opacity-60",
        } as const;
        const connectorClasses = cn(
          "flex-1 h-1.5 rounded-full transition-all",
          node.status === "completed"
            ? "bg-gradient-to-r from-[rgba(255,79,203,0.7)] to-[rgba(92,242,255,0.7)]"
            : "bg-[rgba(255,255,255,0.12)]",
        );

        return (
          <div key={node.id} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300",
                  statusClasses[node.status],
                  node.status === "current" && "animate-[pulse_2.4s_ease-in-out_infinite]",
                )}
              >
                <StepIcon type={timelineSteps[index].icon} />
              </div>
              <p
                className={cn(
                  "text-xs lowercase tracking-[0.12em]",
                  node.status === "current"
                    ? "font-bold text-[var(--accent-secondary)]"
                    : "font-semibold text-[var(--text-secondary)]",
                )}
              >
                {node.label}
              </p>
            </div>
            {connector ? <div className={connectorClasses} aria-hidden /> : null}
          </div>
        );
      })}
    </div>
  );
}
