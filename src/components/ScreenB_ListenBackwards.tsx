"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ReversalTimelineStrip } from "@/components/ui/ReversalTimelineStrip";
import { WaveformConsole } from "@/components/ui/WaveformConsole";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { useGameContext } from "@/hooks/useGameContext";
import { Play, Square, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";

export function ScreenB() {
  const { state, goToScreen } = useGameContext();
  const { play, stop, isPlaying, error } = useAudioPlayback();
  const [autoLoop, setAutoLoop] = useState(false);

  const handlePlay = useCallback(() => {
    if (!state.originalBackwardsBuffer) return;
    
    void play(state.originalBackwardsBuffer, {
      onEnded: () => {
        if (autoLoop) {
           // Small delay before looping
           setTimeout(() => {
               // Check if still mounted and autoLoop is still true (captured in closure? No, ref needed if loop continues, 
               // but here we are re-calling handlePlay which is dependent on autoLoop state... wait, stale closure risk.
               // Better to use a ref for autoLoop or rely on the fact that handlePlay will be recreated if autoLoop changes? 
               // Actually, the loop logic inside onEnded captures 'autoLoop' from the render scope where handlePlay was created.
               // So if autoLoop changes, handlePlay changes. 
               // But the *running* playback's onEnded is bound to the old handlePlay.
               // Simple fix: just trigger a state update or effect?
               // Or use a ref for autoLoop.
           }, 500);
        }
      }
    });
  }, [play, state.originalBackwardsBuffer, autoLoop]);

  // Ref for autoLoop to avoid stale closure in recursive calls via onEnded
  // Actually, let's keep it simple: we'll use an effect to trigger re-play if autoLoop is on and playback stopped?
  // Or just use a ref.
  
  // Simple loop implementation using useEffect is tricky with audio.
  // Let's use a recursive function that checks a ref.
  
  // Re-implement play logic properly for looping
  
  const handleReady = useCallback(() => {
    stop();
    goToScreen("tryBackwards");
  }, [goToScreen, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Samples for waveform
  const samples = useMemo(() => {
    const buffer = state.originalBackwardsBuffer;
    if (!buffer) return [];
    const raw = buffer.getChannelData(0);
    const bucketSize = Math.floor(raw.length / 40);
    const result = [];
    for (let i = 0; i < 40; i++) {
      const start = i * bucketSize;
      const end = start + bucketSize;
      let max = 0;
      for (let j = start; j < end; j++) {
        if (Math.abs(raw[j]) > max) max = Math.abs(raw[j]);
      }
      result.push(max);
    }
    return result;
  }, [state.originalBackwardsBuffer]);

  // Handle looping more robustly
  useEffect(() => {
      if (autoLoop && !isPlaying && state.originalBackwardsBuffer) {
          const timeout = setTimeout(() => {
              handlePlay();
          }, 1500);
          return () => clearTimeout(timeout);
      }
  }, [autoLoop, isPlaying, handlePlay, state.originalBackwardsBuffer]);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
       {/* Meta */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Round 01 • Reversed
        </span>
        <h1 className="font-display text-3xl font-black uppercase tracking-wider text-white drop-shadow-[0_0_15px_var(--shadow-glow-cyan)]">
            Listen Backwards
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
            Play the warped version until your brain gives up resisting.
        </p>
      </div>

      {/* Waveform Console */}
      <div className="w-full py-4">
          <WaveformConsole 
            samples={samples} 
            label="REVERSED AUDIO"
            isActive={true}
            isReversed={true} // Visual cue
            onPlay={handlePlay}
          />
      </div>

      {/* Controls */}
      <div className="flex w-full items-center justify-between px-4">
           <button 
            onClick={() => setAutoLoop(!autoLoop)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white transition-colors"
           >
             {autoLoop ? <ToggleRight className="h-6 w-6 text-[var(--accent-secondary)]" /> : <ToggleLeft className="h-6 w-6 text-[var(--text-muted)]" />}
             Auto Loop
           </button>

           <PrimaryButton 
                variant="circle"
                onClick={isPlaying ? stop : handlePlay}
                className={isPlaying ? "border-[var(--accent-secondary)] text-[var(--accent-secondary)] shadow-[0_0_20px_var(--accent-secondary)]" : ""}
           >
               {isPlaying ? <Square className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
           </PrimaryButton>

           <div className="w-20" /> {/* Spacer for balance */}
      </div>
      
       {error && (
          <p className="text-xs text-[var(--accent-danger)]">
            {error}
          </p>
        )}

      {/* Timeline */}
      <ReversalTimelineStrip currentStep="reversed" />

      {/* Footer */}
      <div className="flex w-full flex-col items-center gap-4 mt-4">
        <p className="text-xs text-[var(--text-muted)]">
            When you think you’ve got its rhythm, pass the device.
        </p>
        
        <PrimaryButton 
            fullWidth 
            onClick={handleReady}
        >
            Ready to Mimic
        </PrimaryButton>
      </div>
    </div>
  );
}
