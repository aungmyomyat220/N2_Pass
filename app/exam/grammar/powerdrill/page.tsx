import Link from "next/link";
import { getPowerdrillLessons } from "@/lib/powerdrill-lessons";
import PowerdrillLessonBrowser from "@/app/components/PowerdrillLessonBrowser";

export const dynamic = "force-dynamic";

export default async function PowerDrillPage() {
  const lessons = await getPowerdrillLessons();
  return (
    <main className="exam-home">
      <header className="app-header"><h1>PowerDrill</h1></header>
      <Link className="exam-back-link" href="/exam/grammar">← Grammar exams</Link>
      <p className="exam-intro">Choose a lesson to review the exam details before you begin.</p>
      <PowerdrillLessonBrowser lessons={lessons} />
    </main>
  );
}
