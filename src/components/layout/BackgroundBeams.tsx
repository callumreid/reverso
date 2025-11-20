export function BackgroundBeams() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-[20%] left-[20%] h-[80vh] w-[60vw] -rotate-12 bg-gradient-to-b from-[var(--accent-primary)]/20 to-transparent blur-[100px]" />
      <div className="absolute -bottom-[20%] right-[20%] h-[80vh] w-[60vw] rotate-12 bg-gradient-to-t from-[var(--accent-secondary)]/20 to-transparent blur-[100px]" />
    </div>
  );
}

