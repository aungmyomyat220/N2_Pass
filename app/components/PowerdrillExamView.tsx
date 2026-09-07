"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PowerdrillExam, Question } from "@/lib/powerdrill-types";

export default function PowerdrillExamView({
  data,
  backHref = "/exam/grammar/powerdrill",
  backLabel = "PowerDrill exams",
  eyebrow = `${data.level} GRAMMAR · POWERDRILL`,
  heading = `Lesson ${String(data.examNumber).padStart(2, "0")}`,
  shuffleQuestions = false,
}: {
  data: PowerdrillExam;
  backHref?: string;
  backLabel?: string;
  eyebrow?: string;
  heading?: string;
  shuffleQuestions?: boolean;
}) {
  const totalQuestions = data.sections.reduce((count, section) => count + section.questions.length, 0);
  const [phase, setPhase] = useState<"ready" | "exam" | "result">("ready");
  const [sections, setSections] = useState(data.sections);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [remaining, setRemaining] = useState(data.timeLimitMinutes * 60);
  const deadline = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const submitted = phase === "result";
  const score = sections.reduce((sum, section) => sum + section.questions.reduce(
    (points, question) => points + (answers[question.id] === question.correctChoice ? section.pointsPerQuestion : 0), 0), 0);

  useEffect(() => {
    if (phase !== "exam") return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) setPhase("result");
    };
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (submitted) resultRef.current?.focus();
  }, [submitted]);

  function start() {
    setAnswers({});
    setSections(data.sections.map((section) => ({
      ...section,
      questions: shuffleQuestions ? shuffle(section.questions) : section.questions,
    })));
    setRemaining(data.timeLimitMinutes * 60);
    deadline.current = Date.now() + data.timeLimitMinutes * 60_000;
    setPhase("exam");
  }

  return (
    <main className="powerdrill-exam">
      <Link className="exam-back-link" href={backHref}>← {backLabel}</Link>
      <header className="powerdrill-header">
        <div><span className="powerdrill-eyebrow">{eyebrow}</span><h1>{heading}</h1><p lang="ja">{data.title}</p></div>
        <span className="powerdrill-badge">{totalQuestions} questions · {data.maximumScore} points</span>
      </header>
      {phase === "ready" ? (
        <div className="chooser">
          <p>{totalQuestions} questions · {data.timeLimitMinutes} minutes · {data.maximumScore} points</p>
          <p className="exam-intro">Choose one answer for each question. You can change answers before submitting. The exam submits automatically when time runs out.</p>
          <button className="reveal" onClick={start}>Start exam</button>
        </div>
      ) : (
        <div className="powerdrill-workspace">
          <form className="powerdrill-questions" id="powerdrill-exam-form" onSubmit={(event) => { event.preventDefault(); setPhase("result"); }}>
            {sections.map((section) => (
              <section className="powerdrill-section" key={section.id} aria-labelledby={section.id}>
                <div className="powerdrill-section-heading"><span className="powerdrill-section-number">0{section.number}</span><h2 id={section.id} lang="ja">{section.label}</h2></div>
                <p lang="ja">{section.instruction}</p>
                <p className="meta">{section.pointsPerQuestion} {section.pointsPerQuestion === 1 ? "point" : "points"} per question</p>
                {section.passage && (
                  <div className="powerdrill-passage" lang="ja">
                    <p>{section.passage.split(/(［\d+］|\[\d+\])/g).map((part, index) =>
                      /^(?:［\d+］|\[\d+\])$/.test(part)
                        ? <mark className="powerdrill-blank" key={index}>{part}</mark>
                        : part,
                    )}</p>
                    <small>{section.attribution}</small>
                  </div>
                )}
                {section.questions.map((question: Question) => {
                  const choices = question.choices ?? question.pieces ?? [];
                  const selected = answers[question.id];
                  const correct = choices.find((choice) => choice.id === question.correctChoice);
                  return (
                    <fieldset className="powerdrill-question" id={question.id} key={question.id} disabled={submitted}>
                      <legend>Question {question.number.toString().padStart(2, "0")}</legend>
                      <div className="powerdrill-prompt" lang="ja">
                        {question.prompt ?? question.blank ?? <>{question.sentenceBefore}{" "}{question.pieces?.map((_, index) => index + 1 === question.starPosition ? "＿★＿" : "＿＿＿").join(" ")}{" "}{question.sentenceAfter}</>}
                      </div>
                      <div className="options">
                        {choices.map((choice) => (
                          <label key={choice.id} className={`option${submitted ? choice.id === question.correctChoice ? " correct" : selected === choice.id ? " wrong" : " dim" : selected === choice.id ? " selected" : ""}`}>
                            <input type="radio" name={question.id} value={choice.id} checked={selected === choice.id}
                              onChange={() => {
                                if (Date.now() >= deadline.current) { setRemaining(0); setPhase("result"); return; }
                                setAnswers((previous) => ({ ...previous, [question.id]: choice.id }));
                              }} />
                            <span className="opt-num">{choice.id}</span>
                            <span className="opt-label" lang="ja">{choice.text}</span>
                          </label>
                        ))}
                      </div>
                      {submitted && (
                        <div className="feedback">
                          <p>{selected === question.correctChoice ? "Correct" : selected === undefined ? "Unanswered" : "Incorrect"} · Correct answer: {correct?.id}. <span lang="ja">{correct?.text}</span></p>
                          {question.correctOrder && <p>Correct order: {question.correctOrder.join(" → ")}</p>}
                          {question.completedSentence && <p lang="ja">{question.completedSentence}</p>}
                        </div>
                      )}
                    </fieldset>
                  );
                })}
              </section>
            ))}
            {!submitted && <button className="reveal" type="submit">Submit exam ({Object.keys(answers).length}/{totalQuestions} answered)</button>}
          </form>
          <aside className="powerdrill-summary" aria-label="Exam summary">
            <div ref={resultRef} tabIndex={-1}>
              <h2>{submitted ? remaining === 0 ? "Time is up" : "Exam results" : "Exam summary"}</h2>
              <p className="meta">Total score</p>
              <div className="powerdrill-score"><strong>{submitted ? score : "—"}</strong><span>/ {data.maximumScore}</span></div>
              {submitted ? (
                <div className="result-percent">{Math.round(score / data.maximumScore * 100)}%</div>
              ) : <p className="meta">Your score appears after submission.</p>}
              <div className="powerdrill-completion"><span>Completed</span><strong>{Object.keys(answers).length}<span> / {totalQuestions}</span></strong></div>
              <progress className="powerdrill-meter" value={Object.keys(answers).length} max={totalQuestions} aria-label="Questions answered" />
              <nav className="powerdrill-question-map" aria-label="Jump to question">
                {sections.flatMap<Question>((section) => section.questions).map((question, index) => (
                  <a key={question.id} href={`#${question.id}`} className={answers[question.id] !== undefined ? "is-answered" : ""}
                    aria-label={`Question ${index + 1}, ${answers[question.id] !== undefined ? "answered" : "unanswered"}`}>{index + 1}</a>
                ))}
              </nav>
              {!submitted && (
                <p>Time remaining <strong role="timer">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</strong></p>
              )}
              {submitted ? (
                <>
                  <p>Review your answers on the left.</p>
                  <button className="reveal" onClick={start}>Try again</button>
                </>
              ) : <button className="reveal" type="submit" form="powerdrill-exam-form">Submit exam</button>}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}
