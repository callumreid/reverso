"use client";

import { ScreenLobby } from "@/components/ScreenLobby";
import { ScreenA } from "@/components/ScreenA_SayYourPhrase";
import { ScreenB } from "@/components/ScreenB_ListenBackwards";
import { ScreenC } from "@/components/ScreenC_TryToSayBackwards";
import { ScreenD } from "@/components/ScreenD_Results";
import { useGameContext } from "@/hooks/useGameContext";
import { ReversoShell } from "@/components/layout/ReversoShell";
import type { GameScreen } from "@/types/game";
import { ReactNode } from "react";

const screenComponents: Record<GameScreen, ReactNode> = {
  lobby: <ScreenLobby />,
  input: <ScreenA />,
  listenBackwards: <ScreenB />,
  tryBackwards: <ScreenC />,
  results: <ScreenD />,
};

export function GameExperience() {
  const { state, setError } = useGameContext();

  return (
    <ReversoShell>
        {state.lastError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 mb-4 w-max max-w-[90vw] rounded-2xl border border-[var(--accent-danger)] bg-[#2a001a] px-4 py-3 text-sm text-[#ffb3c1] shadow-lg">
            {state.lastError}
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-3 font-bold text-white underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {screenComponents[state.currentScreen]}
    </ReversoShell>
  );
}
