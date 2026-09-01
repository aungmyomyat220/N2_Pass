"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import type { KanjiCard } from "@/lib/srs";
import {
  isOriginalExampleHidden,
  loadCustomMeanings,
  parseMeaningBlock,
  saveCustomMeanings,
  setOriginalExampleHidden,
  type CustomMeaning,
} from "@/lib/custom-meanings";

type Props = {
  card: KanjiCard;
  revealed: boolean;
  starred: boolean;
  onReveal: () => void;
  onToggleStar: () => void;
};

type MeaningsApiResponse = {
  ok: boolean;
  entries?: CustomMeaning[];
  added?: number;
  removed?: number;
  error?: string;
};

function mergeMeanings(
  first: CustomMeaning[],
  second: CustomMeaning[],
): CustomMeaning[] {
  const seen = new Set<string>();
  return [...first, ...second].filter((entry) => {
    const key = `${entry.word}\u0000${entry.reading}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function KanjiFlashcard({
  card,
  revealed,
  starred,
  onReveal,
  onToggleStar,
}: Props) {
  const [copiedKanji, setCopiedKanji] = useState<string | null>(null);
  const [customMeanings, setCustomMeanings] = useState<CustomMeaning[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [meaningInput, setMeaningInput] = useState("");
  const [meaningError, setMeaningError] = useState<string | null>(null);
  const [meaningNotice, setMeaningNotice] = useState<string | null>(null);
  const [meaningSaving, setMeaningSaving] = useState(false);
  const [originalExampleHidden, setOriginalExampleHiddenState] = useState(false);
  const copied = copiedKanji === card.kanji;

  useEffect(() => {
    const savedMeanings = loadCustomMeanings(card.kanji);
    const savedOriginalHidden = isOriginalExampleHidden(card.kanji);
    let cancelled = false;
    setCustomMeanings(savedMeanings);
    setEditorOpen(false);
    setMeaningInput("");
    setMeaningError(null);
    setMeaningNotice(null);
    setMeaningSaving(false);
    setOriginalExampleHiddenState(savedOriginalHidden);

    const loadApiMeanings = async () => {
      let combined = savedMeanings;
      try {
        const response = await fetch(
          `/api/meanings?kanji=${encodeURIComponent(card.kanji)}`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as MeaningsApiResponse;
        if (response.ok && data.entries) {
          combined = mergeMeanings(savedMeanings, data.entries);
        }
      } catch {
        // Local meanings remain available if the API cannot be reached.
      }

      if (cancelled) return;
      setCustomMeanings(combined);
      if (combined.length === 0 && savedOriginalHidden) {
        setOriginalExampleHidden(card.kanji, false);
        setOriginalExampleHiddenState(false);
      }
    };

    void loadApiMeanings();
    return () => {
      cancelled = true;
    };
  }, [card.kanji]);

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(card.kanji);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = card.kanji;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopiedKanji(card.kanji);
    window.setTimeout(() => {
      setCopiedKanji((current) => (current === card.kanji ? null : current));
    }, 1600);
  };

  const handleSaveMeanings = async () => {
    const parsed = parseMeaningBlock(meaningInput);
    if (parsed.entries.length === 0) {
      setMeaningError(
        "Use: 領収書（りょうしゅうしょ） = receipt / ပြေစာ",
      );
      return;
    }

    const seen = new Set(
      customMeanings.map((entry) => `${entry.word}\u0000${entry.reading}`),
    );
    const newEntries = parsed.entries.filter((entry) => {
      const key = `${entry.word}\u0000${entry.reading}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (newEntries.length === 0) {
      setMeaningError("These examples are already saved.");
      return;
    }

    setMeaningSaving(true);
    setMeaningError(null);

    try {
      const response = await fetch("/api/meanings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kanji: card.kanji, entries: newEntries }),
      });
      const data = (await response.json()) as MeaningsApiResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Unable to save meanings.");
      }

      const localMeanings = loadCustomMeanings(card.kanji);
      setCustomMeanings(mergeMeanings(localMeanings, data.entries ?? []));
      setMeaningInput("");
      setEditorOpen(false);
      const skipped = parsed.invalidLines.length;
      setMeaningNotice(
        `Added ${data.added ?? newEntries.length} example${
          (data.added ?? newEntries.length) === 1 ? "" : "s"
        }${skipped ? `; skipped ${skipped} invalid line${skipped === 1 ? "" : "s"}` : ""}.`,
      );
    } catch (saveError) {
      setMeaningError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save meanings.",
      );
    } finally {
      setMeaningSaving(false);
    }
  };

  const removeMeaning = async (index: number) => {
    const entry = customMeanings[index];
    if (!entry) return;

    try {
      const response = await fetch("/api/meanings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kanji: card.kanji,
          word: entry.word,
          reading: entry.reading,
        }),
      });
      const data = (await response.json()) as MeaningsApiResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Unable to remove the example.");
      }

      const localMeanings = loadCustomMeanings(card.kanji).filter(
        (saved) =>
          saved.word !== entry.word || saved.reading !== entry.reading,
      );
      saveCustomMeanings(card.kanji, localMeanings);
      const next = customMeanings.filter(
        (saved) =>
          saved.word !== entry.word || saved.reading !== entry.reading,
      );
      setCustomMeanings(next);

      if (next.length === 0 && originalExampleHidden) {
        setOriginalExampleHidden(card.kanji, false);
        setOriginalExampleHiddenState(false);
        setMeaningNotice("Custom example removed. Original example restored.");
      } else {
        setMeaningNotice("Example removed.");
      }
    } catch (removeError) {
      setMeaningNotice(null);
      setMeaningError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove the example.",
      );
    }
  };

  const removeOriginalExample = () => {
    if (customMeanings.length === 0) return;
    setOriginalExampleHidden(card.kanji, true);
    setOriginalExampleHiddenState(true);
    setMeaningNotice("Original example removed.");
  };

  const restoreOriginalExample = () => {
    setOriginalExampleHidden(card.kanji, false);
    setOriginalExampleHiddenState(false);
    setMeaningNotice("Original example restored.");
  };

  return (
    <div
      className="card"
      onClick={() => !revealed && onReveal()}
      aria-live="polite"
    >
      <button
        type="button"
        className={starred ? "star-button active" : "star-button"}
        aria-label={
          starred ? `Remove ${card.kanji} from starred` : `Star ${card.kanji}`
        }
        aria-pressed={starred}
        title={starred ? "Remove from starred" : "Save to relearn later"}
        onClick={(event) => {
          event.stopPropagation();
          onToggleStar();
        }}
      >
        {starred ? "★" : "☆"}
      </button>

      <div className="kanji">{card.kanji}</div>
      {!revealed ? (
        <div className="hint">Tap or press Space to reveal</div>
      ) : (
        <div className="answer">
          <div className="flashcard-tools">
            <button
              type="button"
              className={copied ? "copy-kanji copied" : "copy-kanji"}
              aria-label={`Copy ${card.kanji}`}
              onClick={handleCopy}
            >
              {copied ? (
                <Check aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy kanji"}
            </button>
            <button
              type="button"
              className={editorOpen ? "meaning-add active" : "meaning-add"}
              aria-expanded={editorOpen}
              onClick={(event) => {
                event.stopPropagation();
                setEditorOpen((open) => !open);
                setMeaningError(null);
              }}
            >
              <Plus aria-hidden="true" />
              Add meanings
            </button>
          </div>

          {editorOpen && (
            <div className="meaning-editor" onClick={(event) => event.stopPropagation()}>
              <label htmlFor={`meaning-input-${card.kanji}`}>
                Paste examples for {card.kanji}
              </label>
              <textarea
                id={`meaning-input-${card.kanji}`}
                rows={6}
                autoFocus
                placeholder={`領収書（りょうしゅうしょ） = receipt / ပြေစာ\n1. **領域（りょういき）** = area, field, domain / နယ်ပယ်`}
                value={meaningInput}
                onChange={(event) => {
                  setMeaningInput(event.target.value);
                  setMeaningError(null);
                }}
              />
              <div className="meaning-format-hint">
                One example per line: Word（reading） = meaning
              </div>
              {meaningError && (
                <div className="meaning-error" role="alert">
                  {meaningError}
                </div>
              )}
              <div className="meaning-editor-actions">
                <button
                  type="button"
                  className="meaning-cancel"
                  onClick={() => {
                    setEditorOpen(false);
                    setMeaningError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="meaning-save"
                  disabled={!meaningInput.trim() || meaningSaving}
                  onClick={handleSaveMeanings}
                >
                  {meaningSaving ? "Saving…" : "Add examples"}
                </button>
              </div>
            </div>
          )}

          {meaningNotice && (
            <div className="meaning-notice" role="status">
              {meaningNotice}
            </div>
          )}
          {meaningError && !editorOpen && (
            <div className="meaning-error" role="alert">
              {meaningError}
            </div>
          )}
          <div className="meanings">{card.meanings.join(", ")}</div>
          {card.on.length > 0 && (
            <div className="reading-row">
              <span className="tag">on</span>
              {card.on.map((reading) => (
                <span className="reading" key={reading}>
                  {reading}
                </span>
              ))}
            </div>
          )}
          {card.kun.length > 0 && (
            <div className="reading-row">
              <span className="tag">kun</span>
              {card.kun.map((reading) => (
                <span className="reading" key={reading}>
                  {reading}
                </span>
              ))}
            </div>
          )}
          {card.example && !originalExampleHidden && (
            <div
              className={
                customMeanings.length > 0
                  ? "ex-inline original-meaning-item removable"
                  : "ex-inline original-meaning-item"
              }
            >
              <span className="ex-word">{card.example.word}</span>
              <span className="ex-reading">（{card.example.reading}）</span>
              <span className="ex-meaning">{card.example.meaning}</span>
              {customMeanings.length > 0 && (
                <button
                  type="button"
                  className="remove-meaning"
                  aria-label={`Remove original example ${card.example.word}`}
                  title="Remove original example"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeOriginalExample();
                  }}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          {customMeanings.length > 0 && (
            <div className="custom-meaning-list">
              {customMeanings.map((entry, index) => (
                <div
                  className="ex-inline custom-meaning-item"
                  key={`${entry.word}-${entry.reading}-${index}`}
                >
                  <span className="ex-word">{entry.word}</span>
                  <span className="ex-reading">（{entry.reading}）</span>
                  <span className="ex-meaning">{entry.meaning}</span>
                  <button
                    type="button"
                    className="remove-meaning"
                    aria-label={`Remove ${entry.word}`}
                    title="Remove example"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeMeaning(index);
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {card.example && originalExampleHidden && (
            <button
              type="button"
              className="restore-original"
              onClick={(event) => {
                event.stopPropagation();
                restoreOriginalExample();
              }}
            >
              Restore original example
            </button>
          )}
          <div className="meta">
            {card.strokes} strokes
            {card.freq ? ` · freq #${card.freq}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}
