"use client";

import { useState } from "react";
import type { PowerdrillExam } from "@/lib/powerdrill-types";
import ExamConfirmationDialog from "./ExamConfirmationDialog";

export default function MixedQuestionLauncher({ data, trainingCount }: { data: PowerdrillExam; trainingCount: number }) {
  const [open, setOpen] = useState(false);
  const questionCount = data.sections.reduce((count, section) => count + section.questions.length, 0);

  return (
    <>
      <button type="button" className="mode-card exam-subject-card" onClick={() => setOpen(true)}>
        <span className="mode-emoji" lang="ja" aria-hidden="true">集</span>
        <h2 className="mode-name">Mixed Questions</h2>
        <p className="mode-sub" lang="ja">集中トレーニング</p>
        <p className="mode-sub">{trainingCount} trainings · {questionCount} questions</p>
        <span className="exam-ready">Review &amp; start →</span>
      </button>
      <ExamConfirmationDialog
        data={data}
        href="/exam/grammar/mixed-question"
        heading="Intensive Training"
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
