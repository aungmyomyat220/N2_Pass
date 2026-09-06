import Link from "next/link";
import data from "@/data/exam/grammar/powerdrill/power-drill-n2-exam-01.json";

export default function GrammarExamPage() {
  return (
    <main className="exam-home">
      <header className="app-header"><h1>Grammar Exam</h1></header>
      <Link className="exam-back-link" href="/exam">← Back to exams</Link>
      <p className="exam-intro">Choose a lesson to start an exam.</p>
      <div className="exam-subject-grid">
        <Link className="mode-card exam-subject-card" href="/exam/grammar/powerdrill/lesson1">
          <span className="mode-emoji" lang="ja" aria-hidden="true">文</span>
          <h2 className="mode-name">Powerdrill lesson1</h2>
          <p className="mode-sub">{data.sections.reduce((count, section) => count + section.questions.length, 0)} questions · {data.timeLimitMinutes} minutes · {data.maximumScore} points</p>
          <span className="exam-ready">Start exam →</span>
        </Link>
      </div>
    </main>
  );
}
