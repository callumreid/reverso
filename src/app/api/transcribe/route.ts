import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface TranscribeRequestBody {
  audio?: string;
  format?: string;
}

const MAX_AUDIO_BASE64_CHARS = 3_000_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const ALLOWED_FORMATS = new Set(["wav", "webm", "mp4", "ogg"]);

const requestLog = new Map<string, number[]>();

/**
 * Best-effort per-instance rate limit. Serverless instances don't share this
 * map, so it bounds abuse per warm lambda rather than globally — enough to
 * stop a naive loop from burning the OpenAI budget.
 */
function isRateLimited(clientKey: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (requestLog.get(clientKey) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(clientKey, timestamps);
    return true;
  }
  timestamps.push(now);
  requestLog.set(clientKey, timestamps);
  if (requestLog.size > 10_000) {
    requestLog.clear();
  }
  return false;
}

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) {
    return true;
  }
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "reverso.lol" ||
      hostname === "www.reverso.lol" ||
      hostname.endsWith(".vercel.app") ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
    }
    const clientKey =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(clientKey)) {
      return NextResponse.json(
        { error: "Too many requests. Catch your breath and try again in a minute." },
        { status: 429 },
      );
    }
    let body: TranscribeRequestBody;
    try {
      body = (await request.json()) as TranscribeRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (!body.audio) {
      return NextResponse.json({ error: "Missing audio payload" }, { status: 400 });
    }
    if (body.audio.length > MAX_AUDIO_BASE64_CHARS) {
      return NextResponse.json({ error: "Audio payload too large" }, { status: 413 });
    }
    const format = body.format && ALLOWED_FORMATS.has(body.format) ? body.format : "wav";
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Transcription is not configured" },
        { status: 503 },
      );
    }
    const audioBuffer = Buffer.from(body.audio, "base64");
    const blob = new Blob([audioBuffer], { type: `audio/${format}` });
    const formData = new FormData();
    formData.append("file", blob, `recording.${format}`);
    formData.append("model", "whisper-1");
    formData.append("response_format", "json");
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(40_000),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[Reverso] Whisper request failed", response.status, errorText.slice(0, 500));
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }
    const data = (await response.json()) as { text?: string };
    return NextResponse.json({ text: data.text ?? "" });
  } catch (error) {
    console.error("[Reverso] Transcribe route error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
