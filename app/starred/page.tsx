"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, BookOpenText, Languages } from "lucide-react";
import rawData from "@/data/study/kanji/n2-kanji.json";
import KanjiFlashcard from "@/app/components/KanjiFlashcard";
import KanjiRevealPanel from "@/app/components/KanjiRevealPanel";
import KanjiSentenceCard from "@/app/components/KanjiSentenceCard";
import type { KanjiCard } from "@/lib/srs";
import GrammarLibrary from "@/app/components/GrammarLibrary";
import { loadStarred, saveStarred, STARRED_CHANGE_EVENT, toggleStarred } from "@/lib/starred";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  return <main className="grammar-library-page starred-page">
    <header className="starred-hero">
      <div className="starred-hero-main">
        <span className="starred-hero-icon" aria-hidden="true"><Bookmark /></span>
        <div>
          <span className="grammar-eyebrow">YOUR COLLECTION · N2</span>
          <h1>Saved Library</h1>
          <p>Everything you bookmarked, ready for focused review.</p>
        </div>
      </div>
      <div className="starred-total"><strong>{kanjiCount + grammarCount}</strong><span>Total saved</span></div>
    </header>
    <Tabs className="starred-tabs" value={subject} onValueChange={(value) => setSubject(value as "kanji" | "grammar")}>
      <TabsList className="starred-tabs-list">
        <TabsTrigger value="kanji"><Languages data-icon="inline-start" />Kanji <Badge variant="secondary">{kanjiCount}</Badge></TabsTrigger>
        <TabsTrigger value="grammar"><BookOpenText data-icon="inline-start" />Grammar <Badge variant="secondary">{grammarCount}</Badge></TabsTrigger>
      </TabsList>
      <TabsContent className="starred-tab-content" value="kanji"><StarredKanji /></TabsContent>
      <TabsContent className="starred-tab-content" value="grammar">
        <section className="starred-grammar-panel">
          <header className="starred-section-header">
            <div><span>Grammar collection</span><h2>Bookmarked patterns</h2></div>
            <Badge variant="outline">{grammarCount} saved</Badge>
          </header>
          <GrammarLibrary starredOnly />
        </section>
      </TabsContent>
    </Tabs>
  </main>;
}

function StarredKanji() {
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
  const completion = starred?.length ? ((starred.length - queue.length) / starred.length) * 100 : 0;

  const answer = useCallback(
    (knewIt: boolean) => {
      if (!current) return;

      if (knewIt) {
        setQueue((items) => items.slice(1));
      }
      setReviewed((count) => count + 1);
      setRevealed(false);
    },
    [current],
  );

  const handleToggleStar = useCallback(() => {
    if (!current || starred === null) return;

    const next = toggleStarred(loadStarred(), current.kanji);
    saveStarred(next);
    setStarred(next.filter(key => CARD_BY_KANJI.has(key)));
    setQueue((items) => items.filter((kanji) => kanji !== current.kanji));
    setRevealed(false);
  }, [current, starred]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!current) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, button, select")) return;
      if (!revealed && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        setRevealed(true);
      } else if (revealed && (["a", "1"].includes(event.key.toLowerCase()) || event.key === "ArrowLeft")) {
        event.preventDefault();
        answer(false);
      } else if (revealed && (["d", "2"].includes(event.key.toLowerCase()) || event.key === "ArrowRight")) {
        event.preventDefault();
        answer(true);
      } else if (revealed && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleToggleStar();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, revealed, answer, handleToggleStar]);

  const restart = () => {
    setQueue(starred ?? []);
    setReviewed(0);
    setRevealed(false);
  };

  return (
    <section className="starred-review-panel" aria-label="Bookmarked kanji review">
      <header className="starred-section-header">
        <div><span>Kanji collection</span><h2>Bookmark review</h2></div>
        <div className="starred-review-badges">
          <Badge variant="outline">{queue.length} left</Badge>
          <Badge variant="secondary">{reviewed} attempts</Badge>
        </div>
      </header>

      {starred && starred.length > 0 && <div className="starred-review-meter" aria-label={`${Math.round(completion)}% complete`}><span style={{ width: `${completion}%` }} /></div>}

      {starred === null ? (
        <div className="empty starred-empty">Loading bookmarks…</div>
      ) : starred.length === 0 ? (
        <div className="empty starred-empty">
          <Bookmark className="starred-empty-icon" aria-hidden="true" />
          <strong>No bookmarked Kanji yet</strong>
          <div className="empty-note">
            Tap the bookmark on a Kanji flashcard to save it here.
          </div>
        </div>
      ) : current ? (
        <div className="starred-kanji-workspace">
          <section className="starred-kanji-study">
            <KanjiFlashcard
              card={current}
              revealed={revealed}
              starred
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
              A = again · D = next · S = remove bookmark
            </div>
          </section>

          <aside className="reveal-details-panel starred-meaning-panel" aria-label="Kanji meaning and vocabulary">
            {revealed ? (
              <KanjiRevealPanel card={current} />
            ) : (
              <div className="reveal-details-placeholder">
                <span className="reveal-details-placeholder-mark" lang="ja">意</span>
                <h2>Meaning &amp; Vocabulary</h2>
                <p>Reveal the card to see its meaning and vocabulary.</p>
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="empty starred-empty">
          <div className="big">🎉</div>
          <strong>Bookmark review complete</strong>
          <div className="empty-note">You finished every saved Kanji in this session.</div>
          <button className="reveal restart-review" onClick={restart}>
            Review again
          </button>
        </div>
      )}
    </section>
  );
}
