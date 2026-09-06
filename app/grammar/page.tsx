"use client";

import { useMemo, useState } from "react";
import data from "@/data/exam/grammar/lesson/power-drill-n2-grammar-lessons-01-05.json";

type Example = { jp: string; en: string };
type GrammarPoint = {
  grammar: string;
  reading: string;
  meaning: string;
  formation: string;
  explanation: string;
  examples: Example[];
  id: string;
  number: number;
  lessons: number[];
};

const GRAMMAR: GrammarPoint[] = data.grammar.map((point, index) => ({
  id: point.id, number: index + 1, grammar: point.pattern,
  reading: "", meaning: point.meaning.myanmar,
  formation: point.formations.join("\n"), explanation: "",
  lessons: point.sourceLessons,
  examples: point.examples.map((example) => ({ jp: example.japanese, en: example.myanmar })),
}));
const LESSONS = [...new Set(GRAMMAR.flatMap((point) => point.lessons))].sort((a, b) => a - b);

export default function GrammarPage() {
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [lesson, setLesson] = useState<number | null>(null);

  const selectGrammar = (index: number) => {
    setOpenIdx(index);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`grammar-point-${index}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().normalize("NFKC").toLowerCase();
    return GRAMMAR.filter((g) =>
      (lesson === null || g.lessons.includes(lesson)) &&
      [g.grammar, g.meaning, g.formation, ...g.examples.flatMap((example) => [example.jp, example.en])]
        .join(" ")
        .normalize("NFKC")
        .toLowerCase()
        .includes(q),
    );
  }, [query, lesson]);

  return (
    <main className="grammar-page grammar-lessons">
      <header className="grammar-lessons-header">
        <div><span className="grammar-eyebrow">日本語の文法 · N2</span><h1>Grammar</h1><p>Build your understanding, one pattern at a time.</p></div>
        <span className="grammar-library-stat">{GRAMMAR.length} patterns · {LESSONS.length} lessons</span>
      </header>

      <div className="grammar-lesson-tabs" aria-label="Filter by lesson">
        {[null, ...LESSONS].map((number) => <button type="button" key={number ?? "all"} aria-pressed={lesson === number} className={lesson === number ? "active" : ""} onClick={() => { setLesson(number); setOpenIdx(null); }}>{number === null ? "All lessons" : `Lesson ${String(number).padStart(2, "0")}`}<span>{number === null ? GRAMMAR.length : GRAMMAR.filter((point) => point.lessons.includes(number)).length}</span></button>)}
      </div>

      <div className="grammar-workspace">
        <section className="grammar-study-column">
          <input
            className="search"
            type="search"
            aria-label="Search grammar"
            placeholder="Search a pattern, meaning, or example…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpenIdx(null);
            }}
          />
          <p className="grammar-results-count" role="status">{filtered.length} patterns{lesson === null ? " across all lessons" : ` in Lesson ${lesson}`}</p>

          {filtered.length === 0 ? (
            <div className="empty">No grammar points match “{query}”.</div>
          ) : (
            <ul className="grammar-list">
              {filtered.map((g, i) => {
                const open = openIdx === i;
                return (
                  <li
                    id={`grammar-point-${i}`}
                    key={g.id}
                    className={open ? "grammar-item open" : "grammar-item"}
                  >
                    <button
                      className="grammar-head"
                      onClick={() => setOpenIdx(open ? null : i)}
                      aria-expanded={open}
                    >
                      <span className="item-number">{String(g.number).padStart(2, "0")}</span>
                      <span className="grammar-point-heading"><span className="g-pattern" lang="ja">{g.grammar}</span><span className="g-meaning" lang="my">{g.meaning}</span></span>
                      <span className="g-chevron">{open ? "−" : "+"}</span>
                    </button>

                    {open && (
                      <div className="grammar-body">
                        <div className="grammar-point-tags"><span>N2</span>{g.lessons.map((number) => <span key={number}>Lesson {String(number).padStart(2, "0")}</span>)}</div>
                        <div className="g-row">
                          <span className="g-label">How to use</span>
                          <span className="g-formation" lang="ja">{g.formation}</span>
                        </div>
                        {g.examples.length > 0 && (
                          <div className="examples">
                            <h2 className="grammar-examples-label">Examples</h2>
                            {g.examples.map((ex, j) => (
                              <div className="example" key={j}>
                                <div className="ex-jp" lang="ja">{ex.jp}</div>
                                <div className="ex-en" lang="my">{ex.en}</div>
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
        </section>

        <aside className="grammar-index" aria-label="Grammar quick index">
          <div className="grammar-index-header">
            <div>
              <h2>Pattern index</h2>
              <p>Jump to a grammar point</p>
            </div>
            <span>{filtered.length}</span>
          </div>
          {filtered.length === 0 ? (
            <div className="grammar-index-empty">No matching patterns</div>
          ) : (
            <nav className="grammar-index-list">
              {filtered.map((grammar, index) => (
                <button
                  type="button"
                  className={
                    openIdx === index
                      ? "grammar-index-item active"
                      : "grammar-index-item"
                  }
                  aria-current={openIdx === index ? "true" : undefined}
                  onClick={() => selectGrammar(index)}
                  key={`${grammar.grammar}-${index}`}
                >
                  <span className="index-item-main">
                    <span className="index-item-number">{String(grammar.number).padStart(2, "0")}</span>
                    <span>{grammar.grammar}</span>
                  </span>
                </button>
              ))}
            </nav>
          )}
        </aside>
      </div>
    </main>
  );
}
