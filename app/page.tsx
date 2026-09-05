"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Grid3X3,
  PencilLine,
  Search,
  X,
} from "lucide-react";
import rawData from "@/data/n2-kanji.json";
import KanjiFlashcard from "@/app/components/KanjiFlashcard";
import KanjiRevealPanel from "@/app/components/KanjiRevealPanel";
import KanjiSentenceCard from "@/app/components/KanjiSentenceCard";
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
type VisitedCard = { card: KanjiCard; manualIndex: number | null };

export default function Home() {
  // `null` until we've hydrated from localStorage, so SSR and first client
  // render agree (avoids hydration mismatch).
  const [progress, setProgress] = useState<ProgressMap | null>(null);
  const [starred, setStarred] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [now, setNow] = useState(0);
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const [retryCard, setRetryCard] = useState<KanjiCard | null>(null);
  const [history, setHistory] = useState<VisitedCard[]>([]);
  const [forward, setForward] = useState<VisitedCard[]>([]);
  const [kanjiDrawerOpen, setKanjiDrawerOpen] = useState(false);
  const [writingPadOpen, setWritingPadOpen] = useState(false);
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
    retryCard ?? (manualIndex === null ? queue[0] : CARDS[manualIndex]);

  const answer = useCallback(
    (knewIt: boolean) => {
      if (progress === null || !current) return;
      const next = review(progress, current.kanji, knewIt, Date.now());
      saveProgress(next);
      setProgress(next);
      setRevealed(false);
      // Keep the failed card visible even when saving progress reorders the queue.
      if (!knewIt) {
        setRetryCard(current);
        return;
      }
      setHistory((items) => [...items, { card: current, manualIndex }]);
      const upcoming = forward[forward.length - 1];
      if (upcoming) {
        setForward((items) => items.slice(0, -1));
        setRetryCard(upcoming.card);
        setManualIndex(upcoming.manualIndex);
        return;
      }
      setRetryCard(null);
      if (manualIndex !== null) {
        const nextIndex = manualIndex + 1;
        if (nextIndex < CARDS.length) {
          setManualIndex(nextIndex);
        } else {
          setManualIndex(null);
        }
      }
    },
    [progress, current, manualIndex, forward],
  );

  const goBack = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    if (current) {
      setForward((items) => [...items, { card: current, manualIndex }]);
    }
    setHistory((items) => items.slice(0, -1));
    setRetryCard(previous.card);
    setManualIndex(previous.manualIndex);
    setRevealed(false);
  };

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
      } else if (revealed && (e.key === "1" || e.key === "ArrowLeft")) {
        answer(false);
      } else if (revealed && (e.key === "2" || e.key === "ArrowRight")) {
        answer(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, revealed, answer, kanjiDrawerOpen, writingPadOpen]);

  const handleReset = () => {
    if (!window.confirm("Reset all study progress?")) return;
    resetProgress();
    setHistory([]);
    setForward([]);
    setRetryCard(null);
    setProgress({});
    setRevealed(false);
    setNow(Date.now());
    setManualIndex(null);
  };

  const jumpToIndex = (index: number) => {
    if (current && current.kanji !== CARDS[index]?.kanji) {
      setHistory((items) => [...items, { card: current, manualIndex }]);
    }
    setForward([]);
    setRetryCard(null);
    const safeIndex = Math.min(Math.max(index, 0), CARDS.length - 1);
    setManualIndex(safeIndex);
    setRevealed(false);
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
          <button className="ghost" onClick={handleReset}>
            Reset progress
          </button>
        </div>
      </header>

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
          <div className="stat">
            <div className="label">Mastered</div>
            <div className="value">{stats.mastered}</div>
          </div>
        </section>
      )}

      <div className="kanji-workspace">
        <section className="kanji-study-column">
          <div className="flashcard-navigation">
            <button type="button" className="ghost" onClick={goBack} disabled={history.length === 0}>
              <ArrowLeft aria-hidden="true" /> Back
            </button>
          </div>
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
                    Again (1)
                  </button>
                  <button className="good" onClick={() => answer(true)}>
                    Got it (2)
                    <ArrowRight aria-hidden="true" />
                  </button>
                </div>
              )}

              {revealed && <KanjiSentenceCard kanji={current.kanji} />}

              <div className="kbd-hint">
                Space/Enter reveal · 1 = retry this kanji · 2 = next kanji
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
