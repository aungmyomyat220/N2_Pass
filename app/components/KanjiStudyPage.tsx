"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Grid3X3,
  PencilLine,
  RotateCcw,
  Search,
  Shapes,
  X,
} from "lucide-react";
import PageHero from "@/app/components/PageHero";
import KanjiFlashcard from "@/app/components/KanjiFlashcard";
import KanjiRevealPanel from "@/app/components/KanjiRevealPanel";
import KanjiSentenceCard from "@/app/components/KanjiSentenceCard";
import KanjiWritingPad from "@/app/components/KanjiWritingPad";
import {
  KanjiCard,
  ProgressDeck,
  ProgressMap,
  buildQueue,
  computeStats,
  loadCurrentIndex,
  loadProgress,
  resetProgress,
  review,
  saveCurrentIndex,
  saveProgress,
} from "@/lib/srs";
import { loadStarred, saveStarred, toggleStarred } from "@/lib/starred";

export default function KanjiStudyPage({
  cards: CARDS,
  title = "N2 Kanji Flashcards",
  progressDeck = "normal",
}: {
  cards: KanjiCard[];
  title?: string;
  progressDeck?: ProgressDeck;
}) {
  // `null` until we've hydrated from localStorage, so SSR and first client
  // render agree (avoids hydration mismatch).
  const [progress, setProgress] = useState<ProgressMap | null>(null);
  const [starred, setStarred] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [now, setNow] = useState(0);
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const [retryCard, setRetryCard] = useState<KanjiCard | null>(null);
  const [kanjiDrawerOpen, setKanjiDrawerOpen] = useState(false);
  const [writingPadOpen, setWritingPadOpen] = useState(false);
  const [kanjiSearch, setKanjiSearch] = useState("");
  const [indexInput, setIndexInput] = useState("");

  useEffect(() => {
    setProgress(loadProgress(progressDeck));
    setStarred(loadStarred());
    setNow(Date.now());
    const savedIndex = loadCurrentIndex(progressDeck);
    setManualIndex(savedIndex !== null && savedIndex < CARDS.length ? savedIndex : null);
  }, [progressDeck, CARDS.length]);

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
    retryCard ?? (manualIndex === null ? queue[0] : CARDS[manualIndex]);
  const currentIndex = current
    ? CARDS.findIndex((card) => card.kanji === current.kanji)
    : -1;

  useEffect(() => {
    setIndexInput(currentIndex >= 0 ? String(currentIndex + 1) : "");
  }, [currentIndex]);

  const answer = useCallback(
    (knewIt: boolean) => {
      if (progress === null || !current) return;
      const next = review(progress, current.kanji, knewIt, Date.now());
      saveProgress(next, progressDeck);
      setProgress(next);
      setRevealed(false);
      // Keep the failed card visible even when saving progress reorders the queue.
      if (!knewIt) {
        setRetryCard(current);
        return;
      }
      setRetryCard(null);
      if (manualIndex !== null) {
        const nextIndex = manualIndex + 1;
        if (nextIndex < CARDS.length) {
          setManualIndex(nextIndex);
          saveCurrentIndex(nextIndex, progressDeck);
        } else {
          setManualIndex(null);
          saveCurrentIndex(null, progressDeck);
        }
      }
    },
    [progress, current, manualIndex, progressDeck],
  );

  const handleToggleStar = useCallback(() => {
    if (!current || starred === null) return;
    const next = toggleStarred(loadStarred(), current.kanji);
    saveStarred(next);
    setStarred(next);
  }, [current, starred]);

  // Keyboard shortcuts: Space/Enter to reveal, 1=again, 2=good.
  useEffect(() => {
    if (!kanjiDrawerOpen && !writingPadOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (writingPadOpen) setWritingPadOpen(false);
      else setKanjiDrawerOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [kanjiDrawerOpen, writingPadOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current || kanjiDrawerOpen || writingPadOpen) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, button, select")) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && (["a", "1"].includes(e.key.toLowerCase()) || e.key === "ArrowLeft")) {
        e.preventDefault();
        answer(false);
      } else if (revealed && (["d", "2"].includes(e.key.toLowerCase()) || e.key === "ArrowRight")) {
        e.preventDefault();
        answer(true);
      } else if (revealed && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleToggleStar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, revealed, answer, handleToggleStar, kanjiDrawerOpen, writingPadOpen]);

  const handleReset = () => {
    const deckName = progressDeck === "same-pattern" ? "Same Pattern" : "Normal Flashcard";
    if (!window.confirm(`Reset ${deckName} progress?`)) return;
    resetProgress(progressDeck);
    setRetryCard(null);
    setProgress({});
    setRevealed(false);
    setNow(Date.now());
    setManualIndex(null);
  };

  const jumpToIndex = (index: number) => {
    setRetryCard(null);
    const safeIndex = Math.min(Math.max(index, 0), CARDS.length - 1);
    setManualIndex(safeIndex);
    saveCurrentIndex(safeIndex, progressDeck);
    setRevealed(false);
  };

  const handleIndexSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requestedIndex = Number(indexInput);
    if (!Number.isInteger(requestedIndex) || requestedIndex < 1 || requestedIndex > CARDS.length) {
      setIndexInput(currentIndex >= 0 ? String(currentIndex + 1) : "");
      return;
    }
    jumpToIndex(requestedIndex - 1);
  };

  const returnToProgress = () => {
    setManualIndex(null);
    saveCurrentIndex(null, progressDeck);
    setRetryCard(null);
    setRevealed(false);
    setNow(Date.now());
  };

  return (
    <main className="kanji-page">
      {progressDeck === "same-pattern" && (
        <PageHero
          icon={Shapes}
          eyebrow="形で学ぶ · N2"
          title={title}
          description="Study visually related kanji together, one group at a time."
          stat={CARDS.length}
          statLabel="Kanji cards"
        />
      )}
      <div className="kanji-study-toolbar">
        <span>Study tools</span>
        <div className="app-header-actions">
          <button
            className="ghost writing-pad-trigger"
            disabled={!current}
            onClick={() => setWritingPadOpen(true)}
          >
            <PencilLine aria-hidden="true" />
            Writing Pad
          </button>
          <button
            className="ghost all-kanji-trigger"
            onClick={() => setKanjiDrawerOpen(true)}
          >
            <Grid3X3 aria-hidden="true" />
            All Kanji
          </button>
          <button className="ghost reset-progress" onClick={handleReset}>
            Reset progress
          </button>
        </div>
      </div>

      {stats && (
        <section className="stats" aria-label="Study progress">
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
          <div className={manualIndex === null ? "stat current-index-stat" : "stat current-index-stat is-browsing"}>
            <div className="current-index-heading">
              <div className="label">Current index</div>
              <span>{manualIndex === null ? "Study queue" : "Browsing"}</span>
            </div>
            <form className="current-index-control" onSubmit={handleIndexSubmit}>
              <label className="current-index-value">
                <span className="sr-only">Kanji index</span>
                <input
                  type="number"
                  min={1}
                  max={stats.total}
                  inputMode="numeric"
                  aria-label={`Go to Kanji index, 1 to ${stats.total}`}
                  value={indexInput}
                  onChange={(event) => setIndexInput(event.target.value)}
                  onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                  onFocus={(event) => event.currentTarget.select()}
                />
                <span className="current-index-separator">/</span>
                <span className="current-index-total">{stats.total}</span>
                <kbd aria-hidden="true">Enter</kbd>
              </label>
              {manualIndex === null ? (
                <span className="current-index-hint">Type a number to jump</span>
              ) : (
                <button type="button" className="back-to-progress" onClick={returnToProgress}>
                  <RotateCcw aria-hidden="true" />
                  Resume progress
                </button>
              )}
            </form>
          </div>
        </section>
      )}

      <div className="kanji-workspace">
        <section className="kanji-study-column">
          {progress === null ? (
            <div className="empty">Loading…</div>
          ) : current ? (
            <>
              <KanjiFlashcard
                card={current}
                revealed={revealed}
                starred={starred?.includes(current.kanji) ?? false}
                showDetails={false}
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
                    <ArrowLeft aria-hidden="true" />
                    Again (A)
                  </button>
                  <button className="good" onClick={() => answer(true)}>
                    Next (D)
                    <ArrowRight aria-hidden="true" />
                  </button>
                </div>
              )}

              {revealed && <KanjiSentenceCard kanji={current.kanji} />}

              <div className="kbd-hint">
                Space/Enter reveal · A = again · D = next · S = bookmark
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

        <aside className="reveal-details-panel" aria-label="Kanji details">
          {current && revealed ? (
            <KanjiRevealPanel card={current} />
          ) : (
            <div className="reveal-details-placeholder">
              <span className="reveal-details-placeholder-mark" lang="ja">
                意
              </span>
              <h2>Meaning &amp; Vocabulary</h2>
              <p>Reveal the card to see its meaning and vocabulary.</p>
            </div>
          )}
        </aside>
      </div>

      {writingPadOpen && (
        <div
          className="writing-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setWritingPadOpen(false);
          }}
        >
          <div
            className="writing-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Writing practice for ${current?.kanji ?? "kanji"}`}
          >
            <KanjiWritingPad
              kanji={current?.kanji}
              onClose={() => setWritingPadOpen(false)}
            />
          </div>
        </div>
      )}

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
