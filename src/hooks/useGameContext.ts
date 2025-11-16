"use client";

import { useContext } from "react";
import GameContext from "@/context/GameContext";
import type { GameContextValue } from "@/types/game";

/**
 * Ensures consumers can read the GameContext with helpful errors.
 */
export function useGameContext() {
  const context = useContext(GameContext) as GameContextValue | undefined;
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
}
