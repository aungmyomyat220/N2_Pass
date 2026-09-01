export type CustomMeaning = {
  word: string;
  reading: string;
  meaning: string;
};

export type ParsedMeaningBlock = {
  entries: CustomMeaning[];
  invalidLines: string[];
};

const STORAGE_KEY = "n2-kanji-custom-meanings-v1";
const HIDDEN_ORIGINALS_KEY = "n2-kanji-hidden-original-examples-v1";

function loadAll(): Record<string, CustomMeaning[]> {
  if (typeof window === "undefined") return {};
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Record<string, CustomMeaning[]>) : {};
  } catch {
    return {};
  }
}

export function loadCustomMeanings(kanji: string): CustomMeaning[] {
  return loadAll()[kanji] ?? [];
}

export function saveCustomMeanings(
  kanji: string,
  meanings: CustomMeaning[],
): void {
  if (typeof window === "undefined") return;
  const all = loadAll();

  if (meanings.length === 0) delete all[kanji];
  else all[kanji] = meanings;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function loadHiddenOriginals(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(HIDDEN_ORIGINALS_KEY);
    return saved ? (JSON.parse(saved) as string[]) : [];
  } catch {
    return [];
  }
}

export function isOriginalExampleHidden(kanji: string): boolean {
  return loadHiddenOriginals().includes(kanji);
}

export function setOriginalExampleHidden(
  kanji: string,
  hidden: boolean,
): void {
  if (typeof window === "undefined") return;
  const current = loadHiddenOriginals();
  const next = hidden
    ? Array.from(new Set([...current, kanji]))
    : current.filter((savedKanji) => savedKanji !== kanji);

  if (next.length === 0) window.localStorage.removeItem(HIDDEN_ORIGINALS_KEY);
  else window.localStorage.setItem(HIDDEN_ORIGINALS_KEY, JSON.stringify(next));
}

export function parseMeaningBlock(input: string): ParsedMeaningBlock {
  const entries: CustomMeaning[] = [];
  const invalidLines: string[] = [];

  for (const sourceLine of input.split(/\r?\n/)) {
    const trimmed = sourceLine.trim();
    if (!trimmed) continue;

    const line = trimmed
      .replace(/^\d+[.)]\s*/, "")
      .replace(/^[-•]\s*/, "")
      .replace(/\*\*/g, "")
      .trim();
    const match = line.match(
      /^(.+?)[（(]\s*([^）)]+?)\s*[）)]\s*(?:=|:|：)\s*(.+)$/,
    );

    if (!match) {
      invalidLines.push(sourceLine);
      continue;
    }

    const [, word, reading, meaning] = match;
    entries.push({
      word: word.trim(),
      reading: reading.trim(),
      meaning: meaning.trim(),
    });
  }

  return { entries, invalidLines };
}
