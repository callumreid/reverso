import { useEffect } from "react";

const shouldIgnoreTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") {
    return true;
  }
  return target.isContentEditable;
};

export function useSpacebarToggle(handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return () => undefined;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) {
        return;
      }
      if (shouldIgnoreTarget(event.target)) {
        return;
      }
      event.preventDefault();
      handler();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handler]);
}
