import { NextRequest, NextResponse } from "next/server";
import {
  parseMeaningBlock,
  type CustomMeaning,
} from "@/lib/custom-meanings";
import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MeaningRow = CustomMeaning & { kanji: string };

const MAX_ENTRIES_PER_REQUEST = 100;

function error(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function databaseError(operation: string, caught: unknown) {
  console.error(`Unable to ${operation} meanings:`, caught);
  if (caught instanceof Error && caught.message.includes("DATABASE_URL")) {
    return error("Meaning database is not configured.", 503);
  }
  return error(`Unable to ${operation} meanings.`, 500);
}

function cleanEntry(value: unknown): CustomMeaning | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Record<string, unknown>;
  if (
    typeof entry.word !== "string" ||
    typeof entry.reading !== "string" ||
    typeof entry.meaning !== "string"
  ) {
    return null;
  }

  const cleaned = {
    word: entry.word.trim(),
    reading: entry.reading.trim(),
    meaning: entry.meaning.trim(),
  };

  if (!cleaned.word || !cleaned.reading || !cleaned.meaning) return null;
  if (
    cleaned.word.length > 100 ||
    cleaned.reading.length > 150 ||
    cleaned.meaning.length > 500
  ) {
    return null;
  }
  return cleaned;
}

function deduplicate(entries: CustomMeaning[]): CustomMeaning[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.word}\u0000${entry.reading}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function withoutKanji(row: MeaningRow): CustomMeaning {
  return {
    word: row.word,
    reading: row.reading,
    meaning: row.meaning,
  };
}

export async function GET(request: NextRequest) {
  try {
    const sql = getDatabase();
    const kanji = request.nextUrl.searchParams.get("kanji")?.trim();

    if (kanji) {
      const rows = (await sql`
        SELECT kanji, word, reading, meaning
        FROM kanji_meanings
        WHERE kanji = ${kanji}
        ORDER BY id
      `) as MeaningRow[];

      return NextResponse.json({
        ok: true,
        kanji,
        entries: rows.map(withoutKanji),
      });
    }

    const rows = (await sql`
      SELECT kanji, word, reading, meaning
      FROM kanji_meanings
      ORDER BY kanji, id
    `) as MeaningRow[];
    const meanings = rows.reduce<Record<string, CustomMeaning[]>>(
      (all, row) => {
        (all[row.kanji] ??= []).push(withoutKanji(row));
        return all;
      },
      {},
    );

    return NextResponse.json({ ok: true, meanings });
  } catch (caught) {
    return databaseError("read", caught);
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Request body must be valid JSON.");
  }

  if (!body || typeof body !== "object") return error("Body must be an object.");
  const data = body as Record<string, unknown>;
  const kanji = typeof data.kanji === "string" ? data.kanji.trim() : "";
  if (!kanji || kanji.length > 16) return error("kanji is required.");

  let entries: CustomMeaning[] = [];
  let invalidLines: string[] = [];

  if (typeof data.text === "string") {
    const parsed = parseMeaningBlock(data.text);
    entries = parsed.entries;
    invalidLines = parsed.invalidLines;
  } else if (Array.isArray(data.entries)) {
    entries = data.entries
      .map(cleanEntry)
      .filter((entry): entry is CustomMeaning => entry !== null);
    if (entries.length !== data.entries.length) {
      return error(
        "Each entry requires non-empty word, reading, and meaning strings.",
      );
    }
  } else {
    return error("Provide either text or entries.");
  }

  entries = deduplicate(entries);
  if (entries.length === 0) return error("No valid meaning entries were found.");
  if (entries.length > MAX_ENTRIES_PER_REQUEST) {
    return error(`A maximum of ${MAX_ENTRIES_PER_REQUEST} entries is allowed.`);
  }

  try {
    const sql = getDatabase();
    let added = 0;
    for (const entry of entries) {
      const inserted = (await sql`
        INSERT INTO kanji_meanings (kanji, word, reading, meaning)
        VALUES (${kanji}, ${entry.word}, ${entry.reading}, ${entry.meaning})
        ON CONFLICT (kanji, word, reading) DO NOTHING
        RETURNING id
      `) as { id: string }[];
      added += inserted.length;
    }

    const rows = (await sql`
      SELECT kanji, word, reading, meaning
      FROM kanji_meanings
      WHERE kanji = ${kanji}
      ORDER BY id
    `) as MeaningRow[];

    return NextResponse.json(
      {
        ok: true,
        kanji,
        added,
        total: rows.length,
        entries: rows.map(withoutKanji),
        invalidLines,
      },
      { status: added > 0 ? 201 : 200 },
    );
  } catch (caught) {
    return databaseError("save", caught);
  }
}

export async function DELETE(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Request body must be valid JSON.");
  }

  if (!body || typeof body !== "object") return error("Body must be an object.");
  const data = body as Record<string, unknown>;
  const kanji = typeof data.kanji === "string" ? data.kanji.trim() : "";
  const word = typeof data.word === "string" ? data.word.trim() : "";
  const reading = typeof data.reading === "string" ? data.reading.trim() : "";
  if (!kanji || !word || !reading) {
    return error("kanji, word, and reading are required.");
  }

  try {
    const sql = getDatabase();
    const removedRows = (await sql`
      DELETE FROM kanji_meanings
      WHERE kanji = ${kanji}
        AND word = ${word}
        AND reading = ${reading}
      RETURNING id
    `) as { id: string }[];
    const rows = (await sql`
      SELECT kanji, word, reading, meaning
      FROM kanji_meanings
      WHERE kanji = ${kanji}
      ORDER BY id
    `) as MeaningRow[];

    return NextResponse.json({
      ok: true,
      kanji,
      removed: removedRows.length,
      total: rows.length,
      entries: rows.map(withoutKanji),
    });
  } catch (caught) {
    return databaseError("delete", caught);
  }
}
