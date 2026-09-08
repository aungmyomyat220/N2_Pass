import { notFound } from "next/navigation";
import PowerdrillExamView from "@/app/components/PowerdrillExamView";
import { getPowerdrillLessons } from "@/lib/powerdrill-lessons";

export const dynamic = "force-dynamic";

export default async function PowerdrillLessonPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  const lessons = await getPowerdrillLessons();
  const data = lessons.find((exam) => `lesson${exam.examNumber}` === lesson);
  if (!data) notFound();
  return <PowerdrillExamView key={data.id} data={data} startImmediately />;
}
