import KanjiStudyPage from "@/app/components/KanjiStudyPage";
import shapeOrderedData from "@/data/study/kanji/n2-kanji-shape-ordered.json";
import type { KanjiCard } from "@/lib/srs";

export default function SamePatternKanjiPage() {
  return (
    <KanjiStudyPage
      cards={shapeOrderedData as KanjiCard[]}
      title="N2 Kanji · Same Pattern"
      progressDeck="same-pattern"
    />
  );
}
