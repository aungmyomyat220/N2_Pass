type Choice = { id: number | string; text: string };
export type Question = {
  id: string;
  number: number;
  prompt?: string;
  blank?: string;
  sentenceBefore?: string;
  sentenceAfter?: string;
  starPosition?: number;
  choices?: Choice[];
  pieces?: Choice[];
  correctChoice: number | string;
  correctOrder?: number[];
  completedSentence?: string;
};

export type PowerdrillExam = {
  id: string;
  title: string;
  level: string;
  examNumber: number;
  timeLimitMinutes: number;
  maximumScore: number;
  sections: {
    id: string;
    number: number;
    type: string;
    label: string;
    instruction: string;
    pointsPerQuestion: number;
    passage?: string;
    attribution?: string;
    questions: Question[];
  }[];
};
