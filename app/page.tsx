"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Grid3X3, Search, X } from "lucide-react";
import rawData from "@/data/n2-kanji.json";
import KanjiFlashcard from "@/app/components/KanjiFlashcard";
import KanjiWritingPad from "@/app/components/KanjiWritingPad";
import {
  KanjiCard,
  ProgressMap,
  buildQueue,
  computeStats,
  loadProgress,
  resetProgress,
  review,
  saveProgress,
} from "@/lib/srs";
import { loadStarred, saveStarred, toggleStarred } from "@/lib/starred";

const CARDS = rawData as KanjiCard[];

export default function Home() {
  // `null` until we've hydrated from localStorage, so SSR and first client
  // render agree (avoids hydration mismatch).
  const [progress, setProgress] = useState<ProgressMap | null>(null);
  const [starred, setStarred] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [now, setNow] = useState(0);
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const [jumpValue, setJumpValue] = useState("");
  const [kanjiDrawerOpen, setKanjiDrawerOpen] = useState(false);
  const [kanjiSearch, setKanjiSearch] = useState("");

  useEffect(() => {
    setProgress(loadProgress());
    setStarred(loadStarred());
    setNow(Date.now());
  }, []);

  const queue = useMemo(() => {
    if (progress === null) return [];
    return buildQueue(CARDS, progress, now);
  }, [progress, now]);

  const stats = useMemo(() => {
    if (progress === null) return null;
    return computeStats(CARDS, progress, now);
  }, [progress, now]);

  const drawerCards = useMemo(() => {
    const query = kanjiSearch.trim().toLowerCase();
    return CARDS.map((card, index) => ({ card, index })).filter(({ card }) => {
      if (!query) return true;
      return [
        card.kanji,
        ...card.on,
        ...card.kun,
        card.example?.word ?? "",
        card.example?.reading ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [kanjiSearch]);

  const current: KanjiCard | undefined =
    manualIndex === null ? queue[0] : CARDS[manualIndex];
  const currentNumber = current
    ? CARDS.findIndex((card) => card.kanji === current.kanji) + 1
    : null;
  const jumpNumber = Number(jumpValue);
  const jumpIsValid =
    Number.isInteger(jumpNumber) && jumpNumber >= 1 && jumpNumber <= CARDS.length;

  const answer = useCallback(
    (knewIt: boolean) => {
      if (progress === null || !current) return;
      const next = review(progress, current.kanji, knewIt, Date.now());
      saveProgress(next);
      setProgress(next);
      setRevealed(false);
      if (manualIndex !== null) {
        const nextIndex = manualIndex + 1;
        if (nextIndex < CARDS.length) {
          setManualIndex(nextIndex);
          setJumpValue(String(nextIndex + 1));
        } else {
          setManualIndex(null);
          setJumpValue("");
        }
      }
    },
    [progress, current, manualIndex],
  );

  // Keyboard shortcuts: Space/Enter to reveal, 1=again, 2=good.
  useEffect(() => {
    if (!kanjiDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setKanjiDrawerOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [kanjiDrawerOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current || kanjiDrawerOpen) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && (e.key === "1" || e.key === "ArrowLeft")) {
        answer(false);
      } else if (revealed && (e.key === "2" || e.key === "ArrowRight")) {
        answer(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, revealed, answer, kanjiDrawerOpen]);

  const handleReset = () => {
    if (!window.confirm("Reset all study progress?")) return;
    resetProgress();
    setProgress({});
    setRevealed(false);
    setNow(Date.now());
    setManualIndex(null);
    setJumpValue("");
  };

  const jumpToIndex = (index: number) => {
    const safeIndex = Math.min(Math.max(index, 0), CARDS.length - 1);
    setManualIndex(safeIndex);
    setJumpValue(String(safeIndex + 1));
    setRevealed(false);
  };

  const handleJump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!jumpIsValid) return;
    jumpToIndex(jumpNumber - 1);
  };

  const skipCard = (direction: -1 | 1) => {
    const index = currentNumber ? currentNumber - 1 : 0;
    jumpToIndex(index + direction);
  };

  const handleToggleStar = () => {
    if (!current || starred === null) return;
    const next = toggleStarred(starred, current.kanji);
    saveStarred(next);
    setStarred(next);
  };

  return (
    <main className="kanji-page">
      <header className="app-header">
        <h1>N2 Kanji Flashcards</h1>
        <div className="app-header-actions">
          <button
            className="ghost all-kanji-trigger"
            onClick={() => setKanjiDrawerOpen(true)}
          >
            <Grid3X3 aria-hidden="true" />
            All Kanji
          </button>
          <button className="ghost" onClick={handleReset}>
            Reset progress
          </button>
        </div>
      </header>

      <div className="kanji-workspace">
        <section className="kanji-study-column">
          {stats && (
            <div className="stats">
              <div className="stat">
                <div className="label">Due now</div>
                <div className="value">{stats.due}</div>
              </div>
              <div className="stat">
                <div className="label">Studied</div>
                <div className="value">
                  {stats.studied}/{stats.total}
                </div>
              </div>
              <div className="stat">
                <div className="label">Mastered</div>
                <div className="value">{stats.mastered}</div>
              </div>
            </div>
          )}

          {progress !== null && (
            <form className="card-jump" onSubmit={handleJump}>
              <div className="card-jump-label">
                <span>Jump to card</span>
                {currentNumber && (
                  <span className="card-position">
                    Card {currentNumber} of {CARDS.length}
                  </span>
                )}
              </div>
              <div className="card-jump-controls">
                <button
                  type="button"
                  className="jump-step"
                  aria-label="Previous card"
                  disabled={!currentNumber || currentNumber <= 1}
                  onClick={() => skipCard(-1)}
                >
                  ←
                </button>
                <input
                  className="jump-input"
                  type="number"
                  min="1"
                  max={CARDS.length}
                  inputMode="numeric"
                  aria-label={`Card number from 1 to ${CARDS.length}`}
                  placeholder="300"
                  value={jumpValue}
                  onChange={(event) => setJumpValue(event.target.value)}
                />
                <span className="jump-total">/ {CARDS.length}</span>
                <button
                  type="submit"
                  className="jump-go"
                  disabled={!jumpIsValid}
                >
                  Go
                </button>
                <button
                  type="button"
                  className="jump-step"
                  aria-label="Next card"
                  disabled={!currentNumber || currentNumber >= CARDS.length}
                  onClick={() => skipCard(1)}
                >
                  →
                </button>
              </div>
            </form>
          )}

          {progress === null ? (
            <div className="empty">Loading…</div>
          ) : current ? (
            <>
              <KanjiFlashcard
                card={current}
                revealed={revealed}
                starred={starred?.includes(current.kanji) ?? false}
                onReveal={() => setRevealed(true)}
                onToggleStar={handleToggleStar}
              />

              {!revealed ? (
                <div className="actions">
                  <button className="reveal" onClick={() => setRevealed(true)}>
                    Reveal
                  </button>
                </div>
              ) : (
                <div className="actions">
                  <button className="bad" onClick={() => answer(false)}>
                    Again (1)
                  </button>
                  <button className="good" onClick={() => answer(true)}>
                    Got it (2)
                  </button>
                </div>
              )}

              <div className="kbd-hint">
                Space/Enter reveal · 1 = again · 2 = got it
              </div>
            </>
          ) : (
            <div className="empty">
              <div className="big">🎉</div>
              <div>All caught up — nothing due right now.</div>
              <div style={{ marginTop: 8, fontSize: 13 }}>
                Come back later, or choose a card from the drawer.
              </div>
            </div>
          )}
        </section>

        <aside className="writing-panel" aria-label="Kanji writing practice">
          <KanjiWritingPad kanji={current?.kanji} />
        </aside>
      </div>

      {kanjiDrawerOpen && (
        <div
          className="all-kanji-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setKanjiDrawerOpen(false);
          }}
        >
          <aside
            className="all-kanji-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-kanji-title"
          >
            <div className="all-kanji-header">
              <div>
                <h2 id="all-kanji-title">All Kanji</h2>
                <p>{CARDS.length} flashcards</p>
              </div>
              <button
                type="button"
                className="drawer-close"
                aria-label="Close all kanji drawer"
                onClick={() => setKanjiDrawerOpen(false)}
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <label className="all-kanji-search">
              <Search aria-hidden="true" />
              <input
                type="search"
                placeholder="Search kanji, word, or reading…"
                value={kanjiSearch}
                autoFocus
                onChange={(event) => setKanjiSearch(event.target.value)}
              />
            </label>

            <div className="all-kanji-results">
              <div className="all-kanji-result-count">
                {drawerCards.length} results
              </div>
              {drawerCards.length === 0 ? (
                <div className="all-kanji-empty">No matching kanji</div>
              ) : (
                <div className="all-kanji-grid">
                  {drawerCards.map(({ card, index }) => {
                    const isCurrent = current?.kanji === card.kanji;
                    const wasStudied = Boolean(progress?.[card.kanji]);
                    const className = [
                      "all-kanji-item",
                      isCurrent ? "current" : "",
                      wasStudied ? "studied" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <button
                        type="button"
                        className={className}
                        aria-current={isCurrent ? "true" : undefined}
                        aria-label={`Card ${index + 1}: ${card.kanji}`}
                        key={`${card.kanji}-${index}`}
                        onClick={() => {
                          jumpToIndex(index);
                          setKanjiDrawerOpen(false);
                        }}
                      >
                        <span className="all-kanji-number">{index + 1}</span>
                        <span className="all-kanji-character" lang="ja">
                          {card.kanji}
                        </span>
                        <span className="all-kanji-reading">
                          {card.on[0] ?? card.kun[0] ?? "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
