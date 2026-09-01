"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import rawData from "@/data/n2-kanji.json";
import KanjiFlashcard from "@/app/components/KanjiFlashcard";
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

  const current: KanjiCard | undefined = queue[0];

  const answer = useCallback(
    (knewIt: boolean) => {
      if (progress === null || !current) return;
      const next = review(progress, current.kanji, knewIt, Date.now());
      saveProgress(next);
      setProgress(next);
      setRevealed(false);
    },
    [progress, current],
  );

  // Keyboard shortcuts: Space/Enter to reveal, 1=again, 2=good.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current) return;
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
  }, [current, revealed, answer]);

  const handleReset = () => {
    if (!window.confirm("Reset all study progress?")) return;
    resetProgress();
    setProgress({});
    setRevealed(false);
    setNow(Date.now());
  };

  const handleToggleStar = () => {
    if (!current || starred === null) return;
    const next = toggleStarred(starred, current.kanji);
    saveStarred(next);
    setStarred(next);
  };

  return (
    <main>
      <header className="app-header">
        <h1>N2 Kanji Flashcards</h1>
        <button className="ghost" onClick={handleReset}>
          Reset progress
        </button>
      </header>

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
            Come back later, or reset progress to study again.
          </div>
        </div>
      )}
    </main>
  );
}
