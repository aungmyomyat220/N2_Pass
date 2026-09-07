import Link from "next/link";
import { getPowerdrillLessons } from "@/lib/powerdrill-lessons";

export const dynamic = "force-dynamic";

export default async function PowerDrillPage() {
  const lessons = await getPowerdrillLessons();
  return (
    <main className="exam-home">
      <header className="app-header"><h1>PowerDrill</h1></header>
      <Link className="exam-back-link" href="/exam/grammar">← Grammar exams</Link>
      <p className="exam-intro">Choose a lesson to start a complete grammar exam.</p>
      <div className="exam-subject-grid">
        {lessons.map((data) => (
          <Link key={data.id} className="mode-card exam-subject-card" href={`/exam/grammar/powerdrill/lesson${data.examNumber}`}>
            <span className="mode-emoji" lang="ja" aria-hidden="true">文</span>
            <h2 className="mode-name">Lesson {String(data.examNumber).padStart(2, "0")}</h2>
            <p className="mode-sub" lang="ja">{data.title}</p>
            <p className="mode-sub">{data.sections.reduce((count, section) => count + section.questions.length, 0)} questions · {data.timeLimitMinutes} minutes · {data.maximumScore} points</p>
            <span className="exam-ready">Start exam →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
