"use client";

import { useMemo, useState } from "react";
import rawGrammar from "@/data/n2-grammar.json";

type Example = { jp: string; en: string };
type GrammarPoint = {
  grammar: string;
  reading: string;
  meaning: string;
  formation: string;
  explanation: string;
  examples: Example[];
};

const GRAMMAR = rawGrammar as GrammarPoint[];

export default function GrammarPage() {
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GRAMMAR;
    return GRAMMAR.filter((g) =>
      [g.grammar, g.reading, g.meaning, g.explanation]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  return (
    <main>
      <header className="app-header">
        <h1>N2 Grammar</h1>
        <span className="meta">{GRAMMAR.length} points</span>
      </header>

      <input
        className="search"
        type="search"
        placeholder="Search by pattern, reading, or meaning…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpenIdx(null);
        }}
      />

      {filtered.length === 0 ? (
        <div className="empty">No grammar points match “{query}”.</div>
      ) : (
        <ul className="grammar-list">
          {filtered.map((g, i) => {
            const open = openIdx === i;
            return (
              <li
                key={g.grammar + i}
                className={open ? "grammar-item open" : "grammar-item"}
              >
                <button
                  className="grammar-head"
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                >
                  <span className="g-pattern">{g.grammar}</span>
                  <span className="g-meaning">{g.meaning}</span>
                  <span className="g-chevron">{open ? "−" : "+"}</span>
                </button>

                {open && (
                  <div className="grammar-body">
                    <div className="g-row">
                      <span className="g-label">Reading</span>
                      <span>{g.reading}</span>
                    </div>
                    <div className="g-row">
                      <span className="g-label">Formation</span>
                      <span className="g-formation">{g.formation}</span>
                    </div>
                    <p className="g-explanation">{g.explanation}</p>
                    {g.examples.length > 0 && (
                      <div className="examples">
                        {g.examples.map((ex, j) => (
                          <div className="example" key={j}>
                            <div className="ex-jp">{ex.jp}</div>
                            <div className="ex-en">{ex.en}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
