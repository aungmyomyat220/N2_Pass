import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <main>
      <header className="app-header"><h1>Grammar Exam</h1></header>
      <Link className="exam-back-link" href="/exam">← Back to exams</Link>
      <div className="coming-soon-panel">
        <div className="coming-soon-mark" lang="ja" aria-hidden="true">文</div>
        <h2>Grammar Exam</h2>
        <p>Coming soon</p>
      </div>
    </main>
  );
}
