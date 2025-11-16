import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface ScreenFrameProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared layout wrapper for each screen step.
 */
export function ScreenFrame({ title, subtitle, children, footer }: ScreenFrameProps) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-between gap-8 px-4 py-8 text-white">
      <header className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-[#8be9fd]">Reverso</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 text-base text-[#d6bcfa]">{subtitle}</p>
        ) : null}
      </header>
      <div className={cn("flex w-full flex-1 flex-col items-center gap-6", "text-center md:text-left")}>{children}</div>
      {footer ? <footer className="w-full">{footer}</footer> : null}
    </section>
  );
}
