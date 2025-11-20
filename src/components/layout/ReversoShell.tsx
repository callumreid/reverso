import type { ReactNode } from "react";
import { BackgroundBeams } from "@/components/layout/BackgroundBeams";
import { cn } from "@/utils/cn";

interface ReversoShellProps {
  children: ReactNode;
  className?: string;
}

export function ReversoShell({ children, className }: ReversoShellProps) {
  return (
    <main className={cn("relative flex min-h-screen flex-col items-center overflow-hidden bg-[var(--bg-void)] text-[var(--text-primary)]", className)}>
      <BackgroundBeams />
      
      <div className="relative z-10 flex w-full flex-1 flex-col items-center p-4 md:p-8">
        {children}
      </div>
    </main>
  );
}

