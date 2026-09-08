import Link from "next/link";
import { getPowerdrillLessons } from "@/lib/powerdrill-lessons";
import { getIntensiveTrainings, getMixedIntensiveExam } from "@/lib/intensive-training";
import MixedQuestionLauncher from "@/app/components/MixedQuestionLauncher";

export const dynamic = "force-dynamic";

export default async function GrammarExamPage() {
  const lessons = await getPowerdrillLessons();
  const trainings = getIntensiveTrainings();
  const mixedExam = getMixedIntensiveExam();
  return (
    <main className="exam-home">
      <header className="app-header"><h1>Grammar Exam</h1></header>
      <Link className="exam-back-link" href="/exam">← Back to exams</Link>
      <p className="exam-intro">Choose PowerDrill lessons or short mixed-question intensive training.</p>
      <div className="exam-subject-grid">
        <Link className="mode-card exam-subject-card" href="/exam/grammar/powerdrill">
          <span className="mode-emoji" lang="ja" aria-hidden="true">文</span>
          <h2 className="mode-name">PowerDrill</h2>
          <p className="mode-sub">Practice complete grammar exams lesson by lesson.</p>
          <p className="mode-sub">{lessons.length} lessons</p>
          <span className="exam-ready">Choose lesson →</span>
        </Link>
        <MixedQuestionLauncher data={mixedExam} trainingCount={trainings.length} />
      </div>
    </main>
  );
}
