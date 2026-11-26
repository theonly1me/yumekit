import type { MouseEvent } from "react";
import { BeatMarks } from "./BeatMarks.js";
import { useElementWidth } from "./useElementWidth.js";

const tickStepsSeconds = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
const leastTickSpacingPixels = 64;
const labelRoomPixels = 40;

function tickSecondsOf(options: {
  lengthSeconds: number;
  widthPixels: number;
}): number[] {
  const { lengthSeconds, widthPixels } = options;
  if (lengthSeconds <= 0 || widthPixels <= 0) return [];
  const pixelsPerSecond = widthPixels / lengthSeconds;
  const step =
    tickStepsSeconds.find(
      (candidate) => candidate * pixelsPerSecond >= leastTickSpacingPixels,
    ) ?? Math.ceil(leastTickSpacingPixels / pixelsPerSecond);
  const ticks: number[] = [];
  for (
    let second = 0;
    second * pixelsPerSecond + labelRoomPixels <= widthPixels;
    second += step
  ) {
    ticks.push(second);
  }
  return ticks;
}

export function Ruler(props: {
  lengthFrames: number;
  framesPerSecond: number;
  tempo: number | undefined;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
}) {
  const { lengthFrames, framesPerSecond } = props;
  const { elementRef, widthPixels } = useElementWidth<HTMLDivElement>();
  const tickSeconds = tickSecondsOf({
    lengthSeconds: lengthFrames / framesPerSecond,
    widthPixels,
  });
  return (
    <div
      ref={elementRef}
      className="lane ruler"
      data-testid="ruler"
      onClick={props.onClick}
    >
      {props.tempo === undefined ? undefined : (
        <BeatMarks
          tempo={props.tempo}
          framesPerSecond={framesPerSecond}
          lengthFrames={lengthFrames}
        />
      )}
      {tickSeconds.map((second) => (
        <span
          key={second}
          className="tick"
          style={{
            left: `${String(((second * framesPerSecond) / lengthFrames) * 100)}%`,
          }}
        >
          {second} s
        </span>
      ))}
    </div>
  );
}
