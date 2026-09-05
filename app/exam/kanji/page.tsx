"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import rawData from "@/data/n2-kanji.json";
import type { KanjiCard } from "@/lib/srs";
import {
  buildCompoundQuiz,
  buildQuiz,
  type QuizQuestion,
} from "@/lib/quiz";

const CARDS = rawData as KanjiCard[];

type KanjiMode = "single" | "compound";
type Phase = "choose" | "count" | "quiz" | "result";

const COUNT_OPTIONS = [10, 20, 50, CARDS.length];

export default function KanjiExamPage() {
  const [phase, setPhase] = useState<Phase>("choose");
  const [kanjiMode, setKanjiMode] = useState<KanjiMode | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const current = questions[index];
  const answered = picked !== null;
  const isLast = index === questions.length - 1;

  const clearQuiz = useCallback(() => {
    setQuestions([]);
    setIndex(0);
    setScore(0);
    setPicked(null);
  }, []);

  const startOver = () => {
    setPhase("choose");
    setKanjiMode(null);
    clearQuiz();
  };

  const startQuiz = useCallback(
    (count: number) => {
      if (!kanjiMode) return;
      const nextQuestions =
        kanjiMode === "compound"
          ? buildCompoundQuiz(CARDS, count)
          : buildQuiz(CARDS, count);
      setQuestions(nextQuestions);
      setIndex(0);
      setScore(0);
      setPicked(null);
      setPhase("quiz");
    },
    [kanjiMode],
  );

  const choose = useCallback(
    (optionIndex: number) => {
      if (answered || !current) return;
      setPicked(optionIndex);
      if (current.options[optionIndex].correct) setScore((value) => value + 1);
    },
    [answered, current],
  );

  const next = useCallback(() => {
    if (isLast) {
      setPhase("result");
      return;
    }
    setIndex((value) => value + 1);
    setPicked(null);
  }, [isLast]);

  useEffect(() => {
    if (phase !== "quiz") return;
    const onKey = (event: KeyboardEvent) => {
      if (!answered && /^[1-4]$/.test(event.key)) {
        const optionIndex = Number(event.key) - 1;
        if (current && optionIndex < current.options.length) {
          choose(optionIndex);
        }
      } else if (answered && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, answered, current, choose, next]);

  const percent = useMemo(
    () => (questions.length ? Math.round((score / questions.length) * 100) : 0),
    [score, questions.length],
  );

  return (
    <main>
      <header className="app-header">
        <h1>Kanji Exam</h1>
        {phase !== "choose" && (
          <button className="ghost" onClick={startOver}>
            Start over
          </button>
        )}
      </header>

      <Link className="exam-back-link" href="/exam">← Back to exams</Link>
      <div>
          {phase === "choose" && (
            <div className="chooser">
              <div className="chooser-title">Choose a Kanji test</div>
              <div className="mode-grid">
                <button
                  className="mode-card"
                  onClick={() => {
                    setKanjiMode("single");
                    setPhase("count");
                  }}
                >
                  <div className="mode-emoji">漢</div>
                  <div className="mode-name">Single Kanji</div>
                  <div className="mode-sub">Read one kanji at a time</div>
                </button>
                <button
                  className="mode-card"
                  onClick={() => {
                    setKanjiMode("compound");
                    setPhase("count");
                  }}
                >
                  <div className="mode-emoji compound-mark">熟語</div>
                  <div className="mode-name">Compound Kanji</div>
                  <div className="mode-sub">JLPT-style word reading</div>
                </button>
              </div>
            </div>
          )}

          {phase === "count" && kanjiMode && (
            <div className="chooser">
              <div className="chooser-title">
                {kanjiMode === "compound" ? "Compound Kanji" : "Single Kanji"}
                : How many questions?
              </div>
              <div className="count-grid">
                {COUNT_OPTIONS.map((count) => (
                  <button
                    key={count}
                    className="count-card"
                    onClick={() => startQuiz(count)}
                  >
                    {count === CARDS.length ? `All (${count})` : count}
                  </button>
                ))}
              </div>
              <button className="ghost back" onClick={startOver}>
                ← Back
              </button>
            </div>
          )}

          {phase === "quiz" && current && (
            <>
              <div className="quiz-progress">
                <span>
                  Question {index + 1} / {questions.length}
                </span>
                <span>Score {score}</span>
              </div>

              <div className="quiz-prompt">
                <div
                  className={
                    current.kind === "compound"
                      ? "quiz-kanji compound"
                      : "quiz-kanji"
                  }
                >
                  {current.prompt}
                </div>
                <div className="quiz-ask">
                  {current.kind === "compound"
                    ? "この言葉の読み方はどれですか？"
                    : "この漢字の読み方はどれですか？"}
                </div>
              </div>

              <div className="options">
                {current.options.map((option, optionIndex) => {
                  let className = "option";
                  if (answered) {
                    if (option.correct) className += " correct";
                    else if (optionIndex === picked) className += " wrong";
                    else className += " dim";
                  }
                  return (
                    <button
                      key={`${option.label}-${optionIndex}`}
                      className={className}
                      onClick={() => choose(optionIndex)}
                      disabled={answered}
                    >
                      <span className="opt-num">{optionIndex + 1}</span>
                      <span className="opt-label">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div className="feedback">
                  {current.card.example && (
                    <div className="ex-inline">
                      <span className="ex-word">
                        {current.card.example.word}
                      </span>
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
                <button className="reveal" onClick={startOver}>
                  Change test
                </button>
              </div>
            </div>
          )}
      </div>
    </main>
  );
}
