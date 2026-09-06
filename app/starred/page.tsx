"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenText, Languages } from "lucide-react";
import rawData from "@/data/n2-kanji.json";
import KanjiFlashcard from "@/app/components/KanjiFlashcard";
import type { KanjiCard } from "@/lib/srs";
import GrammarLibrary from "@/app/components/GrammarLibrary";
import { loadStarred, saveStarred, STARRED_CHANGE_EVENT, toggleStarred } from "@/lib/starred";

const CARDS = rawData as KanjiCard[];
const CARD_BY_KANJI = new Map(CARDS.map((card) => [card.kanji, card]));

export default function StarredPage() {
  const [subject, setSubject] = useState<"kanji" | "grammar">("kanji");
  const [stars, setStars] = useState<string[]>([]);
  const kanjiCount = stars.filter((key) => CARD_BY_KANJI.has(key)).length;
  const grammarCount = stars.filter((key) => key.startsWith("grammar:")).length;
  useEffect(() => {
    const refresh = () => setStars(loadStarred());
    refresh();
    window.addEventListener(STARRED_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(STARRED_CHANGE_EVENT, refresh); window.removeEventListener("storage", refresh); };
  }, []);
  return <main className={subject === "grammar" ? "grammar-library-page" : undefined}>
    <header className="app-header">
      <div>
        <h1>Starred</h1>
        <p className="starred-header-note">Choose what you want to review.</p>
      </div>
      <span className="review-count">{kanjiCount + grammarCount} saved</span>
    </header>
    <div className="starred-subjects" aria-label="Choose starred section">
      <button type="button" className={subject === "kanji" ? "active" : ""} aria-pressed={subject === "kanji"} onClick={() => setSubject("kanji")}>
        <Languages aria-hidden="true" />
        <span><strong>Kanji</strong><small>Review saved kanji cards</small></span>
        <b>{kanjiCount}</b>
      </button>
      <button type="button" className={subject === "grammar" ? "active" : ""} aria-pressed={subject === "grammar"} onClick={() => setSubject("grammar")}>
        <BookOpenText aria-hidden="true" />
        <span><strong>Grammar</strong><small>Open saved grammar patterns</small></span>
        <b>{grammarCount}</b>
      </button>
    </div>
    {subject === "kanji" ? <StarredKanji /> : <GrammarLibrary starredOnly />}
  </main>;
}

function StarredKanji() {
  const [starred, setStarred] = useState<string[] | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

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

      if (knewIt) {
        setHistory((items) => [...items, current.kanji]);
        setQueue((items) => items.slice(1));
      }
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

    const next = toggleStarred(loadStarred(), current.kanji);
    saveStarred(next);
    setStarred(next.filter(key => CARD_BY_KANJI.has(key)));
    setHistory((items) => items.filter((kanji) => kanji !== current.kanji));
    setQueue((items) => items.filter((kanji) => kanji !== current.kanji));
    setRevealed(false);
  };

  const restart = () => {
    setHistory([]);
    setQueue(starred ?? []);
    setReviewed(0);
    setRevealed(false);
  };

  const goBack = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setQueue((items) => [previous, ...items]);
    setRevealed(false);
  };

  return (
    <section aria-label="Starred kanji review">
      <header className="app-header">
        <h2>Kanji review</h2>
        {starred && starred.length > 0 && (
          <span className="review-count">{starred.length} saved</span>
        )}
      </header>

      <div className="flashcard-navigation">
        <button type="button" className="ghost" onClick={goBack} disabled={history.length === 0}>
          <ArrowLeft aria-hidden="true" /> Back
        </button>
      </div>

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
            Again retries this kanji · Got it moves to the next kanji
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
    </section>
  );
}
