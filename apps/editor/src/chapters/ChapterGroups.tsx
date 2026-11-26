import { useState, type ReactNode } from "react";
import { dropTargetProps, startDrag } from "../scenes/dragData.js";
import type { ChapterEdits } from "./chapterEdits.js";
import type { FilmChapter, FilmChapters } from "./filmChapters.js";
import { lineStopsOf, steppedLine } from "./lineStops.js";

export function ChapterLine(props: {
  film: FilmChapters;
  leftId: string;
  edits: ChapterEdits;
}) {
  const line = lineStopsOf(props);
  if (line === undefined) return undefined;
  const leftNumber = line.rightNumber - 1;
  return (
    <li
      className="chapter-line"
      draggable
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
      aria-label={`Line between chapter ${String(leftNumber)} and chapter ${String(line.rightNumber)}`}
      aria-valuemin={0}
      aria-valuemax={line.stops.length}
      aria-valuenow={line.current === -1 ? line.stops.length : line.current}
      title="Drag onto a scene to move the line"
      onDragStart={(event) => {
        startDrag({ event, kind: "line", id: line.leftId });
      }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const stop = steppedLine({
          line,
          by: event.key === "ArrowLeft" ? -1 : 1,
        });
        if (stop?.shotId === undefined) return;
        props.edits.moveLine({ leftId: line.leftId, firstShotId: stop.shotId });
      }}
    >
      <span />
    </li>
  );
}

export function ChapterGroup(props: {
  chapter: FilmChapter;
  children: ReactNode;
  onDropScene: (drop: { clipId: string; chapterId: string }) => void;
}) {
  const { chapter } = props;
  const [isOver, setOver] = useState(false);
  return (
    <li className="card-group" data-group={chapter.id}>
      <p className="group-label">
        {chapter.number}. {chapter.title}
      </p>
      <ol className="group-cards">
        {chapter.cards.length > 0 ? (
          props.children
        ) : (
          <li
            className="group-empty"
            data-over={isOver}
            {...dropTargetProps({
              accepts: ["scene"],
              onOver: (kind) => {
                setOver(kind !== undefined);
              },
              onDrop: (dropped) => {
                props.onDropScene({
                  clipId: dropped.id,
                  chapterId: chapter.id,
                });
              },
            })}
          >
            Not made yet
          </li>
        )}
      </ol>
    </li>
  );
}
