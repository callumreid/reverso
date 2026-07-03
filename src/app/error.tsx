"use client";

import { useEffect } from "react";
import { logError } from "@/utils/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("Unhandled render error", error);
  }, [error]);

  return (
    <div className="reverso-shell">
      <div className="reverso-panel">
        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <p className="text-xs font-semibold lowercase tracking-[0.4em] text-[var(--accent-secondary)]">
            Reverso
          </p>
          <h1 className="text-2xl font-semibold lowercase tracking-[0.12em] text-[var(--text-primary)]">
            the tape jammed
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Something glitched on our side. Your round is lost to the void, but a fresh one
            is one tap away.
          </p>
          <button
            type="button"
            onClick={reset}
            className="min-h-[52px] rounded-[var(--radius-pill)] border border-[rgba(255,255,255,0.25)] bg-[linear-gradient(135deg,var(--accent-primary),var(--accent-tertiary))] px-8 font-semibold lowercase tracking-[0.18em] text-[var(--bg-panel)]"
          >
            rewind and retry
          </button>
        </div>
      </div>
    </div>
  );
}
