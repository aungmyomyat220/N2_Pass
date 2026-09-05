import Link from "next/link";

const SUBJECTS = [
  { slug: "kanji", title: "Kanji", mark: "漢", description: "Practice single kanji and compound readings.", soon: false },
  { slug: "grammar", title: "Grammar", mark: "文", description: "Practice Japanese grammar.", soon: true },
  { slug: "mimetic", title: "Mimetic Words", mark: "音", description: "Practice mimetic and onomatopoeic words.", soon: true },
];

export default function ExamPage() {
  return (
    <main className="exam-home">
      <header className="app-header"><h1>Exam</h1></header>
      <p className="exam-intro">Choose a subject to practice.</p>
      <div className="exam-subject-grid">
        {SUBJECTS.map((subject) => (
          <Link className="mode-card exam-subject-card" href={`/exam/${subject.slug}`} key={subject.slug}>
            <span className="mode-emoji" lang="ja" aria-hidden="true">{subject.mark}</span>
            <h2 className="mode-name">{subject.title}</h2>
            <p className="mode-sub">{subject.description}</p>
            <span className={subject.soon ? "coming-badge" : "exam-ready"}>
              {subject.soon ? "Coming soon" : "Start exam →"}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
