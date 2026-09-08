"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { PowerdrillExam } from "@/lib/powerdrill-types";
import ExamConfirmationDialog from "./ExamConfirmationDialog";

export default function PowerdrillLessonBrowser({ lessons }: { lessons: PowerdrillExam[] }) {
  const [selected, setSelected] = useState<PowerdrillExam | null>(null);

  return (
    <>
      <div className="powerdrill-lesson-grid">
        {lessons.map((lesson) => {
          const questionCount = lesson.sections.reduce((count, section) => count + section.questions.length, 0);
          return (
            <button
              type="button"
              key={lesson.id}
              className="powerdrill-lesson-card"
              onClick={() => setSelected(lesson)}
            >
              <span className="powerdrill-lesson-number" aria-hidden="true"><small>LESSON</small><strong>{String(lesson.examNumber).padStart(2, "0")}</strong></span>
              <span className="powerdrill-lesson-content">
                <span className="powerdrill-lesson-name">Lesson {String(lesson.examNumber).padStart(2, "0")}</span>
                <span className="powerdrill-lesson-title" lang="ja">{lesson.title}</span>
                <span className="powerdrill-lesson-meta">{questionCount} questions · {lesson.timeLimitMinutes} min · {lesson.maximumScore} points</span>
              </span>
              <ArrowRight className="powerdrill-lesson-arrow" aria-hidden="true" />
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
