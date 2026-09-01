"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import rawData from "@/data/n2-kanji.json";
import type { KanjiCard } from "@/lib/srs";
import { buildQuiz, type QuizQuestion } from "@/lib/quiz";

const CARDS = rawData as KanjiCard[];

type Mode = "kanji" | "grammar";
type Phase = "mode" | "count" | "quiz" | "result";

const COUNT_OPTIONS = [10, 20, 50, CARDS.length];

export default function ExamPage() {
  const [phase, setPhase] = useState<Phase>("mode");
  const [mode, setMode] = useState<Mode | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const current = questions[index];
  const answered = picked !== null;
  const isLast = index === questions.length - 1;

  const startQuiz = useCallback((count: number) => {
    setQuestions(buildQuiz(CARDS, count));
    setIndex(0);
    setScore(0);
    setPicked(null);
    setPhase("quiz");
  }, []);

  const choose = useCallback(
    (optionIndex: number) => {
      if (answered || !current) return;
      setPicked(optionIndex);
      if (current.options[optionIndex].correct) setScore((s) => s + 1);
    },
    [answered, current],
  );

  const next = useCallback(() => {
    if (isLast) {
      setPhase("result");
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }, [isLast]);

  // Keyboard: 1-4 to pick an option, Space/Enter to advance once answered.
  useEffect(() => {
    if (phase !== "quiz") return;
    const onKey = (e: KeyboardEvent) => {
      if (!answered && /^[1-4]$/.test(e.key)) {
        const i = Number(e.key) - 1;
        if (current && i < current.options.length) choose(i);
      } else if (answered && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, answered, current, choose, next]);

  const restart = () => {
    setPhase("mode");
    setMode(null);
    setQuestions([]);
    setIndex(0);
    setScore(0);
    setPicked(null);
  };

  const percent = useMemo(
    () => (questions.length ? Math.round((score / questions.length) * 100) : 0),
    [score, questions.length],
  );

  return (
    <main>
      <header className="app-header">
        <h1>Exam mode</h1>
        {phase !== "mode" && (
          <button className="ghost" onClick={restart}>
            Start over
          </button>
        )}
      </header>

      {/* Step 1 — choose mode */}
      {phase === "mode" && (
        <div className="chooser">
          <div className="chooser-title">Choose a mode</div>
          <div className="mode-grid">
            <button
              className="mode-card"
              onClick={() => {
                setMode("kanji");
                setPhase("count");
              }}
            >
              <div className="mode-emoji">漢</div>
              <div className="mode-name">Kanji</div>
              <div className="mode-sub">Japanese reading quiz</div>
            </button>
            <button className="mode-card disabled" disabled>
              <div className="mode-emoji">文</div>
              <div className="mode-name">Grammar</div>
              <div className="mode-sub">Coming soon</div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — choose how many */}
      {phase === "count" && mode === "kanji" && (
        <div className="chooser">
          <div className="chooser-title">How many questions?</div>
          <div className="count-grid">
            {COUNT_OPTIONS.map((c) => (
              <button
                key={c}
                className="count-card"
                onClick={() => startQuiz(c)}
              >
                {c === CARDS.length ? `All (${c})` : c}
              </button>
            ))}
          </div>
          <button className="ghost back" onClick={() => setPhase("mode")}>
            ← Back
          </button>
        </div>
      )}

      {/* Step 3 — the quiz */}
      {phase === "quiz" && current && (
        <>
          <div className="quiz-progress">
            <span>
              Question {index + 1} / {questions.length}
            </span>
            <span>Score {score}</span>
          </div>

          <div className="quiz-prompt">
            <div className="quiz-kanji">{current.card.kanji}</div>
            <div className="quiz-ask">この漢字の読み方はどれですか？</div>
          </div>

          <div className="options">
            {current.options.map((opt, i) => {
              let cls = "option";
              if (answered) {
                if (opt.correct) cls += " correct";
                else if (i === picked) cls += " wrong";
                else cls += " dim";
              }
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => choose(i)}
                  disabled={answered}
                >
                  <span className="opt-num">{i + 1}</span>
                  <span className="opt-label">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="feedback">
              {current.card.example && (
                <div className="ex-inline">
                  <span className="ex-word">{current.card.example.word}</span>
                  <span className="ex-reading">
                    （{current.card.example.reading}）
                  </span>
                </div>
              )}
              <button className="reveal" onClick={next}>
                {isLast ? "See results" : "Next"}
              </button>
            </div>
          )}

          <div className="kbd-hint">
            1–4 to answer · Space/Enter for next
          </div>
        </>
      )}

      {/* Step 4 — result */}
      {phase === "result" && (
        <div className="result">
          <div className="result-score">
            {score} / {questions.length}
          </div>
          <div className="result-percent">{percent}%</div>
          <div className="result-msg">
            {percent >= 80
              ? "🎉 Excellent!"
              : percent >= 50
                ? "👍 Keep going!"
                : "💪 More practice needed."}
          </div>
          <div className="actions">
            <button className="good" onClick={() => setPhase("count")}>
              Choose count
            </button>
            <button className="reveal" onClick={restart}>
              New exam
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
