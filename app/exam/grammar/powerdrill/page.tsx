import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { getPowerdrillLessons } from "@/lib/powerdrill-lessons";
import ExamPageHeader from "@/app/components/ExamPageHeader";
import PowerdrillLessonBrowser from "@/app/components/PowerdrillLessonBrowser";

export const dynamic = "force-dynamic";

export default async function PowerDrillPage() {
  const lessons = await getPowerdrillLessons();
  return (
    <main className="exam-home">
      <ExamPageHeader icon={BookOpenCheck} eyebrow="文法集中 · N2" title="PowerDrill" description="Choose a lesson and review its details before you begin." stat={lessons.length} statLabel="Exam lessons" />
      <Link className="exam-back-link" href="/exam/grammar">← Grammar exams</Link>
      <PowerdrillLessonBrowser lessons={lessons} />
    </main>
  );
}
