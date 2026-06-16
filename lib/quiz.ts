// Multiple-choice quiz generation for the Exam mode.
// A question shows a kanji and asks for its (Burmese) meaning; one correct
// option is mixed with random distractors drawn from other cards.

import type { KanjiCard } from "./srs";

export type QuizOption = {
  label: string; // the meaning text shown on the button
  correct: boolean;
};

export type QuizQuestion = {
  card: KanjiCard;
  options: QuizOption[];
};

const OPTIONS_PER_QUESTION = 4;

// Label used both as the correct answer and as a distractor pool entry.
function meaningLabel(card: KanjiCard): string {
  return card.meanings.join("、");
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
    const correctLabel = meaningLabel(card);

    // Distractors: meanings from other cards, deduped against the correct one.
    const distractors: string[] = [];
    const seen = new Set<string>([correctLabel]);
    for (const other of shuffle(cards)) {
      if (distractors.length >= OPTIONS_PER_QUESTION - 1) break;
      const label = meaningLabel(other);
      if (seen.has(label)) continue;
      seen.add(label);
      distractors.push(label);
    }

    const options: QuizOption[] = shuffle([
      { label: correctLabel, correct: true },
      ...distractors.map((label) => ({ label, correct: false })),
    ]);

    return { card, options };
  });
}
