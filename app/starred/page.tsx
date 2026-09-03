"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import rawData from "@/data/n2-kanji.json";
import KanjiFlashcard from "@/app/components/KanjiFlashcard";
import type { KanjiCard } from "@/lib/srs";
import { loadStarred, saveStarred, toggleStarred } from "@/lib/starred";

const CARDS = rawData as KanjiCard[];
const CARD_BY_KANJI = new Map(CARDS.map((card) => [card.kanji, card]));

export default function StarredPage() {
  const [starred, setStarred] = useState<string[] | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    const saved = loadStarred().filter((kanji) => CARD_BY_KANJI.has(kanji));
    setStarred(saved);
    setQueue(saved);
  }, []);

  const current = useMemo(
    () => (queue[0] ? CARD_BY_KANJI.get(queue[0]) : undefined),
    [queue],
  );

  const answer = useCallback(
    (knewIt: boolean) => {
      if (!current) return;

      setQueue((items) =>
        knewIt ? items.slice(1) : [...items.slice(1), current.kanji],
      );
      setReviewed((count) => count + 1);
      setRevealed(false);
    },
    [current],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!current) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, button, select")) return;
      if (!revealed && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        setRevealed(true);
      } else if (revealed && (event.key === "1" || event.key === "ArrowLeft")) {
        answer(false);
      } else if (revealed && (event.key === "2" || event.key === "ArrowRight")) {
        answer(true);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, revealed, answer]);

  const handleToggleStar = () => {
    if (!current || starred === null) return;

    const next = toggleStarred(starred, current.kanji);
    saveStarred(next);
    setStarred(next);
    setQueue((items) => items.filter((kanji) => kanji !== current.kanji));
    setRevealed(false);
  };

  const restart = () => {
    setQueue(starred ?? []);
    setReviewed(0);
    setRevealed(false);
  };

  return (
    <main>
      <header className="app-header">
        <h1>Starred Kanji</h1>
        {starred && starred.length > 0 && (
          <span className="review-count">{starred.length} saved</span>
        )}
      </header>

      {starred === null ? (
        <div className="empty">Loading…</div>
      ) : starred.length === 0 ? (
        <div className="empty">
          <div className="big">☆</div>
          <div>No starred kanji yet.</div>
          <div className="empty-note">
            Tap the star on a kanji flashcard to save it here for later.
          </div>
        </div>
      ) : current ? (
        <>
          <div className="review-progress">
            <span>{queue.length} left in this review</span>
            <span>{reviewed} answers</span>
          </div>

          <KanjiFlashcard
            card={current}
            revealed={revealed}
            starred
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

          <div className="kbd-hint">
            Again keeps it in this review · Got it finishes it for this session
          </div>
        </>
      ) : (
        <div className="empty">
          <div className="big">🎉</div>
          <div>Starred review complete.</div>
          <button className="reveal restart-review" onClick={restart}>
            Review again
          </button>
        </div>
      )}
    </main>
  );
}
