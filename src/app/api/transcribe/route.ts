import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface TranscribeRequestBody {
  audio?: string;
  format?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranscribeRequestBody;
    if (!body.audio) {
      return NextResponse.json({ error: "Missing audio payload" }, { status: 400 });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 500 });
    }
    const audioBuffer = Buffer.from(body.audio, "base64");
    const blob = new Blob([audioBuffer], {
      type: body.format ? `audio/${body.format}` : "audio/wav",
    });
    const formData = new FormData();
    formData.append("file", blob, `recording.${body.format ?? "wav"}`);
    formData.append("model", "whisper-1");
    formData.append("response_format", "json");
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Transcription failed", detail: errorText },
        { status: response.status },
      );
    }
    const data = await response.json();
    return NextResponse.json({ text: data.text ?? "" });
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
