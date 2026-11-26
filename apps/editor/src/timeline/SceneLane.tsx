import { useRef, useState } from "react";
import type { ChapterEdits } from "../chapters/chapterEdits.js";
import type { ChapterCard, FilmChapters } from "../chapters/filmChapters.js";
import type { SceneClip } from "../engine/snapshot.js";
import { cardDropOf } from "../scenes/cardFacts.js";
import { startDrag, type DragKind } from "../scenes/dragData.js";
import { secondsText } from "./clock.js";
import {
  dragBySeconds,
  laneStyleOf,
  secondsStepOf,
  type LaneScale,
} from "./pointerDrag.js";
import type { TimelineEdits } from "./timelineEdits.js";

interface LengthDraft {
  clipId: string;
  durationFrames: number;
  baseFrames: number;
  isDragging: boolean;
}

function activeDraftOf(options: {
  draft: LengthDraft | undefined;
  cards: ChapterCard[];
}): { index: number; delta: number } | undefined {
  const { draft } = options;
  const card = options.cards.find((each) => each.clip.id === draft?.clipId);
  if (draft === undefined || card === undefined) return undefined;
  const isWaiting = card.clip.durationFrames === draft.baseFrames;
  if (!draft.isDragging && !isWaiting) return undefined;
  return {
    index: card.index,
    delta: draft.durationFrames - card.clip.durationFrames,
  };
}

function shownClipOf(options: {
  card: ChapterCard;
  draft: { index: number; delta: number } | undefined;
}): SceneClip {
  const { card, draft } = options;
  const { clip } = card;
  if (draft === undefined || card.index < draft.index) return clip;
  return card.index === draft.index
    ? { ...clip, durationFrames: clip.durationFrames + draft.delta }
    : { ...clip, startFrame: clip.startFrame + draft.delta };
}

export function SceneLane(props: {
  film: FilmChapters;
  titleOf: (clip: SceneClip) => string;
  scale: Omit<LaneScale, "lane">;
  selectedClipId: string | undefined;
  chapterEdits: ChapterEdits;
  edits: TimelineEdits;
  onPick: (clip: SceneClip) => void;
  onDropItem: (drop: { assetId: string; clip: SceneClip }) => void;
}) {
  const { film, scale } = props;
  const { framesPerSecond } = scale;
  const lane = useRef<HTMLDivElement>(null);
  const [lengthDraft, setLengthDraft] = useState<LengthDraft>();
  const draft = activeDraftOf({ draft: lengthDraft, cards: film.cards });
  const [over, setOver] = useState<{ clipId: string; kind: DragKind }>();
  const lengthOf = (options: { from: SceneClip; delta: number }) =>
    Math.max(
      Math.min(framesPerSecond, options.from.durationFrames),
      options.from.durationFrames + options.delta,
    );
  return (
    <div className="lane scene-lane" ref={lane}>
      {film.cards.map((card) => {
        const { clip } = card;
        const shown = shownClipOf({ card, draft });
        const title = props.titleOf(clip);
        const resize = (options: { from: SceneClip; delta: number }) => {
          const durationFrames = lengthOf(options);
          if (durationFrames === options.from.durationFrames) {
            setLengthDraft(undefined);
            return;
          }
          setLengthDraft({
            clipId: clip.id,
            durationFrames,
            baseFrames: clip.durationFrames,
            isDragging: false,
          });
          props.edits
            .resizeScene({ clip, durationFrames })
            .then((isDone) => {
              if (!isDone) setLengthDraft(undefined);
            })
            .catch(() => undefined);
        };
        return (
          <div
            key={clip.id}
            className="clip scene scene-clip"
            data-clip={clip.id}
            data-over={over?.clipId === clip.id ? over.kind : undefined}
            style={laneStyleOf({ ...shown, lengthFrames: scale.lengthFrames })}
            {...cardDropOf({
              card,
              film,
              chapterEdits: props.chapterEdits,
              onDropItem: props.onDropItem,
              onOver: (kind) => {
                setOver(
                  kind === undefined ? undefined : { clipId: clip.id, kind },
                );
              },
            })}
          >
            <button
              type="button"
              className="clip-name"
              draggable
              aria-current={clip.id === props.selectedClipId}
              title={title}
              onDragStart={(event) => {
                startDrag({ event, kind: "scene", id: clip.id });
              }}
              onClick={() => {
                props.onPick(clip);
              }}
              onKeyDown={(event) => {
                const step = secondsStepOf(event.key);
                if (!event.altKey || step === undefined) return;
                event.preventDefault();
                props.chapterEdits.stepScene({ card, by: step });
              }}
            >
              {lengthDraft?.isDragging === true &&
              lengthDraft.clipId === clip.id
                ? secondsText({ frames: shown.durationFrames, framesPerSecond })
                : title}
            </button>
            <span
              className="trim"
              role="slider"
              tabIndex={0}
              aria-label={`Length of scene ${String(card.index + 1)}`}
              aria-valuemin={1}
              aria-valuenow={Math.round(shown.durationFrames / framesPerSecond)}
              aria-valuetext={secondsText({
                frames: shown.durationFrames,
                framesPerSecond,
              })}
              title="Drag to change the length"
              onKeyDown={(event) => {
                const step = secondsStepOf(event.key);
                if (step === undefined) return;
                event.preventDefault();
                resize({ from: shown, delta: step * framesPerSecond });
              }}
              onPointerDown={(down) => {
                dragBySeconds({
                  down,
                  scale: { ...scale, lane: lane.current },
                  onMove: (delta) => {
                    setLengthDraft({
                      clipId: clip.id,
                      durationFrames: lengthOf({ from: clip, delta }),
                      baseFrames: clip.durationFrames,
                      isDragging: true,
                    });
                  },
                  onEnd: (delta) => {
                    resize({ from: clip, delta });
                  },
                });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
