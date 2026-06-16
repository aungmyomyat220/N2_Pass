"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import rawData from "@/data/n2-kanji.json";
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

const CARDS = rawData as KanjiCard[];

export default function Home() {
  // `null` until we've hydrated from localStorage, so SSR and first client
  // render agree (avoids hydration mismatch).
  const [progress, setProgress] = useState<ProgressMap | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setProgress(loadProgress());
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
          <div
            className="card"
            onClick={() => !revealed && setRevealed(true)}
          >
            <div className="kanji">{current.kanji}</div>
            {!revealed ? (
              <div className="hint">Tap or press Space to reveal</div>
            ) : (
              <div className="answer">
                <div className="meanings">{current.meanings.join(", ")}</div>
                {current.on.length > 0 && (
                  <div className="reading-row">
                    <span className="tag">on</span>
                    {current.on.map((r) => (
                      <span className="reading" key={r}>
                        {r}
                      </span>
                    ))}
                  </div>
                )}
                {current.kun.length > 0 && (
                  <div className="reading-row">
                    <span className="tag">kun</span>
                    {current.kun.map((r) => (
                      <span className="reading" key={r}>
                        {r}
                      </span>
                    ))}
                  </div>
                )}
                {current.example && (
                  <div className="ex-inline">
                    <span className="ex-word">{current.example.word}</span>
                    <span className="ex-reading">
                      （{current.example.reading}）
                    </span>
                    <span className="ex-meaning">{current.example.meaning}</span>
                  </div>
                )}
                <div className="meta">
                  {current.strokes} strokes
                  {current.freq ? ` · freq #${current.freq}` : ""}
                </div>
              </div>
            )}
          </div>

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
