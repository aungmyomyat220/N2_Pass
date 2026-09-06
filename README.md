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

Set `N2_PASS_API_KEY` in `.env.local` and in the deployment environment. Every
POST request must send that value using the `x-api-key` header. GET endpoints
remain public.

Sentence examples are added through `POST /api/examples`:

```text
x-api-key: your-N2_PASS_API_KEY-value
Content-Type: application/json
```

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

## Google login and study sync

Login uses Better Auth and the existing Neon PostgreSQL database. Signed-in users sync kanji review progress and stars. Guests keep their existing browser storage. Personal meanings/preferences and exam sessions are not synced in this first version.

1. Create a Google OAuth **Web application** client in Google Cloud Console and configure its consent screen. Add test users while the OAuth application is in testing.
2. Add authorized JavaScript origins `http://localhost:3000` and your production origin. Add redirect URIs `http://localhost:3000/api/auth/callback/google` and `https://YOUR_DOMAIN/api/auth/callback/google`.
3. Set `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL` (the exact app origin), and `BETTER_AUTH_SECRET` in `.env.local` and your hosting environment. Generate a secret with `openssl rand -base64 32`. Never put secrets in `NEXT_PUBLIC_` variables.
4. Run `pnpm db:auth` to create Better Auth's version-matched schema and the study-state table. Existing content tables are unchanged. `pnpm db:setup` remains the meanings/examples setup command.
5. Restart the app. Use **Continue with Google** in the sidebar. Import guest progress explicitly when prompted; cloud progress wins for overlapping cards, and stars are combined.

Sync uses server-verified sessions and revision checks. Concurrent changes from another tab/device are rejected instead of silently overwritten. Download unsynced progress before choosing **Load cloud progress** to resolve a conflict. Unsynced changes are retained locally and retried every five seconds while online; keep the page open until “Saved to your account” appears. Sign-out waits for pending sync and restores the separate guest state. Refresh on another device to load the latest cloud state.

Validation: `pnpm exec tsc --noEmit`, `pnpm test:study`, `pnpm build`. Live acceptance: sign in, import guest progress, review/star a card, refresh on a second device, verify reset persists without deleting stars, check two-tab conflict handling, and sign out to verify guest/account separation.

References: https://better-auth.com/docs/installation and https://better-auth.com/docs/authentication/google
