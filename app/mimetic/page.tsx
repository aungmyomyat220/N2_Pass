"use client";

import { useMemo, useState } from "react";
import data from "@/data/jlpt_n3_n2_mimetic_words_mm.json";

const LEVELS = [...new Set(data.entries.map((entry) => entry.estimated_jlpt_level))].sort();

export default function MimeticPage() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const selectWord = (id: number) => {
    setOpenId(id);
    window.requestAnimationFrame(() => {
      document.getElementById(`mimetic-word-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const entries = useMemo(() => {
    const search = query.trim().normalize("NFKC").toLowerCase();
    return data.entries.filter((entry) =>
      (!level || entry.estimated_jlpt_level === level) &&
      [entry.word, entry.reading, entry.category, entry.meaning_mm,
        entry.meaning_en, entry.example_ja, entry.example_mm]
        .join(" ").normalize("NFKC").toLowerCase().includes(search),
    );
  }, [query, level]);

  return (
    <main className="grammar-page mimetic-page">
      <header className="app-header">
        <h1>Mimetic Words</h1>
        <span className="meta">{data.entries.length} words</span>
      </header>
      <p className="mimetic-intro">{data.title}</p>
      <p className="mimetic-note">{data.note}</p>

      <div className="grammar-workspace">
        <section className="grammar-study-column">
          <div className="mimetic-filters">
            <label>
              Search words
              <input className="search" type="search" value={query}
                placeholder="Japanese, Myanmar, or English…"
                onChange={(event) => { setQuery(event.target.value); setOpenId(null); }} />
            </label>
            <label>
              Estimated level
              <select value={level} onChange={(event) => { setLevel(event.target.value); setOpenId(null); }}>
                <option value="">All levels</option>
                {LEVELS.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>

          <p className="meta" role="status">{entries.length} of {data.entries.length} words</p>
          {entries.length === 0 ? (
            <div className="empty">
              <p>No words match your search and level.</p>
              <button type="button" className="ghost" onClick={() => { setQuery(""); setLevel(""); }}>
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="grammar-list">
              {entries.map((entry) => {
                const open = openId === entry.id;
                return (
                  <li key={entry.id} id={`mimetic-word-${entry.id}`}
                    className={open ? "grammar-item open" : "grammar-item"}>
                    <button type="button" className="grammar-head"
                      onClick={() => setOpenId(open ? null : entry.id)}
                      aria-expanded={open}>
                      <span className="g-pattern" lang="ja">{entry.word}</span>
                      <span className="g-meaning" lang="my">{entry.meaning_mm}</span>
                      <span className="g-chevron" aria-hidden="true">{open ? "−" : "+"}</span>
                    </button>
                    {open && (
                      <div className="grammar-body">
                        <div className="g-row">
                          <span className="g-label">Reading</span>
                          <span lang="ja">{entry.reading}</span>
                        </div>
                        <div className="g-row">
                          <span className="g-label">Est. level</span>
                          <span>{entry.estimated_jlpt_level}</span>
                        </div>
                        <div className="g-row">
                          <span className="g-label">Category</span>
                          <span lang="ja">{entry.category}</span>
                        </div>
                        <p className="g-explanation" lang="en">{entry.meaning_en}</p>
                        <div className="examples">
                          <div className="example">
                            <div className="ex-jp" lang="ja">{entry.example_ja}</div>
                            <div className="ex-en" lang="my">{entry.example_mm}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <aside className="grammar-index" aria-label="Mimetic words quick index">
          <div className="grammar-index-header">
            <div>
              <h2>Word Index</h2>
              <p>Jump to a mimetic word</p>
            </div>
            <span>{entries.length}</span>
          </div>
          {entries.length === 0 ? (
            <div className="grammar-index-empty">No matching words</div>
          ) : (
            <nav className="grammar-index-list">
              {entries.map((entry) => (
                <button type="button" key={entry.id}
                  className={openId === entry.id ? "grammar-index-item active" : "grammar-index-item"}
                  aria-current={openId === entry.id ? "true" : undefined}
                  onClick={() => selectWord(entry.id)}>
                  <span lang="ja">{entry.word}</span>
                  <small lang="ja">{entry.reading}</small>
                </button>
              ))}
            </nav>
          )}
        </aside>
      </div>
    </main>
  );
}
