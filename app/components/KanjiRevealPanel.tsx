"use client";

import { useEffect, useState } from "react";
import type { CustomMeaning } from "@/lib/custom-meanings";
import type { KanjiSentenceExample } from "@/lib/kanji-examples";
import type { KanjiCard } from "@/lib/srs";

type Props = {
  card: KanjiCard;
};

type MeaningsResponse = {
  ok: boolean;
  entries?: CustomMeaning[];
};

type ExamplesResponse = {
  ok: boolean;
  examples?: KanjiSentenceExample[];
};

export default function KanjiRevealPanel({ card }: Props) {
  const [customMeanings, setCustomMeanings] = useState<CustomMeaning[]>([]);
  const [sentenceExample, setSentenceExample] =
    useState<KanjiSentenceExample | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCustomMeanings([]);
    setSentenceExample(null);

    const loadDetails = async () => {
      const [meaningsResult, examplesResult] = await Promise.allSettled([
        fetch(`/api/meanings?kanji=${encodeURIComponent(card.kanji)}`, {
          cache: "no-store",
        }),
        fetch(`/api/examples?kanji=${encodeURIComponent(card.kanji)}`, {
          cache: "no-store",
        }),
      ]);

      if (cancelled) return;

      if (meaningsResult.status === "fulfilled") {
        try {
          const data = (await meaningsResult.value.json()) as MeaningsResponse;
          if (meaningsResult.value.ok && data.entries) {
            setCustomMeanings(data.entries);
          }
        } catch {
          // Keep the panel usable with the built-in card data.
        }
      }

      if (examplesResult.status === "fulfilled") {
        try {
          const data = (await examplesResult.value.json()) as ExamplesResponse;
          if (examplesResult.value.ok && data.examples) {
            setSentenceExample(data.examples[0] ?? null);
          }
        } catch {
          // Keep the empty example state when the API is unavailable.
        }
      }
    };

    void loadDetails();
    const refreshTimer = window.setInterval(loadDetails, 3000);
    window.addEventListener("focus", loadDetails);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", loadDetails);
    };
  }, [card.kanji]);

  return (
    <div className="reveal-details">
      <div className="reveal-details-header">
        <div>
          <span className="reveal-details-eyebrow">Revealed</span>
          <h2>Meaning &amp; Examples</h2>
        </div>
        <span className="reveal-details-kanji" lang="ja">
          {card.kanji}
        </span>
      </div>

      <section className="reveal-detail-section">
        <h3>意味</h3>
        <p className="reveal-meaning">{card.meanings.join(" · ")}</p>
      </section>

      {(card.example || customMeanings.length > 0) && (
        <section className="reveal-detail-section">
          <h3>単語</h3>
          <div className="reveal-vocabulary-list">
            {card.example && (
              <div className="ex-inline">
                <span className="ex-word">{card.example.word}</span>
                <span className="ex-reading">（{card.example.reading}）</span>
                <span className="ex-meaning">{card.example.meaning}</span>
              </div>
            )}
            {customMeanings.map((entry) => (
              <div
                className="ex-inline"
                key={`${entry.word}-${entry.reading}`}
              >
                <span className="ex-word">{entry.word}</span>
                <span className="ex-reading">（{entry.reading}）</span>
                <span className="ex-meaning">{entry.meaning}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="reveal-detail-section reveal-sentence-section">
        <h3>例</h3>
        {sentenceExample ? (
          <div className="sentence-example-content">
            <p className="sentence-example-japanese">
              {sentenceExample.japanese}
            </p>
            <p className="sentence-example-romaji">
              {sentenceExample.romaji}
            </p>
            <p className="sentence-example-translation">
              {sentenceExample.translation}
            </p>
          </div>
        ) : (
          <p className="sentence-example-empty">No example yet.</p>
        )}
      </section>
    </div>
  );
}
