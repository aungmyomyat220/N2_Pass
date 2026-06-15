// Lightweight Leitner-box spaced repetition, persisted to localStorage.
// Boxes 0..4 — higher box = longer interval. A correct answer promotes a card,
// a wrong answer sends it back to box 0.

export type KanjiCard = {
  kanji: string;
  strokes: number | null;
  meanings: string[];
  on: string[];
  kun: string[];
  freq: number | null;
};

export type CardProgress = {
  box: number; // 0..4
  due: number; // epoch ms when the card is next due
  seen: number; // total reviews
  correct: number; // total correct
};

export type ProgressMap = Record<string, CardProgress>;

const STORAGE_KEY = "n2-kanji-progress-v1";

// Interval per box, in days. Box 0 is due immediately.
const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 16];
export const MAX_BOX = BOX_INTERVALS_DAYS.length - 1;

const DAY_MS = 24 * 60 * 60 * 1000;

export function loadProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressMap): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetProgress(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
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
