"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Star } from "lucide-react";
import { grammarStarKey, loadStarred, saveStarred, STARRED_CHANGE_EVENT, toggleStarred } from "@/lib/starred";
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

export default function GrammarLibrary({ starredOnly = false }: { starredOnly?: boolean }) {
  const [stars, setStars] = useState<string[]>([]);
  const [copyStatus, setCopyStatus] = useState("");
  useEffect(() => {
    const refresh = () => setStars(loadStarred());
    refresh();
    window.addEventListener(STARRED_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(STARRED_CHANGE_EVENT, refresh); window.removeEventListener("storage", refresh); };
  }, []);
  async function copyGrammar(point: GrammarPoint) {
    try {
      await navigator.clipboard.writeText([point.grammar, point.meaning, "", point.formation, "", ...point.examples.map(ex => `${ex.jp}\n${ex.en}`)].join("\n"));
      setCopyStatus(`Copied ${point.grammar}`);
    } catch { setCopyStatus("Could not copy. Select the grammar text and copy it manually."); }
  }
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<string | null>(null);
  const [lesson, setLesson] = useState<number | null>(null);

  const selectGrammar = (index: string) => {
    setOpenIdx(index);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`grammar-point-${index}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const available = useMemo(() => GRAMMAR.filter(g => !starredOnly || stars.includes(grammarStarKey(g.id))), [stars, starredOnly]);

  const filtered = useMemo(() => {
    const q = query.trim().normalize("NFKC").toLowerCase();
    return available.filter((g) =>
      (lesson === null || g.lessons.includes(lesson)) &&
      [g.grammar, g.meaning, g.formation, ...g.examples.flatMap((example) => [example.jp, example.en])]
        .join(" ")
        .normalize("NFKC")
        .toLowerCase()
        .includes(q),
    );
  }, [query, lesson, available]);

  return (
    <section className="grammar-page grammar-lessons">
      {!starredOnly && <header className="grammar-lessons-header">
        <div><span className="grammar-eyebrow">日本語の文法 · N2</span><h1>Grammar</h1><p>Build your understanding, one pattern at a time.</p></div>
        <span className="grammar-library-stat grammar-stat">{GRAMMAR.length} patterns · {LESSONS.length} lessons</span>
      </header>}

      <p className="grammar-copy-status" role="status">{copyStatus}</p>
      {!starredOnly && <div className="grammar-lesson-filter">
        <label htmlFor={starredOnly ? "starred-grammar-lesson" : "grammar-lesson"}>
          Lesson
        </label>
        <select
          id={starredOnly ? "starred-grammar-lesson" : "grammar-lesson"}
          value={lesson ?? "all"}
          onChange={(event) => {
            setLesson(event.target.value === "all" ? null : Number(event.target.value));
            setOpenIdx(null);
          }}
        >
          <option value="all">All lessons ({available.length})</option>
          {LESSONS.map((number) => (
            <option value={number} key={number}>
              Lesson {String(number).padStart(2, "0")} ({available.filter((point) => point.lessons.includes(number)).length})
            </option>
          ))}
        </select>
      </div>}

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
            <div className="empty">{starredOnly && !stars.some(key => key.startsWith("grammar:")) ? "No starred grammar yet. Tap a star in Grammar to save a pattern here." : `No grammar points match “${query}”.`}</div>
          ) : (
            <ul className="grammar-list">
              {filtered.map((g) => {
                const open = openIdx === g.id;
                const starred = stars.includes(grammarStarKey(g.id));
                return (
                  <li
                    id={`grammar-point-${g.id}`}
                    key={g.id}
                    className={`grammar-item${open ? " open" : ""}${starred ? " grammar-starred" : ""}`}
                  >
                    <div className="grammar-heading-row">
                    <button
                      className="grammar-head"
                      onClick={() => setOpenIdx(open ? null : g.id)}
                      aria-expanded={open}
                    >
                      <span className="item-number">{String(g.number).padStart(2, "0")}</span>
                      <span className="grammar-point-heading"><span className="g-pattern" lang="ja">{g.grammar}</span><span className="g-meaning" lang="my">{g.meaning}</span></span>
                      <span className="g-chevron">{open ? "−" : "+"}</span>
                    </button>

                    <div className="grammar-card-actions">
                      <button type="button" aria-label={`Copy ${g.grammar}`} title="Copy grammar, meaning and examples" onClick={() => void copyGrammar(g)}><Copy aria-hidden="true" /></button>
                      <button type="button" className={starred ? "active" : ""} aria-label={`${starred ? "Unstar" : "Star"} ${g.grammar}`} aria-pressed={starred} onClick={() => saveStarred(toggleStarred(loadStarred(), grammarStarKey(g.id)))}><Star aria-hidden="true" fill={starred ? "currentColor" : "none"} /></button>
                    </div>
                    </div>
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
              {filtered.map((grammar) => (
                <button
                  type="button"
                  className={`grammar-index-item${openIdx === grammar.id ? " active" : ""}${stars.includes(grammarStarKey(grammar.id)) ? " grammar-index-starred" : ""}`}
                  aria-current={openIdx === grammar.id ? "true" : undefined}
                  onClick={() => selectGrammar(grammar.id)}
                  key={grammar.id}
                >
                  <span className="index-item-main">
                    <span className="index-item-number">{String(grammar.number).padStart(2, "0")}</span>
                    <span>{grammar.grammar}</span>
                    {stars.includes(grammarStarKey(grammar.id)) && <Star size={14} fill="currentColor" aria-label="Starred" />}
                  </span>
                </button>
              ))}
            </nav>
          )}
        </aside>
      </div>
    </section>
  );
}
