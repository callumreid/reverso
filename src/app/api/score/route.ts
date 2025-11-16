import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ScoreRequestBody {
  originalTranscription?: string;
  mimicTranscription?: string;
}

const normalize = (value: string | undefined) => value?.trim().toLowerCase() ?? "";

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScoreRequestBody;
    const original = normalize(body.originalTranscription);
    const mimic = normalize(body.mimicTranscription);
    const maxLen = Math.max(original.length, mimic.length);
    if (!maxLen) {
      return NextResponse.json({ score: 100 });
    }
    const distance = levenshtein(original, mimic);
    const similarity = Math.max(0, 1 - distance / maxLen);
    return NextResponse.json({ score: Math.round(similarity * 100) });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to score", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
