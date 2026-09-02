"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Eraser, X } from "lucide-react";

type Props = {
  kanji?: string;
  onClose?: () => void;
};

type Point = {
  x: number;
  y: number;
};

const PAD_SIZE = 400;

export default function KanjiWritingPad({ kanji, onClose }: Props) {
  const activeStrokeRef = useRef<Point[] | null>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [draftStroke, setDraftStroke] = useState<Point[]>([]);
  const [showGuide, setShowGuide] = useState(true);

  const clearDrawing = () => {
    activeStrokeRef.current = null;
    setDraftStroke([]);
    setStrokes([]);
  };

  useEffect(() => {
    activeStrokeRef.current = null;
    setDraftStroke([]);
    setStrokes([]);
  }, [kanji]);

  const pointFromEvent = (event: React.PointerEvent<SVGSVGElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * PAD_SIZE,
      y: ((event.clientY - rect.top) / rect.height) * PAD_SIZE,
    };
  };

  const startDrawing = (event: React.PointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const stroke = [pointFromEvent(event)];
    activeStrokeRef.current = stroke;
    setDraftStroke(stroke);
  };

  const draw = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!activeStrokeRef.current) return;
    event.preventDefault();
    const stroke = [...activeStrokeRef.current, pointFromEvent(event)];
    activeStrokeRef.current = stroke;
    setDraftStroke(stroke);
  };

  const stopDrawing = (event: React.PointerEvent<SVGSVGElement>) => {
    const stroke = activeStrokeRef.current;
    if (!stroke) return;

    setStrokes((current) => [...current, stroke]);
    activeStrokeRef.current = null;
    setDraftStroke([]);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const visibleStrokes =
    draftStroke.length > 0 ? [...strokes, draftStroke] : strokes;
  const hasDrawing = visibleStrokes.length > 0;

  return (
    <div className="writing-pad">
      <div className="writing-pad-header">
        <div>
          <h2>Kanji Writing</h2>
          <p>Practice the current character</p>
        </div>
        <div className="writing-pad-header-actions">
          <span className="writing-current" lang="ja">
            {kanji || "漢"}
          </span>
          {onClose && (
            <button
              type="button"
              className="drawer-close writing-close"
              aria-label="Close writing pad"
              autoFocus
              onClick={onClose}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="writing-canvas-wrap">
        <div className="writing-grid" aria-hidden="true" />
        {showGuide && kanji && (
          <span className="writing-guide" aria-hidden="true" lang="ja">
            {kanji}
          </span>
        )}
        {!hasDrawing && (
          <span className="writing-hint" aria-hidden="true">
            Click and drag to write
          </span>
        )}
        <svg
          className="writing-canvas"
          viewBox={`0 0 ${PAD_SIZE} ${PAD_SIZE}`}
          role="application"
          aria-label={`Writing practice area for ${kanji || "kanji"}`}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
        >
          {visibleStrokes.map((stroke, index) =>
            stroke.length === 1 ? (
              <circle
                className="writing-stroke"
                cx={stroke[0].x}
                cy={stroke[0].y}
                r="3.5"
                key={index}
              />
            ) : (
              <polyline
                className="writing-stroke"
                points={stroke.map((point) => `${point.x},${point.y}`).join(" ")}
                key={index}
              />
            ),
          )}
        </svg>
      </div>

      <div className="writing-actions">
        <button
          type="button"
          className="writing-tool"
          onClick={() => setShowGuide((visible) => !visible)}
        >
          {showGuide ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {showGuide ? "Hide guide" : "Show guide"}
        </button>
        <button type="button" className="writing-tool" onClick={clearDrawing}>
          <Eraser aria-hidden="true" />
          Clear
        </button>
      </div>
    </div>
  );
}
