import Link from "next/link";
import { AudioLines } from "lucide-react";
import ExamPageHeader from "@/app/components/ExamPageHeader";

export default function ComingSoonPage() {
  return (
    <main className="exam-home">
      <ExamPageHeader icon={AudioLines} eyebrow="擬音語・擬態語 · N2" title="Mimetic Words Exam" description="Practice Japanese mimetic and onomatopoeic words." stat="Soon" statLabel="Coming soon" />
      <Link className="exam-back-link" href="/exam">← Back to exams</Link>
      <div className="coming-soon-panel">
        <div className="coming-soon-mark" lang="ja" aria-hidden="true">音</div>
        <h2>Mimetic Words Exam</h2>
        <p>Coming soon</p>
      </div>
    </main>
  );
}
