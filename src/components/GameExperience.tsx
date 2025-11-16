"use client";

import { ScreenA } from "@/components/ScreenA_SayYourPhrase";
import { ScreenB } from "@/components/ScreenB_ListenBackwards";
import { ScreenC } from "@/components/ScreenC_TryToSayBackwards";
import { ScreenD } from "@/components/ScreenD_Results";
import { useGameContext } from "@/hooks/useGameContext";

const screenComponents = {
  input: <ScreenA />,
  listenBackwards: <ScreenB />,
  tryBackwards: <ScreenC />,
  results: <ScreenD />,
} as const;

export function GameExperience() {
  const { state, setError } = useGameContext();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#05010f] via-[#130025] to-[#05010f] px-4 py-8">
      <div className="w-full max-w-4xl rounded-[32px] border border-[#2a0b3d] bg-[#12001f]/80 p-6 shadow-[0_30px_80px_rgba(5,0,20,0.8)] backdrop-blur-xl">
        {state.lastError ? (
          <div className="mb-4 rounded-2xl border border-[#ff5f87] bg-[#2a001a] px-4 py-3 text-sm text-[#ffb3c1]">
            {state.lastError}
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-3 text-[#fffb96] underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        ) : null}
        {screenComponents[state.currentScreen]}
      </div>
    </div>
  );
}
