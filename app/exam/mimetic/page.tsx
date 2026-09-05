import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <main>
      <header className="app-header"><h1>Mimetic Words Exam</h1></header>
      <Link className="exam-back-link" href="/exam">← Back to exams</Link>
      <div className="coming-soon-panel">
        <div className="coming-soon-mark" lang="ja" aria-hidden="true">音</div>
        <h2>Mimetic Words Exam</h2>
        <p>Coming soon</p>
      </div>
    </main>
  );
}
