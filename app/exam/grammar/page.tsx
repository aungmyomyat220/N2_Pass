import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { getPowerdrillLessons } from "@/lib/powerdrill-lessons";
import { getIntensiveTrainings, getMixedIntensiveExam } from "@/lib/intensive-training";
import ExamPageHeader from "@/app/components/ExamPageHeader";
import MixedQuestionLauncher from "@/app/components/MixedQuestionLauncher";

export const dynamic = "force-dynamic";

export default async function GrammarExamPage() {
  const lessons = await getPowerdrillLessons();
  const trainings = getIntensiveTrainings();
  const mixedExam = getMixedIntensiveExam();
  return (
    <main className="exam-home">
      <ExamPageHeader icon={BookOpenText} eyebrow="文法試験 · N2" title="Grammar Exam" description="Choose PowerDrill lessons or mixed-question intensive training." stat="2" statLabel="Practice modes" />
      <Link className="exam-back-link" href="/exam">← Back to exams</Link>
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
