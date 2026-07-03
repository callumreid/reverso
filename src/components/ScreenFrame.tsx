import type { ReactNode } from "react";

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
 * Shared layout wrapper for each step, tuned to fit a phone viewport.
 */
export function ScreenFrame({ metaLabel, title, subtitle, ghostText, instructions, children, footer }: ScreenFrameProps) {
  return (
    <section className="relative flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        {ghostText ? (
          <span className="ghost-text" data-direction="reverse" aria-hidden>
            {ghostText}
          </span>
        ) : null}
        <header className="relative z-10 space-y-1">
          <p className="glitchy-label">{metaLabel}</p>
          <h1 className="text-xl font-semibold lowercase tracking-[0.12em] text-[var(--text-primary)]">{title}</h1>
          {subtitle ? <p className="text-base text-[var(--text-secondary)]">{subtitle}</p> : null}
        </header>
      </div>
      <div className="relative flex flex-col gap-4">
        {children}
      </div>
      {instructions ? (
        <div className="text-center text-base text-[var(--text-secondary)]">{instructions}</div>
      ) : null}
      {footer ? <footer>{footer}</footer> : null}
    </section>
  );
}
