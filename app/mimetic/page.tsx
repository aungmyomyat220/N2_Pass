"use client";

import { useMemo, useState } from "react";
import data from "@/data/jlpt_n3_n2_mimetic_words_mm.json";

const LEVELS = [...new Set(data.entries.map((entry) => entry.estimated_jlpt_level))].sort();

export default function MimeticPage() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
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
    <main className="mimetic-page">
      <header className="app-header">
        <h1>Mimetic Words</h1>
        <span className="meta">{data.entries.length} words</span>
      </header>
      <p className="mimetic-intro">{data.title}</p>
      <p className="mimetic-note">{data.note}</p>

      <div className="mimetic-filters">
        <label>
          Search words
          <input className="search" type="search" value={query}
            placeholder="Japanese, Myanmar, or English…"
            onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          Estimated level
          <select value={level} onChange={(event) => setLevel(event.target.value)}>
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
        <ul className="mimetic-list">
          {entries.map((entry) => (
            <li key={entry.id} className="mimetic-word">
              <div className="mimetic-word-heading">
                <h2 lang="ja">{entry.word}</h2>
                <span className="tag">{entry.estimated_jlpt_level}</span>
                <span className="tag" lang="ja">{entry.category}</span>
              </div>
              <p className="mimetic-reading" lang="ja">{entry.reading}</p>
              <p lang="my">{entry.meaning_mm}</p>
              <p className="mimetic-english" lang="en">{entry.meaning_en}</p>
              <div className="mimetic-example">
                <span className="meta">Example</span>
                <p lang="ja">{entry.example_ja}</p>
                <p lang="my">{entry.example_mm}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
