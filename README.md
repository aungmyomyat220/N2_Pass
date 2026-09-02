# N2 Kanji & Grammar

A web app for studying JLPT **N2** Japanese. Four tabs:

- **Kanji** — the ~367 N2 kanji as flashcards with spaced repetition.
- **Starred** — save difficult kanji and relearn them in a focused review.
- **Grammar** — 96 N2 grammar points with meaning, formation, explanation, and
  example sentences; searchable and expandable.
- **Exam** — test Japanese kanji readings with multiple-choice questions.

Built with Next.js (App Router) + TypeScript. Study progress is saved in the
browser's `localStorage`; shared custom kanji meanings are stored in Neon
PostgreSQL through a Next.js API route.

## Quick start

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

Build for production:

```bash
pnpm build
pnpm start
```

## Shared meaning database

1. Create a Neon project and copy its connection string.
2. Copy `.env.example` to `.env.local` and replace the placeholder with the
   connection string.
3. Create the table and import `data/custom-meanings.json`:

```bash
pnpm db:setup
```

The setup command is idempotent: it is safe to run again, and matching
`kanji + word + reading` entries are not duplicated. Add the same
`DATABASE_URL` to the deployment environment before deploying.

Sentence examples are added through `POST /api/examples`:

```json
{
  "kanji": "党",
  "example": {
    "japanese": "その政党は選挙で多くの議席を獲得しました。",
    "romaji": "Sono seito wa senkyo de oku no giseki o kakutoku shimashita.",
    "translation": "Your translation"
  }
}
```

The flashcard displays the first saved sentence for that kanji. Until one is
added, its `例` section displays an empty state.

## How it works

- **Study loop:** A kanji is shown; reveal it to see meanings + on/kun readings,
  then mark **Again** or **Got it**.
- **Spaced repetition:** A simple [Leitner system](https://en.wikipedia.org/wiki/Leitner_system)
  (5 boxes, intervals 0/1/3/7/16 days). "Got it" promotes a card; "Again" sends
  it back to box 0. Logic lives in [lib/srs.ts](lib/srs.ts).
- **Starred review:** Tap ☆ on any kanji card to save it. In the Starred tab,
  "Again" keeps the card in the current review and "Got it" completes it for
  that session without removing the star.
- **Keyboard:** `Space`/`Enter` reveal · `1` again · `2` got it.

## Data

### Grammar — [data/n2-grammar.json](data/n2-grammar.json)

96 core N2 grammar points. Each record:

```json
{ "grammar": "～ざるを得ない", "reading": "ざるをえない",
  "meaning": "have no choice but to",
  "formation": "Verb (ない-form, drop ない) + ざるを得ない",
  "explanation": "Forced by circumstances to do something against one's preference.",
  "examples": [{ "jp": "台風だから、中止せざるを得ない。",
                 "en": "Because of the typhoon, we have no choice but to cancel." }] }
```

This dataset is **hand-written** for this project (no clean public N2 grammar
dataset exists — the well-known lists are copyrighted website content). It
covers the canonical N2 points but is not exhaustive; add more by appending to
the JSON.

### Kanji — [data/n2-kanji.json](data/n2-kanji.json)

367 N2 kanji, sorted by frequency
(most common first). Each record:

```json
{ "kanji": "党", "strokes": 10, "meanings": ["Party", "Faction"],
  "on": ["とう"], "kun": ["なかま"], "freq": 39 }
```

Derived from the [kanji-data](https://github.com/davidluzgouveia/kanji-data)
dataset (which builds on KANJIDIC2 + WaniKani), filtered to `jlpt_new == 2` —
the **current** N1–N5 system, not the old 4-level one. KANJIDIC2 is © EDRDG and
used under its [license](https://www.edrdg.org/edrdg/licence.html) (attribution
required).

## Ideas to extend

- Example vocabulary per kanji (from JMdict / Jisho API).
- Example sentences (Tatoeba).
- Switch deck to other JLPT levels (the source data has N1–N5).
- A "browse all" grid view with per-kanji mastery.
- Export/import progress, or sync via a real backend + accounts.
