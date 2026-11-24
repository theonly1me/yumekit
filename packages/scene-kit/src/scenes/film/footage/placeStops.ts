import type { SceneRegion } from "@yumekit/scene";
import type { FilmMedia } from "../../../film/filmMedia.js";
import { markOf } from "../../../film/filmMedia.js";
import { wholePicture } from "../../../film/regionView.js";
import type { FootageProps } from "./readFootageProps.js";

const settleShare = 0.7;

export interface FootageShot {
  regions: { region: SceneRegion; frame: number | undefined }[];
  startSeconds: number;
}

export function footageShotOf(options: {
  props: FootageProps;
  media: FilmMedia;
  frameOfBeat: (beat: number) => number;
  framesPerSecond: number;
}): FootageShot {
  const { props, media, frameOfBeat, framesPerSecond } = options;
  const mark = markOf({ media, name: props.mark });
  const startSeconds = props.startSeconds ?? mark?.seconds ?? 0;
  if (props.stops.length === 0) {
    return {
      regions: [
        { region: props.region ?? mark?.region ?? wholePicture, frame: 0 },
      ],
      startSeconds,
    };
  }
  return {
    regions: props.stops.map((stop) => ({
      region:
        stop.region ??
        markOf({ media, name: stop.mark })?.region ??
        wholePicture,
      frame:
        stop.beat === undefined
          ? stop.seconds === undefined
            ? undefined
            : stop.seconds * framesPerSecond
          : frameOfBeat(stop.beat),
    })),
    startSeconds,
  };
}

export function spreadFrames(options: {
  frames: readonly (number | undefined)[];
  durationFrames: number;
}): number[] {
  const { frames, durationFrames } = options;
  const gaps = Math.max(1, frames.length - 1);
  return frames.map(
    (...[frame, index]) =>
      frame ?? (index / gaps) * settleShare * Math.max(0, durationFrames - 1),
  );
}
