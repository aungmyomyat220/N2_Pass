import type { KanjiCard } from "@/lib/srs";

type Props = {
  card: KanjiCard;
  revealed: boolean;
  starred: boolean;
  onReveal: () => void;
  onToggleStar: () => void;
};

export default function KanjiFlashcard({
  card,
  revealed,
  starred,
  onReveal,
  onToggleStar,
}: Props) {
  return (
    <div
      className="card"
      onClick={() => !revealed && onReveal()}
      aria-live="polite"
    >
      <button
        type="button"
        className={starred ? "star-button active" : "star-button"}
        aria-label={
          starred ? `Remove ${card.kanji} from starred` : `Star ${card.kanji}`
        }
        aria-pressed={starred}
        title={starred ? "Remove from starred" : "Save to relearn later"}
        onClick={(event) => {
          event.stopPropagation();
          onToggleStar();
        }}
      >
        {starred ? "★" : "☆"}
      </button>

      <div className="kanji">{card.kanji}</div>
      {!revealed ? (
        <div className="hint">Tap or press Space to reveal</div>
      ) : (
        <div className="answer">
          <div className="meanings">{card.meanings.join(", ")}</div>
          {card.on.length > 0 && (
            <div className="reading-row">
              <span className="tag">on</span>
              {card.on.map((reading) => (
                <span className="reading" key={reading}>
                  {reading}
                </span>
              ))}
            </div>
          )}
          {card.kun.length > 0 && (
            <div className="reading-row">
              <span className="tag">kun</span>
              {card.kun.map((reading) => (
                <span className="reading" key={reading}>
                  {reading}
                </span>
              ))}
            </div>
          )}
          {card.example && (
            <div className="ex-inline">
              <span className="ex-word">{card.example.word}</span>
              <span className="ex-reading">（{card.example.reading}）</span>
              <span className="ex-meaning">{card.example.meaning}</span>
            </div>
          )}
          <div className="meta">
            {card.strokes} strokes
            {card.freq ? ` · freq #${card.freq}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}
