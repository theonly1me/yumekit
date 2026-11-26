import { useState, type KeyboardEvent } from "react";
import {
  dropTargetProps,
  startDrag,
  type DragKind,
} from "../scenes/dragData.js";
import { clockText } from "../timeline/clock.js";
import { ChapterActions } from "./ChapterActions.js";
import type { ChapterEdits } from "./chapterEdits.js";
import { chapterStepLabels } from "./chapterSteps.js";
import type { ChapterCard, FilmChapter, FilmChapters } from "./filmChapters.js";
import "./chapters.css";

function factsOf(options: {
  chapter: FilmChapter;
  framesPerSecond: number;
}): string {
  const { chapter, framesPerSecond } = options;
  const count = chapter.cards.length;
  if (count === 0) {
    const shots = chapter.shotIds.length;
    return `Not made yet, ${String(shots)} ${shots === 1 ? "shot" : "shots"}`;
  }
  return `${clockText({ frame: chapter.lengthFrames, framesPerSecond })}, ${String(count)} ${count === 1 ? "scene" : "scenes"}`;
}

function weightOf(options: {
  chapter: FilmChapter;
  framesPerSecond: number;
}): number {
  const { chapter } = options;
  const seconds =
    chapter.cards.length === 0
      ? chapter.plannedSeconds
      : chapter.lengthFrames / options.framesPerSecond;
  return Math.max(1, seconds);
}

export function ChapterRow(props: {
  film: FilmChapters;
  framesPerSecond: number;
  pickedChapterId: string | undefined;
  pickedCard: { card: ChapterCard; title: string } | undefined;
  edits: ChapterEdits;
  onPick: (chapterId: string | undefined) => void;
  onDropScene: (drop: { clipId: string; chapterId: string }) => void;
}) {
  const { film, edits } = props;
  const [over, setOver] = useState<{ chapterId: string; kind: DragKind }>();
  const picked = film.chapters.find(
    (chapter) => chapter.id === props.pickedChapterId,
  );
  const onKeyDown = (options: { event: KeyboardEvent; index: number }) => {
    const { event } = options;
    if (!event.altKey) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const chapter = film.chapters[options.index];
    if (chapter === undefined) return;
    event.preventDefault();
    props.onPick(chapter.id);
    edits.moveChapter({
      chapterId: chapter.id,
      toIndex: options.index + (event.key === "ArrowLeft" ? -1 : 1),
    });
  };
  return (
    <div className="chapter-row">
      <ol className="chapter-blocks" aria-label="Chapters">
        {film.chapters.map((...[chapter, index]) => (
          <li
            key={chapter.id}
            style={{ flexGrow: weightOf({ chapter, ...props }) }}
          >
            <button
              type="button"
              className="chapter-block"
              draggable
              data-chapter-block={chapter.id}
              data-over={over?.chapterId === chapter.id ? over.kind : undefined}
              aria-pressed={chapter.id === props.pickedChapterId}
              onClick={() => {
                props.onPick(
                  chapter.id === props.pickedChapterId ? undefined : chapter.id,
                );
              }}
              onKeyDown={(event) => {
                onKeyDown({ event, index });
              }}
              onDragStart={(event) => {
                startDrag({ event, kind: "chapter", id: chapter.id });
              }}
              {...dropTargetProps({
                accepts: ["chapter", "scene"],
                onOver: (kind) => {
                  setOver(
                    kind === undefined
                      ? undefined
                      : { chapterId: chapter.id, kind },
                  );
                },
                onDrop: (dropped) => {
                  if (dropped.kind === "chapter") {
                    edits.moveChapter({
                      chapterId: dropped.id,
                      toIndex: index,
                    });
                    return;
                  }
                  props.onDropScene({
                    clipId: dropped.id,
                    chapterId: chapter.id,
                  });
                },
              })}
            >
              <span className="chapter-name">
                {chapter.number}. {chapter.title}
              </span>
              <span className="chapter-facts">
                {factsOf({ chapter, ...props })}
              </span>
              <span className="step-pill" data-step={chapter.step}>
                {chapterStepLabels[chapter.step]}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {picked === undefined ? undefined : (
        <ChapterActions
          key={picked.id}
          chapter={picked}
          isLast={picked.number === film.chapters.length}
          pickedCard={props.pickedCard}
          edits={edits}
        />
      )}
    </div>
  );
}
