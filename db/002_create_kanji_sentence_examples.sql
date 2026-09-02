CREATE TABLE IF NOT EXISTS kanji_sentence_examples (
  id BIGSERIAL PRIMARY KEY,
  kanji TEXT NOT NULL CHECK (char_length(kanji) BETWEEN 1 AND 16),
  japanese TEXT NOT NULL CHECK (char_length(japanese) BETWEEN 1 AND 1000),
  romaji TEXT NOT NULL CHECK (char_length(romaji) BETWEEN 1 AND 1000),
  translation TEXT NOT NULL CHECK (char_length(translation) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kanji, japanese)
);

CREATE INDEX IF NOT EXISTS kanji_sentence_examples_kanji_idx
  ON kanji_sentence_examples (kanji, id);
