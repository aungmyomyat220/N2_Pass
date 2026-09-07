import source from "@/data/exam/grammar/mixed-question/power-drill-n2-intensive-training-all.json";
import type { PowerdrillExam, Question } from "./powerdrill-types";

type IntensiveTraining = {
  id: string;
  trainingNumber: number;
  title: string;
  category: string;
  timeLimitMinutes: number;
  maximumScore: number;
  type: string;
  instruction: string;
  pointsPerQuestion: number;
  questions: Question[];
};

export function getIntensiveTrainings(): PowerdrillExam[] {
  const trainings = source.trainings as IntensiveTraining[];
  const seen = new Set<number>();

  return trainings.map((training) => {
    if (!training.id || !Number.isInteger(training.trainingNumber) || seen.has(training.trainingNumber) ||
        training.timeLimitMinutes <= 0 || training.pointsPerQuestion <= 0 || !training.questions.length) {
      throw new Error(`Invalid intensive training: ${training.id}`);
    }
    seen.add(training.trainingNumber);
    const questionIds = new Set<string>();
    for (const question of training.questions) {
      if (!question.id || questionIds.has(question.id) || !question.choices?.length ||
          !question.choices.some((choice) => choice.id === question.correctChoice)) {
        throw new Error(`Invalid intensive training question: ${question.id}`);
      }
      questionIds.add(question.id);
    }
    if (training.questions.length * training.pointsPerQuestion !== training.maximumScore) {
      throw new Error(`Incorrect maximum score in intensive training ${training.trainingNumber}`);
    }

    return {
      id: training.id,
      title: training.title,
      level: source.level,
      examNumber: training.trainingNumber,
      timeLimitMinutes: training.timeLimitMinutes,
      maximumScore: training.maximumScore,
      sections: [{
        id: `${training.id}-section`,
        number: 1,
        type: training.type,
        label: training.category,
        instruction: training.instruction,
        pointsPerQuestion: training.pointsPerQuestion,
        questions: training.questions,
      }],
    };
  }).sort((a, b) => a.examNumber - b.examNumber);
}

export function getMixedIntensiveExam(): PowerdrillExam {
  const trainings = getIntensiveTrainings();
  const questions = trainings.flatMap((training) => training.sections[0].questions)
    .map((question, index) => ({ ...question, number: index + 1 }));

  return {
    id: source.id,
    title: source.title,
    level: source.level,
    examNumber: 1,
    timeLimitMinutes: source.totalTimeLimitMinutes,
    maximumScore: source.maximumScore,
    sections: [{
      id: "mixed-intensive-training",
      number: 1,
      type: "binary_choice",
      label: "集中トレーニング · Mixed All",
      instruction: "全10回の問題を混ぜています。文に合う答えを選びましょう。",
      pointsPerQuestion: 1,
      questions,
    }],
  };
}
