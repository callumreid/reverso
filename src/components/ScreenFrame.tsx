import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface ScreenFrameProps {
  metaLabel: string;
  title: string;
  subtitle?: string;
  ghostText?: string;
  instructions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared layout wrapper for each step with mirrored typography.
 */
export function ScreenFrame({ metaLabel, title, subtitle, ghostText, instructions, children, footer }: ScreenFrameProps) {
  const mirroredTitle = title.toLowerCase().split("").reverse().join("");
  return (
    <section className="relative flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[rgba(8,0,23,0.85)] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        {ghostText ? (
          <span className="ghost-text" data-direction="reverse" aria-hidden>
            {ghostText}
          </span>
        ) : null}
        <header className="relative z-10 space-y-2">
          <p className="glitchy-label">{metaLabel}</p>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold lowercase tracking-[0.12em] text-[var(--text-primary)]">{title}</h1>
            <span className="text-[10px] lowercase tracking-[0.4em] text-[var(--text-ghost)]" aria-hidden>
              {mirroredTitle}
            </span>
          </div>
          {subtitle ? <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
        </header>
      </div>
      <div className={cn("relative flex flex-col gap-5 rounded-[var(--radius-lg)] bg-[rgba(4,1,11,0.7)] p-5")}>
        {children}
      </div>
      {instructions ? (
        <div className="rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.05)] bg-[rgba(6,0,18,0.8)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          {instructions}
        </div>
      ) : null}
      {footer ? <footer className="mt-2">{footer}</footer> : null}
    </section>
  );
}
