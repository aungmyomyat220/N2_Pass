import { accountState, updateAccount } from "./study-storage";
// Lightweight Leitner-box spaced repetition, persisted to localStorage.
// Boxes 0..4 — higher box = longer interval. A correct answer promotes a card,
// a wrong answer sends it back to box 0.

export type KanjiExample = {
  word: string;
  reading: string;
  meaning: string;
};

export type KanjiCard = {
  kanji: string;
  strokes: number | null;
  meanings: string[];
  on: string[];
  kun: string[];
  freq: number | null;
  example?: KanjiExample;
};

export type CardProgress = {
  box: number; // 0..4
  due: number; // epoch ms when the card is next due
  seen: number; // total reviews
  correct: number; // total correct
};

export type ProgressMap = Record<string, CardProgress>;

export type ProgressDeck = "normal" | "same-pattern";

const STORAGE_KEYS: Record<ProgressDeck, string> = {
  normal: "n2-kanji-progress-v1",
  "same-pattern": "n2-kanji-same-pattern-progress-v1",
};

const INDEX_STORAGE_KEYS: Record<ProgressDeck, string> = {
  normal: "n2-kanji-current-index-v1",
  "same-pattern": "n2-kanji-same-pattern-current-index-v1",
};

// Interval per box, in days. Box 0 is due immediately.
const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 16];
export const MAX_BOX = BOX_INTERVALS_DAYS.length - 1;

const DAY_MS = 24 * 60 * 60 * 1000;

export function loadProgress(deck: ProgressDeck = "normal"): ProgressMap {
  if (typeof window === "undefined") return {};
  const currentAccount = accountState();
  if (currentAccount) {
    return deck === "same-pattern"
      ? currentAccount.samePatternProgress ?? {}
      : currentAccount.progress;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[deck]);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressMap, deck: ProgressDeck = "normal"): void {
  if (typeof window === "undefined") return;
  const patch = deck === "same-pattern" ? { samePatternProgress: progress } : { progress };
  if (updateAccount(patch)) return;
  window.localStorage.setItem(STORAGE_KEYS[deck], JSON.stringify(progress));
}

export function loadCurrentIndex(deck: ProgressDeck = "normal"): number | null {
  if (typeof window === "undefined") return null;
  const currentAccount = accountState();
  let value: unknown;
  if (currentAccount) {
    value = deck === "same-pattern" ? currentAccount.samePatternCurrentIndex : currentAccount.currentIndex;
  } else {
    const stored = window.localStorage.getItem(INDEX_STORAGE_KEYS[deck]);
    value = stored === null ? null : Number(stored);
  }
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

export function saveCurrentIndex(index: number | null, deck: ProgressDeck = "normal"): void {
  if (typeof window === "undefined") return;
  const patch = deck === "same-pattern" ? { samePatternCurrentIndex: index } : { currentIndex: index };
  if (updateAccount(patch)) return;
  if (index === null) window.localStorage.removeItem(INDEX_STORAGE_KEYS[deck]);
  else window.localStorage.setItem(INDEX_STORAGE_KEYS[deck], String(index));
}

export function resetProgress(deck: ProgressDeck = "normal"): void {
  if (typeof window === "undefined") return;
  const patch = deck === "same-pattern"
    ? { samePatternProgress: {}, samePatternCurrentIndex: null }
    : { progress: {}, currentIndex: null };
  if (updateAccount(patch)) return;
  window.localStorage.removeItem(STORAGE_KEYS[deck]);
  window.localStorage.removeItem(INDEX_STORAGE_KEYS[deck]);
}

function dueDateFor(box: number, now: number): number {
  return now + BOX_INTERVALS_DAYS[box] * DAY_MS;
}

export function getCardProgress(progress: ProgressMap, kanji: string): CardProgress {
  return progress[kanji] ?? { box: 0, due: 0, seen: 0, correct: 0 };
}

export function review(
  progress: ProgressMap,
  kanji: string,
  knewIt: boolean,
  now: number,
): ProgressMap {
  const current = getCardProgress(progress, kanji);
  const box = knewIt ? Math.min(current.box + 1, MAX_BOX) : 0;
  return {
    ...progress,
    [kanji]: {
      box,
      due: dueDateFor(box, now),
      seen: current.seen + 1,
      correct: current.correct + (knewIt ? 1 : 0),
    },
  };
}

// Cards that are due now (or never seen), ordered: never-seen by deck order first,
// then due cards by how overdue they are.
export function buildQueue(
  cards: KanjiCard[],
  progress: ProgressMap,
  now: number,
): KanjiCard[] {
  const due = cards.filter((c) => {
    const p = progress[c.kanji];
    return !p || p.due <= now;
  });
  return due.sort((a, b) => {
    const pa = progress[a.kanji];
    const pb = progress[b.kanji];
    if (!pa && !pb) return 0;
    if (!pa) return -1;
    if (!pb) return 1;
    return pa.due - pb.due;
  });
}

export type Stats = {
  total: number;
  studied: number;
  due: number;
  mastered: number; // in the top box
};

export function computeStats(
  cards: KanjiCard[],
  progress: ProgressMap,
  now: number,
): Stats {
  let studied = 0;
  let due = 0;
  let mastered = 0;
  for (const c of cards) {
    const p = progress[c.kanji];
    if (p) {
      studied++;
      if (p.box >= MAX_BOX) mastered++;
      if (p.due <= now) due++;
    } else {
      due++;
    }
  }
  return { total: cards.length, studied, due, mastered };
}
