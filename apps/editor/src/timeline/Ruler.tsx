import type { MouseEvent } from "react";

const tickStepsSeconds = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
const mostTicks = 8;

function tickSecondsOf(lengthSeconds: number): number[] {
  const step =
    tickStepsSeconds.find(
      (candidate) => lengthSeconds / candidate <= mostTicks,
    ) ?? Math.ceil(lengthSeconds / mostTicks);
  const ticks: number[] = [];
  for (let second = 0; second < lengthSeconds; second += step) {
    ticks.push(second);
  }
  return ticks;
}

export function Ruler(props: {
  lengthFrames: number;
  framesPerSecond: number;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
}) {
  const { lengthFrames, framesPerSecond } = props;
  return (
    <div className="lane ruler" data-testid="ruler" onClick={props.onClick}>
      {tickSecondsOf(lengthFrames / framesPerSecond).map((second) => (
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
