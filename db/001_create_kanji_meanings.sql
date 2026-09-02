CREATE TABLE IF NOT EXISTS kanji_meanings (
  id BIGSERIAL PRIMARY KEY,
  kanji TEXT NOT NULL CHECK (char_length(kanji) BETWEEN 1 AND 16),
  word TEXT NOT NULL CHECK (char_length(word) BETWEEN 1 AND 100),
  reading TEXT NOT NULL CHECK (char_length(reading) BETWEEN 1 AND 150),
  meaning TEXT NOT NULL CHECK (char_length(meaning) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kanji, word, reading)
);

CREATE INDEX IF NOT EXISTS kanji_meanings_kanji_idx
  ON kanji_meanings (kanji, id);
