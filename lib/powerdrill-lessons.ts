import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { PowerdrillExam } from "./powerdrill-types";

export async function getPowerdrillLessons(): Promise<PowerdrillExam[]> {
  const directory = path.join(process.cwd(), "data/exam/grammar/powerdrill");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".json"));
  const lessons = await Promise.all(files.map(async (file) => {
    const exam: PowerdrillExam = JSON.parse(await readFile(path.join(directory, file), "utf8"));
    if (!exam.id || !exam.title || !Number.isInteger(exam.examNumber) || exam.examNumber < 1 ||
        !(exam.timeLimitMinutes > 0) || !Array.isArray(exam.sections) || !exam.sections.length) {
      throw new Error(`Invalid Powerdrill lesson metadata in ${file}`);
    }
    const ids = new Set<string>();
    let maximumScore = 0;
    for (const section of exam.sections) {
      if (!Array.isArray(section.questions) || !section.questions.length || !(section.pointsPerQuestion > 0)) {
        throw new Error(`Invalid Powerdrill section in ${file}`);
      }
      for (const question of section.questions) {
        const choices = question.choices ?? question.pieces;
        if (!question.id || ids.has(question.id) || !Array.isArray(choices) || choices.length !== 4 ||
            !choices.some((choice) => choice.id === question.correctChoice)) {
          throw new Error(`Invalid Powerdrill question in ${file}: ${question.id}`);
        }
        ids.add(question.id);
        maximumScore += section.pointsPerQuestion;
      }
    }
    if (maximumScore !== exam.maximumScore) throw new Error(`Incorrect maximumScore in ${file}`);
    return exam;
  }));
  if (new Set(lessons.map((exam) => exam.examNumber)).size !== lessons.length) {
    throw new Error("Powerdrill JSON files must have unique examNumber values");
  }
  return lessons.sort((a, b) => a.examNumber - b.examNumber);
}
