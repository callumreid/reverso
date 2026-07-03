import { audioBufferToBase64 } from "@/utils/audioConversion";

const API_TIMEOUT_MS = 45_000;

async function postJson<T>(url: string, body: unknown) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Request failed (${response.status}): ${detail}`);
    }
    return (await response.json()) as T;
  } catch (requestError) {
    if (requestError instanceof DOMException && requestError.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw requestError;
  } finally {
    clearTimeout(timeout);
  }
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
