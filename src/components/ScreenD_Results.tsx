"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ReversalTimelineStrip } from "@/components/ui/ReversalTimelineStrip";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { GhostText } from "@/components/ui/GhostText";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { useGameContext } from "@/hooks/useGameContext";
import { Play, Square, Share2, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";

interface ClipConfig {
  id: string;
  label: string;
  subLabel?: string;
  buffer: AudioBuffer | null;
}

export function ScreenD() {
  const { state, nextRound, goToScreen, dispatch } = useGameContext();
  const { play, stop, isPlaying } = useAudioPlayback();
  const [activeClip, setActiveClip] = useState<string | null>(null);
  
  // Generate a score if missing (Mocking the backend scoring for now)
  useEffect(() => {
      if (state.score === null) {
          // Random score 40-95
          const mockScore = Math.floor(Math.random() * 55) + 40;
          dispatch({
              type: "SET_STATE",
              payload: { score: mockScore }
          });
      }
  }, [state.score, dispatch]);

  const clips = useMemo<ClipConfig[]>(
    () => [
      { id: "original-forward", label: "Original", subLabel: "Forward", buffer: state.originalRecording },
      { id: "original-backwards", label: "Original", subLabel: "Backwards", buffer: state.originalBackwardsBuffer },
      { id: "mimic-backwards", label: "Your Mimic", subLabel: "As spoken", buffer: state.mimicRecording },
      { id: "mimic-forward", label: "Your Mimic", subLabel: "Forward result", buffer: state.mimicForwardBuffer },
    ],
    [state.mimicForwardBuffer, state.mimicRecording, state.originalBackwardsBuffer, state.originalRecording],
  );

  const handlePlay = useCallback(
    (clip: ClipConfig) => {
      if (!clip.buffer) return;
      
      // If clicking the active one, stop it
      if (activeClip === clip.id && isPlaying) {
          stop();
        return;
      }

      setActiveClip(clip.id);
      void play(clip.buffer, {
        onEnded: () => {
          setActiveClip(null);
        },
      }).catch(() => {
        setActiveClip(null);
      });
    },
    [play, activeClip, isPlaying, stop],
  );

  const handleNextRound = useCallback(() => {
    stop();
    // Use startRound to reset and go to lobby, or nextRound if context handles it.
    // Context: nextRound -> RESET_ROUND (which resets to lobby in my previous edit)
    nextRound();
    // Ensure we go to lobby (RESET_ROUND sets currentScreen to lobby in my previous edit)
    // But let's be explicit if needed.
  }, [nextRound, stop]);

  const score = state.score ?? 0;
  const scoreLabel = score > 80 ? "PURE CHAOS" : score > 40 ? "UNCANNY" : "PRETTY CONVINCING";
  const scoreColor = score > 80 ? "text-[var(--accent-primary)]" : score > 40 ? "text-[var(--accent-secondary)]" : "text-[var(--accent-tertiary)]";

  return (
    <div className="flex w-full max-w-4xl flex-col gap-8">
      
      {/* Header */}
      <div className="relative text-center py-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Round 01 • Results
        </div>
        <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            How Close Were You?
        </h1>
        <GhostText text="?UOY EREW ESOLC WOH" className="top-1/2 -translate-y-1/2 text-6xl opacity-10" />
      </div>

      {/* Core Content - Split View */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          
          {/* Left Column: Clips */}
          <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-6 shadow-lg">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
                  Audio Evidence
              </h3>
              
              <div className="flex flex-col gap-3">
                  {clips.map((clip) => {
                      const isActive = activeClip === clip.id && isPlaying;
                      return (
                        <button
                            key={clip.id}
                            onClick={() => handlePlay(clip)}
                            disabled={!clip.buffer}
                            className={cn(
                                "group flex items-center justify-between rounded-full border border-[var(--border-subtle)] bg-white/5 p-2 pr-6 transition-all hover:bg-white/10",
                                isActive && "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-[0_0_15px_var(--shadow-glow-magenta)]"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                                    isActive ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white" : "border-white/20 bg-black/20 text-white group-hover:border-white"
                                )}>
                                    {isActive ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <span className={cn("text-sm font-bold uppercase tracking-wide", isActive ? "text-[var(--accent-primary)]" : "text-white")}>
                                        {clip.label}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                                        {clip.subLabel}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Mini visualizer or duration could go here */}
                            {isActive && (
                                <div className="flex gap-0.5">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="h-4 w-1 animate-pulse rounded-full bg-[var(--accent-primary)]" style={{ animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>
                            )}
                        </button>
                      );
                  })}
              </div>
          </div>

          {/* Right Column: Score & Stats */}
          <div className="flex flex-col gap-6">
              
              {/* Score Dial */}
              <div className="relative flex aspect-square w-full max-w-[300px] flex-col items-center justify-center self-center rounded-full border-4 border-[var(--bg-panel)] bg-[var(--bg-panel-alt)] shadow-[var(--shadow-soft)]">
                  {/* Progress Ring (Simplified as conic gradient for now) */}
                  <div 
                    className="absolute inset-0 rounded-full opacity-20" 
                    style={{ backgroundImage: `conic-gradient(var(--accent-primary) ${score}%, transparent ${score}%)` }} 
                  />
                  
                  <div className="flex flex-col items-center z-10">
                      <span className="font-display text-6xl font-black text-white drop-shadow-lg">
                          {score}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                          Out of 100
                      </span>
                  </div>
                  
                  {/* Orbiting Labels */}
                  <div className={cn("absolute -bottom-12 font-display text-xl font-black uppercase tracking-tight", scoreColor)}>
                      {scoreLabel}
                  </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2">
                  {["Rhythm", "Vowels", "Tone"].map((metric) => (
                      <div key={metric} className="flex flex-col items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{metric}</span>
                          <div className="flex gap-1">
                              {[1,2,3].map(bar => (
                                  <div 
                                    key={bar} 
                                    className={cn(
                                        "h-1.5 w-4 rounded-full",
                                        bar <= (Math.floor(score / 33)) ? "bg-[var(--accent-secondary)]" : "bg-white/10"
                                    )} 
                                  />
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
              
              {/* Transcript Comparison */}
              <div className="flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4">
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Original</span>
                      <p className="font-mono text-sm text-[var(--accent-secondary)]">{state.targetPhrase || "Unknown Phrase"}</p>
                  </div>
                   <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">You Said</span>
                      <p className="font-mono text-sm text-[var(--accent-primary)]">{state.mimicTranscription || "..."}</p>
                  </div>
              </div>

          </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col items-center gap-4 mt-4">
          <PrimaryButton 
            fullWidth={false}
            onClick={handleNextRound}
            className="min-w-[200px]"
          >
              Next Round
          </PrimaryButton>
          
          <button className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white">
              <Share2 className="h-4 w-4" />
              Share Result
          </button>
      </div>

    </div>
  );
}
