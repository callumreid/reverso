import { cn } from "@/utils/cn";
import { useCallback, useEffect, useState } from "react";

interface RecordOrbProps {
  isRecording: boolean;
  isProcessing?: boolean;
  onClick: () => void;
  disabled?: boolean;
  amplitude?: number; // 0 to 1
}

export function RecordOrb({ isRecording, isProcessing, onClick, disabled, amplitude = 0 }: RecordOrbProps) {
  const [localAmplitude, setLocalAmplitude] = useState(0);

  // Smooth out amplitude updates for visual effect
  useEffect(() => {
    if (isRecording) {
      setLocalAmplitude(amplitude);
    } else {
      setLocalAmplitude(0);
    }
  }, [amplitude, isRecording]);

  const scale = 1 + localAmplitude * 0.5; // Scale up to 1.5x

  return (
    <div className="relative flex h-[200px] w-[200px] items-center justify-center">
      {/* Outer orbiting ring */}
      <div 
        className={cn(
            "absolute inset-0 rounded-full border-[2px] border-transparent border-t-[var(--accent-secondary)] border-r-[var(--accent-primary)] opacity-60",
            "animate-[spin-slow_10s_linear_infinite]",
             disabled && "border-dashed border-white/20"
        )} 
      />
      
      {/* Recording pulses */}
      {isRecording && (
         <>
            <div className="absolute inset-0 animate-ping rounded-full bg-[var(--accent-primary)] opacity-20" />
            <div 
                className="absolute inset-0 rounded-full border border-[var(--accent-primary)] opacity-40 transition-transform duration-75"
                style={{ transform: `scale(${1 + localAmplitude})` }}
            />
         </>
      )}

      {/* Main Orb */}
      <button
        onClick={onClick}
        disabled={disabled || isProcessing}
        className={cn(
          "relative z-10 flex h-[160px] w-[160px] items-center justify-center rounded-full border-[4px] transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-secondary)]",
          
          // Default / Idle
          !isRecording && !disabled && "border-[var(--accent-primary)] bg-[#15002c] shadow-[var(--shadow-glow-magenta)] hover:scale-105",
          
          // Recording
          isRecording && "border-[var(--accent-danger)] bg-[#2a0015] shadow-[0_0_60px_var(--accent-danger)]",
          
          // Disabled / Processing
          (disabled || isProcessing) && "cursor-not-allowed border-[var(--border-subtle)] bg-[var(--bg-panel)] opacity-60 grayscale"
        )}
      >
         {/* Inner content */}
         <div className="flex flex-col items-center gap-2 text-center">
             {isProcessing ? (
                 <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
             ) : (
                <>
                    <span className={cn(
                        "text-sm font-bold uppercase tracking-widest",
                        isRecording ? "text-[var(--accent-danger)] animate-pulse" : "text-white"
                    )}>
                        {isRecording ? "Stop" : "Start"}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        {isRecording ? "Recording" : "Tap to Record"}
                    </span>
                </>
             )}
         </div>
      </button>

       {/* Keyboard Hint */}
       <div className="absolute -bottom-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
        Space to toggle
       </div>
    </div>
  );
}

