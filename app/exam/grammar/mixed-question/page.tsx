import PowerdrillExamView from "@/app/components/PowerdrillExamView";
import { getMixedIntensiveExam } from "@/lib/intensive-training";

export default function MixedQuestionsPage() {
  const data = getMixedIntensiveExam();
  return (
    <PowerdrillExamView
      data={data}
      backHref="/exam/grammar"
      backLabel="Grammar exams"
      eyebrow="N2 GRAMMAR · MIXED QUESTIONS"
      heading="Intensive Training"
      shuffleQuestions
    />
  );
}
