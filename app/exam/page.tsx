import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import ExamPageHeader from "@/app/components/ExamPageHeader";

const SUBJECTS = [
  { slug: "kanji", title: "Kanji", mark: "漢", description: "Practice single kanji and compound readings.", soon: false },
  { slug: "grammar", title: "Grammar", mark: "文", description: "Study Powerdrill lessons.", soon: false },
  { slug: "mimetic", title: "Mimetic Words", mark: "音", description: "Practice mimetic and onomatopoeic words.", soon: true },
];

export default function ExamPage() {
  return (
    <main className="exam-home">
      <ExamPageHeader icon={ClipboardCheck} eyebrow="試験練習 · N2" title="Exam" description="Choose a subject and test what you have learned." stat={SUBJECTS.length} statLabel="Practice subjects" />
      <div className="exam-subject-grid">
        {SUBJECTS.map((subject) => (
          <Link className="mode-card exam-subject-card" href={`/exam/${subject.slug}`} key={subject.slug}>
            <span className="mode-emoji" lang="ja" aria-hidden="true">{subject.mark}</span>
            <h2 className="mode-name">{subject.title}</h2>
            <p className="mode-sub">{subject.description}</p>
            <span className={subject.soon ? "coming-badge" : "exam-ready"}>
              {subject.soon ? "Coming soon" : subject.slug === "grammar" ? "Choose lesson →" : "Start exam →"}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
