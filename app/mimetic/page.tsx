import data from "@/data/jlpt_n3_n2_mimetic_words_mm.json";
import MimeticWordList from "@/app/components/MimeticWordList";

export default function MimeticPage() {
  return <MimeticWordList data={data} />;
}
