"use client";

import { useState } from "react";
import { BookOpenText } from "lucide-react";
import type { PowerdrillExam } from "@/lib/powerdrill-types";
import ExamConfirmationDialog from "./ExamConfirmationDialog";

export default function PowerdrillLessonBrowser({ lessons }: { lessons: PowerdrillExam[] }) {
  const [selected, setSelected] = useState<PowerdrillExam | null>(null);

  return (
    <>
      <div className="exam-subject-grid">
        {lessons.map((lesson) => {
          const questionCount = lesson.sections.reduce((count, section) => count + section.questions.length, 0);
          return (
            <button
              type="button"
              key={lesson.id}
              className="mode-card exam-subject-card powerdrill-lesson-card"
              onClick={() => setSelected(lesson)}
            >
              <span className="powerdrill-lesson-icon" aria-hidden="true"><BookOpenText /></span>
              <h2 className="mode-name">Lesson {String(lesson.examNumber).padStart(2, "0")}</h2>
              <p className="mode-sub" lang="ja">{lesson.title}</p>
              <p className="mode-sub">{questionCount} questions · {lesson.timeLimitMinutes} minutes · {lesson.maximumScore} points</p>
              <span className="exam-ready">Review &amp; start →</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <ExamConfirmationDialog
          data={selected}
          href={`/exam/grammar/powerdrill/lesson${selected.examNumber}`}
          heading={`Lesson ${String(selected.examNumber).padStart(2, "0")}`}
          open
          onOpenChange={(open) => { if (!open) setSelected(null); }}
        />
      )}
    </>
  );
}
