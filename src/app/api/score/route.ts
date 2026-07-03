import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ScoreRequestBody {
  originalTranscription?: string;
  mimicTranscription?: string;
}

const normalize = (value: string | undefined) =>
  value
    ?.toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim() ?? "";

const levenshtein = (a: string, b: string) => {
  if (a === b) {
    return 0;
  }
  const matrix = Array.from({ length: b.length + 1 }, () => new Array(a.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= b.length; j += 1) {
    matrix[j][0] = j;
  }
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      if (b[j - 1] === a[i - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const MAX_TRANSCRIPTION_CHARS = 2_000;

export async function POST(request: Request) {
  try {
    let body: ScoreRequestBody;
    try {
      body = (await request.json()) as ScoreRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (
      (body.originalTranscription?.length ?? 0) > MAX_TRANSCRIPTION_CHARS ||
      (body.mimicTranscription?.length ?? 0) > MAX_TRANSCRIPTION_CHARS
    ) {
      return NextResponse.json({ error: "Transcription too long" }, { status: 413 });
    }
    const original = normalize(body.originalTranscription);
    const mimic = normalize(body.mimicTranscription);
    if (!original.length || !mimic.length) {
      return NextResponse.json({ score: 0 });
    }
    const maxLen = Math.max(original.length, mimic.length);
    const distance = levenshtein(original, mimic);
    const similarity = Math.max(0, 1 - distance / maxLen);
    const curved = Math.pow(similarity, 0.6);
    return NextResponse.json({ score: Math.min(100, Math.round(curved * 100)) });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to score", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
