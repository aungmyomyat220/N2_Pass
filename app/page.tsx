import KanjiStudyPage from "@/app/components/KanjiStudyPage";
import normalData from "@/data/study/kanji/n2-kanji.json";
import type { KanjiCard } from "@/lib/srs";

export default function Home() {
  return <KanjiStudyPage cards={normalData as KanjiCard[]} progressDeck="normal" />;
}
