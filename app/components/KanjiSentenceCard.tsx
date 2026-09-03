"use client";

import { useEffect, useState } from "react";
import type { KanjiSentenceExample } from "@/lib/kanji-examples";

type Props = {
  kanji: string;
};

type ExamplesResponse = {
  ok: boolean;
  examples?: KanjiSentenceExample[];
};

export default function KanjiSentenceCard({ kanji }: Props) {
  const [example, setExample] = useState<KanjiSentenceExample | null>(null);

  useEffect(() => {
    let cancelled = false;
    setExample(null);

    const loadExample = async () => {
      try {
        const response = await fetch(
          `/api/examples?kanji=${encodeURIComponent(kanji)}`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as ExamplesResponse;
        if (!cancelled && response.ok && data.examples) {
          setExample(data.examples[0] ?? null);
        }
      } catch {
        // Keep the empty state when the API is unavailable.
      }
    };

    void loadExample();
    const refreshTimer = window.setInterval(loadExample, 3000);
    window.addEventListener("focus", loadExample);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", loadExample);
    };
  }, [kanji]);

  return (
    <section className="sentence-example study-sentence-example" aria-label="例">
      <div className="sentence-example-label">例</div>
      {example ? (
        <div className="sentence-example-content">
          <p className="sentence-example-japanese">{example.japanese}</p>
          <p className="sentence-example-romaji">{example.romaji}</p>
          <p className="sentence-example-translation">
            {example.translation}
          </p>
        </div>
      ) : (
        <p className="sentence-example-empty">No example yet.</p>
      )}
    </section>
  );
}
