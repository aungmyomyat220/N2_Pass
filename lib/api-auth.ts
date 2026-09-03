import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

function unauthorized(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function requirePostApiKey(request: NextRequest) {
  const expected = process.env.N2_PASS_API_KEY;
  if (!expected) {
    return unauthorized("POST API key is not configured.", 503);
  }

  const provided = request.headers.get("x-api-key");
  if (!provided) return unauthorized("API key is required.", 401);

  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  const matches =
    expectedBytes.length === providedBytes.length &&
    timingSafeEqual(expectedBytes, providedBytes);

  return matches ? null : unauthorized("Invalid API key.", 401);
}
