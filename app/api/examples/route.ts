import { NextRequest, NextResponse } from "next/server";
import { requirePostApiKey } from "@/lib/api-auth";
import { getDatabase } from "@/lib/db";
import type { KanjiSentenceExample } from "@/lib/kanji-examples";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExampleRow = KanjiSentenceExample & { kanji: string };

const MAX_EXAMPLES_PER_REQUEST = 20;

function error(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function databaseError(operation: string, caught: unknown) {
  console.error(`Unable to ${operation} sentence examples:`, caught);
  if (caught instanceof Error && caught.message.includes("DATABASE_URL")) {
    return error("Example database is not configured.", 503);
  }
  return error(`Unable to ${operation} sentence examples.`, 500);
}

function cleanExample(value: unknown): KanjiSentenceExample | null {
  if (!value || typeof value !== "object") return null;
  const example = value as Record<string, unknown>;
  if (
    typeof example.japanese !== "string" ||
    typeof example.romaji !== "string" ||
    typeof example.translation !== "string"
  ) {
    return null;
  }

  const cleaned = {
    japanese: example.japanese.trim(),
    romaji: example.romaji.trim(),
    translation: example.translation.trim(),
  };
  if (!cleaned.japanese || !cleaned.romaji || !cleaned.translation) return null;
  if (
    cleaned.japanese.length > 1000 ||
    cleaned.romaji.length > 1000 ||
    cleaned.translation.length > 2000
  ) {
    return null;
  }
  return cleaned;
}

function withoutKanji(row: ExampleRow): KanjiSentenceExample {
  return {
    japanese: row.japanese,
    romaji: row.romaji,
    translation: row.translation,
  };
}

async function findExamples(kanji: string) {
  const sql = getDatabase();
  return (await sql`
    SELECT kanji, japanese, romaji, translation
    FROM kanji_sentence_examples
    WHERE kanji = ${kanji}
    ORDER BY id
  `) as ExampleRow[];
}

export async function GET(request: NextRequest) {
  const kanji = request.nextUrl.searchParams.get("kanji")?.trim();
  if (!kanji) return error("kanji query parameter is required.");

  try {
    const rows = await findExamples(kanji);
    return NextResponse.json({
      ok: true,
      kanji,
      examples: rows.map(withoutKanji),
    });
  } catch (caught) {
    return databaseError("read", caught);
  }
}

export async function POST(request: NextRequest) {
  const authorizationError = requirePostApiKey(request);
  if (authorizationError) return authorizationError;

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

  const sourceExamples = Array.isArray(data.examples)
    ? data.examples
    : data.example
      ? [data.example]
      : [];
  const examples = sourceExamples
    .map(cleanExample)
    .filter((example): example is KanjiSentenceExample => example !== null);

  if (examples.length !== sourceExamples.length || examples.length === 0) {
    return error(
      "Provide example or examples with non-empty japanese, romaji, and translation strings.",
    );
  }
  if (examples.length > MAX_EXAMPLES_PER_REQUEST) {
    return error(`A maximum of ${MAX_EXAMPLES_PER_REQUEST} examples is allowed.`);
  }

  const uniqueExamples = examples.filter(
    (example, index, all) =>
      all.findIndex((candidate) => candidate.japanese === example.japanese) ===
      index,
  );

  try {
    const sql = getDatabase();
    for (const example of uniqueExamples) {
      await sql`
        INSERT INTO kanji_sentence_examples
          (kanji, japanese, romaji, translation)
        VALUES
          (${kanji}, ${example.japanese}, ${example.romaji}, ${example.translation})
        ON CONFLICT (kanji, japanese) DO UPDATE SET
          romaji = EXCLUDED.romaji,
          translation = EXCLUDED.translation
      `;
    }

    const rows = await findExamples(kanji);
    return NextResponse.json(
      {
        ok: true,
        kanji,
        saved: uniqueExamples.length,
        total: rows.length,
        examples: rows.map(withoutKanji),
      },
      { status: 201 },
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
  const japanese =
    typeof data.japanese === "string" ? data.japanese.trim() : "";
  if (!kanji || !japanese) return error("kanji and japanese are required.");

  try {
    const sql = getDatabase();
    const removedRows = (await sql`
      DELETE FROM kanji_sentence_examples
      WHERE kanji = ${kanji} AND japanese = ${japanese}
      RETURNING id
    `) as { id: string }[];
    const rows = await findExamples(kanji);

    return NextResponse.json({
      ok: true,
      kanji,
      removed: removedRows.length,
      total: rows.length,
      examples: rows.map(withoutKanji),
    });
  } catch (caught) {
    return databaseError("delete", caught);
  }
}
