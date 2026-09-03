"use client";

import { useEffect, useState } from "react";
import type { CustomMeaning } from "@/lib/custom-meanings";
import type { KanjiCard } from "@/lib/srs";

type Props = {
  card: KanjiCard;
};

type MeaningsResponse = {
  ok: boolean;
  entries?: CustomMeaning[];
};

export default function KanjiRevealPanel({ card }: Props) {
  const [customMeanings, setCustomMeanings] = useState<CustomMeaning[]>([]);

  useEffect(() => {
    let cancelled = false;
    setCustomMeanings([]);

    const loadDetails = async () => {
      let response: Response;
      try {
        response = await fetch(
          `/api/meanings?kanji=${encodeURIComponent(card.kanji)}`,
          { cache: "no-store" },
        );
      } catch {
        return;
      }

      if (cancelled) return;

      try {
        const data = (await response.json()) as MeaningsResponse;
        if (response.ok && data.entries) {
          setCustomMeanings(data.entries);
        }
      } catch {
        // Keep the panel usable with the built-in card data.
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
          <h2>Meaning &amp; Vocabulary</h2>
        </div>
        <span className="reveal-details-kanji" lang="ja">
          {card.kanji}
        </span>
      </div>

      <div className="reveal-details-scroll">
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
      </div>
    </div>
  );
}
