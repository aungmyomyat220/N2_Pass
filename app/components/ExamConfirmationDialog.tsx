"use client";

import Link from "next/link";
import { BookOpenCheck, Clock3, ListChecks, Trophy } from "lucide-react";
import type { PowerdrillExam } from "@/lib/powerdrill-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ExamConfirmationDialog({
  data,
  href,
  heading,
  open,
  onOpenChange,
}: {
  data: PowerdrillExam;
  href: string;
  heading: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const questionCount = data.sections.reduce((count, section) => count + section.questions.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="exam-confirmation-dialog">
        <DialogHeader className="exam-confirmation-header">
          <span className="exam-confirmation-icon" aria-hidden="true"><BookOpenCheck /></span>
          <div>
            <span className="exam-confirmation-eyebrow">READY TO BEGIN?</span>
            <DialogTitle>{heading}</DialogTitle>
            <DialogDescription lang="ja">{data.title}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="exam-confirmation-stats">
          <div><ListChecks aria-hidden="true" /><strong>{questionCount}</strong><span>Questions</span></div>
          <div><Clock3 aria-hidden="true" /><strong>{data.timeLimitMinutes}</strong><span>Minutes</span></div>
          <div><Trophy aria-hidden="true" /><strong>{data.maximumScore}</strong><span>Points</span></div>
        </div>
        <div className="exam-focus-rule" role="note">
          <strong>Focus rule</strong>
          <span>Changing tabs, minimizing the browser, or leaving the browser window will automatically submit your exam.</span>
        </div>
        <p className="exam-confirmation-note">The timer starts when you press Start exam. Choose one answer for each question and submit before time runs out.</p>

        <DialogFooter className="exam-confirmation-actions">
          <DialogClose render={<Button variant="outline" size="lg" />}>Cancel</DialogClose>
          <Button size="lg" nativeButton={false} render={<Link href={href} />}>Start exam</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
