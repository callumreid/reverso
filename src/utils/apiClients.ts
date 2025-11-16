import { audioBufferToBase64 } from "@/utils/audioConversion";

const API_TIMEOUT_MS = 45_000;

async function withTimeout<T>(promise: Promise<T>) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), API_TIMEOUT_MS);
    }),
  ]);
}

async function postJson<T>(url: string, body: unknown) {
  const response = await withTimeout(
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Request failed (${response.status}): ${detail}`);
  }
  return (await response.json()) as T;
}

export async function transcribeAudioBuffer(buffer: AudioBuffer) {
  const audio = await audioBufferToBase64(buffer);
  const data = await postJson<{ text: string }>("/api/transcribe", {
    audio,
    format: "wav",
  });
  return data.text;
}

export async function scoreAttempt(original: string, mimic: string) {
  const data = await postJson<{ score: number }>("/api/score", {
    originalTranscription: original,
    mimicTranscription: mimic,
  });
  return data.score;
}
