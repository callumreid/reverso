import { useMemo } from "react";
import { cn } from "@/utils/cn";

export interface PhraseDiffCardProps {
  original?: string | null;
  mimic?: string | null;
}

/**
 * Displays the original phrase vs the mimic with diff-style emphasis.
 */
export function PhraseDiffCard({ original, mimic }: PhraseDiffCardProps) {
  const diff = useMemo(() => buildDiff(original ?? "", mimic ?? ""), [original, mimic]);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[rgba(6,0,18,0.8)] p-4 text-sm">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs lowercase tracking-[0.3em] text-[var(--text-secondary)]">Original</p>
          <p className="mt-1 text-[var(--text-primary)]">{diff.original}</p>
        </div>
        <div>
          <p className="text-xs lowercase tracking-[0.3em] text-[var(--text-secondary)]">You Said</p>
          <p className="mt-1 text-[var(--text-primary)]">{diff.mimic}</p>
        </div>
      </div>
    </div>
  );
}

function buildDiff(original: string, mimic: string) {
  return {
    original: renderSegments(original, mimic),
    mimic: renderSegments(mimic, original),
  };
}

function renderSegments(text: string, reference: string) {
  if (!text) {
    return <span className="text-[var(--text-muted)]">…</span>;
  }
  const maxLen = Math.max(text.length, reference.length);
  const segments: Array<{ text: string; mismatch: boolean }> = [];
  let buffer = "";
  let mismatch = false;

  for (let i = 0; i < maxLen; i += 1) {
    const char = text[i];
    const ref = reference[i];
    const nextMismatch = char ? (ref ? char.localeCompare(ref, undefined, { sensitivity: "base" }) !== 0 : true) : false;
    if (char === undefined) {
      continue;
    }
    if (nextMismatch !== mismatch && buffer) {
      segments.push({ text: buffer, mismatch });
      buffer = "";
    }
    buffer += char;
    mismatch = nextMismatch;
  }

  if (buffer) {
    segments.push({ text: buffer, mismatch });
  }

  return segments.map((segment, index) => (
    <span
      key={`${segment.text}-${index}`}
      className={segment.mismatch ? "text-[var(--accent-danger)]" : undefined}
    >
      {segment.text}
    </span>
  ));
}
