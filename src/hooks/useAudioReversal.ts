"use client";

import { useCallback, useState } from "react";
import { reverseAudioBuffer } from "@/utils/audioProcessor";
import { logError } from "@/utils/logger";

/**
 * Handles audio reversal operations and exposes async helpers.
 */
export function useAudioReversal() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reverse = useCallback(async (buffer: AudioBuffer) => {
    setIsProcessing(true);
    setError(null);
    try {
      return reverseAudioBuffer(buffer);
    } catch (reversalError) {
      const message =
        reversalError instanceof Error ? reversalError.message : "Unable to reverse audio.";
      setError(message);
      logError("Reverse failed", reversalError);
      throw reversalError;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return { reverse, isProcessing, error, resetError };
}
