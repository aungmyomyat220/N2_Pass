// Multiple-choice quiz generation for the Exam mode.
// A question shows a kanji and asks for its Japanese readings; one correct
// option is mixed with random distractors drawn from other cards.

import type { KanjiCard } from "./srs";

export type QuizOption = {
  label: string; // the Japanese reading text shown on the button
  correct: boolean;
};

export type QuizQuestion = {
  card: KanjiCard;
  kind: "single" | "compound";
  prompt: string;
  options: QuizOption[];
};

const OPTIONS_PER_QUESTION = 4;

// Label used both as the correct answer and as a distractor pool entry.
function readingLabel(card: KanjiCard): string {
  const readings = [`音読み：${card.on.join("・")}`];
  if (card.kun.length > 0) readings.push(`訓読み：${card.kun.join("・")}`);
  return readings.join(" ／ ");
}

// Fisher–Yates shuffle on a copy.
export function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Build `count` multiple-choice questions from a shuffled mix of the deck.
export function buildQuiz(cards: KanjiCard[], count: number): QuizQuestion[] {
  const picked = shuffle(cards).slice(0, Math.min(count, cards.length));

  return picked.map((card) => {
    const correctLabel = readingLabel(card);

    // Distractors: readings from other cards, deduped against the correct one.
    const distractors: string[] = [];
    const seen = new Set<string>([correctLabel]);
    for (const other of shuffle(cards)) {
      if (distractors.length >= OPTIONS_PER_QUESTION - 1) break;
      const label = readingLabel(other);
      if (seen.has(label)) continue;
      seen.add(label);
      distractors.push(label);
    }

    const options: QuizOption[] = shuffle([
      { label: correctLabel, correct: true },
      ...distractors.map((label) => ({ label, correct: false })),
    ]);

    return { card, kind: "single", prompt: card.kanji, options };
  });
}

// Build JLPT-style reading questions from the compound example on each card.
// The prompt is a word written with kanji and the options are kana readings.
export function buildCompoundQuiz(
  cards: KanjiCard[],
  count: number,
): QuizQuestion[] {
  const eligible = cards.filter(
    (card) => card.example?.word && card.example.reading,
  );
  const picked = shuffle(eligible).slice(0, Math.min(count, eligible.length));

  return picked.map((card) => {
    const example = card.example!;
    const distractors: string[] = [];
    const seen = new Set<string>([example.reading]);

    for (const other of shuffle(eligible)) {
      if (distractors.length >= OPTIONS_PER_QUESTION - 1) break;
      const reading = other.example!.reading;
      if (seen.has(reading)) continue;
      seen.add(reading);
      distractors.push(reading);
    }

    const options: QuizOption[] = shuffle([
      { label: example.reading, correct: true },
      ...distractors.map((label) => ({ label, correct: false })),
    ]);

    return {
      card,
      kind: "compound",
      prompt: example.word,
      options,
    };
  });
}
