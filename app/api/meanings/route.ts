import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  parseMeaningBlock,
  type CustomMeaning,
} from "@/lib/custom-meanings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MeaningStore = Record<string, CustomMeaning[]>;

const DATA_FILE = path.join(process.cwd(), "data", "custom-meanings.json");
const MAX_ENTRIES_PER_REQUEST = 100;
let writeQueue: Promise<void> = Promise.resolve();

function error(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

async function readStore(): Promise<MeaningStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as MeaningStore;
  } catch (readError) {
    const code = (readError as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return {};
    throw readError;
  }
}

async function writeStore(store: MeaningStore): Promise<void> {
  const temporaryFile = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  await fs.rename(temporaryFile, DATA_FILE);
}

function withWriteLock<T>(action: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(action, action);
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
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

export async function GET(request: NextRequest) {
  try {
    const store = await readStore();
    const kanji = request.nextUrl.searchParams.get("kanji")?.trim();

    if (kanji) {
      return NextResponse.json({
        ok: true,
        kanji,
        entries: store[kanji] ?? [],
      });
    }

    return NextResponse.json({ ok: true, meanings: store });
  } catch {
    return error("Unable to read meanings.", 500);
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
    return await withWriteLock(async () => {
      const store = await readStore();
      const current = store[kanji] ?? [];
      const existing = new Set(
        current.map((entry) => `${entry.word}\u0000${entry.reading}`),
      );
      const addedEntries = entries.filter(
        (entry) => !existing.has(`${entry.word}\u0000${entry.reading}`),
      );
      const next = [...current, ...addedEntries];
      store[kanji] = next;
      if (addedEntries.length > 0) await writeStore(store);

      return NextResponse.json(
        {
          ok: true,
          kanji,
          added: addedEntries.length,
          total: next.length,
          entries: next,
          invalidLines,
        },
        { status: addedEntries.length > 0 ? 201 : 200 },
      );
    });
  } catch {
    return error("Unable to save meanings.", 500);
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
    return await withWriteLock(async () => {
      const store = await readStore();
      const current = store[kanji] ?? [];
      const next = current.filter(
        (entry) => entry.word !== word || entry.reading !== reading,
      );
      const removed = current.length - next.length;

      if (next.length === 0) delete store[kanji];
      else store[kanji] = next;
      if (removed > 0) await writeStore(store);

      return NextResponse.json({
        ok: true,
        kanji,
        removed,
        total: next.length,
        entries: next,
      });
    });
  } catch {
    return error("Unable to delete the meaning.", 500);
  }
}
