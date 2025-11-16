"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Streams waveform samples from a MediaStream via AnalyserNode.
 */
export function useWaveformAnalyzer(fftSize = 2048) {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const detach = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current?.disconnect();
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current = null;
    setIsActive(false);
  }, []);

  const attach = useCallback(async (stream: MediaStream) => {
    if (typeof window === "undefined") {
      return;
    }
    const audioContext =
      audioContextRef.current ?? new AudioContext({ latencyHint: "interactive" });
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyserRef.current = analyser;
    sourceRef.current = source;
    const buffer = new Float32Array(analyser.fftSize);
    const tick = () => {
      if (!analyserRef.current) {
        return;
      }
      analyserRef.current.getFloatTimeDomainData(buffer);
      setWaveform(Array.from(buffer));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    setIsActive(true);
  }, [fftSize]);

  useEffect(() => {
    return () => {
      detach();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [detach]);

  return { waveform, attach, detach, isActive };
}
