"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AudioLines } from "lucide-react";

type MimeticData = {
  title: string;
  entries: {
    id: number;
    word: string;
    reading: string;
    estimated_jlpt_level: string;
    category: string;
    meaning_mm: string;
    meaning_en: string;
    example_ja: string;
    example_mm: string;
  }[];
};

export default function MimeticWordList({ data, title = "Mimetic Words", backLink }: {
  data: MimeticData;
  title?: string;
  backLink?: { href: string; label: string };
}) {
  const levels = [...new Set(data.entries.map((entry) => entry.estimated_jlpt_level))].sort();
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
  }, [data, query, level]);

  return (
    <main className="grammar-page mimetic-page">
      <header className="starred-hero mimetic-library-hero">
        <div className="starred-hero-main">
          <span className="starred-hero-icon" aria-hidden="true"><AudioLines /></span>
          <div>
            <span className="grammar-eyebrow">擬音語・擬態語 · N3/N2</span>
            <h1>{title}</h1>
            <p>{data.title}</p>
          </div>
        </div>
        <div className="starred-total"><strong>{data.entries.length}</strong><span>Mimetic words</span></div>
      </header>
      {backLink && <Link className="exam-back-link" href={backLink.href}>{backLink.label}</Link>}

      <div className="grammar-workspace">
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
                  <span className="index-item-main">
                    <span className="index-item-number">{entry.id}</span>
                    <span lang="ja">{entry.word}</span>
                  </span>
                  <small lang="ja">{entry.reading}</small>
                </button>
              ))}
            </nav>
          )}
        </aside>

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
                {levels.map((value) => <option key={value} value={value}>{value}</option>)}
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
                      <span className="item-number">{entry.id}</span>
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
      </div>
    </main>
  );
}
