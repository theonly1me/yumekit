import { useRef, useState } from "react";
import type { Asset, AudioClip } from "../engine/snapshot.js";
import type { AudioTrack } from "../sound/soundRowFacts.js";
import { secondsText } from "./clock.js";
import {
  dragBySeconds,
  laneStyleOf,
  secondsStepOf,
  type LaneScale,
} from "./pointerDrag.js";
import type { TimelineEdits } from "./timelineEdits.js";
import { audioClipLabel } from "./timelineFacts.js";
import {
  isSame,
  limitsOf,
  type MusicDraft,
  type Placement,
} from "./musicPlacement.js";

export function MusicLane(props: {
  track: AudioTrack;
  assets: Asset[];
  scale: Omit<LaneScale, "lane">;
  endFrame: number;
  selectedClipId: string | undefined;
  edits: TimelineEdits;
  onPick: (clip: AudioClip) => void;
}) {
  const { scale } = props;
  const { framesPerSecond } = scale;
  const lane = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<MusicDraft>();
  return (
    <div className="lane music-lane" ref={lane}>
      {props.track.clips.map((clip) => {
        const label = audioClipLabel({ clip, assets: props.assets });
        const isDraftShown =
          draft?.clipId === clip.id &&
          (draft.isDragging || draft.baseClip === clip);
        const shown = isDraftShown ? draft : clip;
        const keyLimits = limitsOf({
          clip,
          from: shown,
          ...props,
          framesPerSecond,
        });
        const limits = limitsOf({
          clip,
          from: clip,
          ...props,
          framesPerSecond,
        });
        const commit = (change: { next: Placement; from: Placement }) => {
          const { next } = change;
          if (isSame({ first: next, second: change.from })) {
            setDraft(undefined);
            return;
          }
          setDraft({
            clipId: clip.id,
            ...next,
            baseClip: clip,
            isDragging: false,
          });
          props.edits
            .changeMusic({ clip, ...next })
            .then((isDone) => {
              if (!isDone) setDraft(undefined);
            })
            .catch(() => undefined);
        };
        const drag = (options: {
          down: Parameters<typeof dragBySeconds>[0]["down"];
          placementOf: (delta: number) => Placement;
        }) => {
          dragBySeconds({
            down: options.down,
            scale: { ...scale, lane: lane.current },
            onMove: (delta) => {
              setDraft({
                clipId: clip.id,
                ...options.placementOf(delta),
                baseClip: clip,
                isDragging: true,
              });
            },
            onEnd: (delta) => {
              commit({ next: options.placementOf(delta), from: clip });
            },
          });
        };
        return (
          <div
            key={clip.id}
            className="clip music music-clip"
            style={laneStyleOf({ ...shown, lengthFrames: scale.lengthFrames })}
          >
            <button
              type="button"
              className="clip-name"
              aria-current={clip.id === props.selectedClipId}
              aria-label={`Music: ${label}`}
              title="Drag to move the music"
              onClick={() => {
                props.onPick(clip);
              }}
              onPointerDown={(down) => {
                drag({ down, placementOf: limits.moved });
              }}
              onKeyDown={(event) => {
                const step = secondsStepOf(event.key);
                if (!event.altKey || step === undefined) return;
                event.preventDefault();
                commit({
                  next: keyLimits.moved(step * framesPerSecond),
                  from: shown,
                });
              }}
            >
              {label}
            </button>
            <span
              className="trim"
              role="slider"
              tabIndex={0}
              aria-label={`Length of the music "${label}"`}
              aria-valuemin={1}
              aria-valuenow={Math.round(shown.durationFrames / framesPerSecond)}
              aria-valuetext={secondsText({
                frames: shown.durationFrames,
                framesPerSecond,
              })}
              title="Drag to change the length of the music"
              onKeyDown={(event) => {
                const step = secondsStepOf(event.key);
                if (step === undefined) return;
                event.preventDefault();
                commit({
                  next: keyLimits.trimmed(step * framesPerSecond),
                  from: shown,
                });
              }}
              onPointerDown={(down) => {
                drag({ down, placementOf: limits.trimmed });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
