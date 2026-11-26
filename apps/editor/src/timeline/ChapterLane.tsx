import { useRef, useState, type RefObject } from "react";
import type { ChapterEdits } from "../chapters/chapterEdits.js";
import { chapterStepLabels } from "../chapters/chapterSteps.js";
import type { FilmChapter, FilmChapters } from "../chapters/filmChapters.js";
import { lineStopsOf, steppedLine } from "../chapters/lineStops.js";
import { dropTargetProps, startDrag } from "../scenes/dragData.js";
import {
  dragBySeconds,
  laneStyleOf,
  secondsStepOf,
  type LaneScale,
} from "./pointerDrag.js";

function spanOf(chapter: FilmChapter) {
  const [first] = chapter.cards;
  const last = chapter.cards.at(-1);
  if (first === undefined || last === undefined) return undefined;
  const startFrame = first.clip.startFrame;
  const endFrame = last.clip.startFrame + last.clip.durationFrames;
  return { startFrame, durationFrames: endFrame - startFrame };
}

function ChapterEdge(props: {
  film: FilmChapters;
  leftId: string;
  scale: Omit<LaneScale, "lane">;
  lane: RefObject<HTMLDivElement | null>;
  edits: ChapterEdits;
  onGhost: (frame: number | undefined) => void;
}) {
  const { film, scale } = props;
  const line = lineStopsOf({ film, leftId: props.leftId });
  const left = film.chapters.find((chapter) => chapter.id === props.leftId);
  const leftSpan = left === undefined ? undefined : spanOf(left);
  if (line === undefined || leftSpan === undefined) return undefined;
  const atFrame = leftSpan.startFrame + leftSpan.durationFrames;
  const moveTo = (shotId: string | undefined) => {
    if (shotId === undefined) return;
    props.edits.moveLine({ leftId: line.leftId, firstShotId: shotId });
  };
  const nearestTo = (frame: number) =>
    line.stops.toSorted(
      (...[first, second]) =>
        Math.abs(first.clip.startFrame - frame) -
        Math.abs(second.clip.startFrame - frame),
    )[0];
  return (
    <span
      className="chapter-edge"
      role="slider"
      tabIndex={0}
      aria-label={`Line between chapter ${String(line.rightNumber - 1)} and chapter ${String(line.rightNumber)}`}
      aria-valuemin={0}
      aria-valuemax={line.stops.length}
      aria-valuenow={line.current === -1 ? line.stops.length : line.current}
      title="Drag to move the line between two chapters"
      style={{ left: `${String((atFrame / scale.lengthFrames) * 100)}%` }}
      onKeyDown={(event) => {
        const step = secondsStepOf(event.key);
        if (step === undefined) return;
        event.preventDefault();
        moveTo(steppedLine({ line, by: step })?.shotId);
      }}
      onPointerDown={(down) => {
        dragBySeconds({
          down,
          scale: { ...scale, lane: props.lane.current },
          onMove: (delta) => {
            props.onGhost(nearestTo(atFrame + delta)?.clip.startFrame);
          },
          onEnd: (delta) => {
            props.onGhost(undefined);
            const stop = nearestTo(atFrame + delta);
            if (stop !== undefined && stop.clip.startFrame !== atFrame) {
              moveTo(stop.shotId);
            }
          },
        });
      }}
    />
  );
}

export function ChapterLane(props: {
  film: FilmChapters;
  scale: Omit<LaneScale, "lane">;
  pickedChapterId: string | undefined;
  edits: ChapterEdits;
  onPickChapter: (chapterId: string | undefined) => void;
  onDropScene: (drop: { clipId: string; chapterId: string }) => void;
}) {
  const { film } = props;
  const lane = useRef<HTMLDivElement>(null);
  const [ghost, setGhost] = useState<number>();
  const [over, setOver] = useState<string>();
  const { scale } = props;
  return (
    <div className="lane chapter-lane" ref={lane}>
      {film.chapters.map((chapter) => {
        const span = spanOf(chapter);
        if (span === undefined) return undefined;
        return (
          <button
            key={chapter.id}
            type="button"
            className="chapter-clip"
            draggable
            data-chapter-clip={chapter.id}
            data-step={chapter.step}
            data-over={over === chapter.id}
            aria-pressed={chapter.id === props.pickedChapterId}
            style={laneStyleOf({ ...span, lengthFrames: scale.lengthFrames })}
            onClick={() => {
              props.onPickChapter(
                chapter.id === props.pickedChapterId ? undefined : chapter.id,
              );
            }}
            onDragStart={(event) => {
              startDrag({ event, kind: "chapter", id: chapter.id });
            }}
            {...dropTargetProps({
              accepts: ["chapter", "scene"],
              onOver: (kind) => {
                setOver(kind === undefined ? undefined : chapter.id);
              },
              onDrop: (dropped) => {
                if (dropped.kind === "chapter") {
                  props.edits.moveChapter({
                    chapterId: dropped.id,
                    toIndex: chapter.number - 1,
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
            <span>
              {chapter.number}. {chapter.title}
            </span>
            <em>{chapterStepLabels[chapter.step]}</em>
          </button>
        );
      })}
      {film.chapters.slice(0, -1).map((chapter) => (
        <ChapterEdge
          key={chapter.id}
          film={film}
          leftId={chapter.id}
          scale={scale}
          lane={lane}
          edits={props.edits}
          onGhost={setGhost}
        />
      ))}
      {ghost === undefined ? undefined : (
        <span
          className="edge-ghost"
          style={{ left: `${String((ghost / scale.lengthFrames) * 100)}%` }}
        />
      )}
    </div>
  );
}
