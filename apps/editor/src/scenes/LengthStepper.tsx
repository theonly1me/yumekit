import { secondsText } from "../timeline/clock.js";

export function LengthStepper(props: {
  durationFrames: number;
  framesPerSecond: number;
  onLength: (durationFrames: number) => void;
}) {
  const { durationFrames, framesPerSecond } = props;
  const shorter = Math.max(framesPerSecond, durationFrames - framesPerSecond);
  return (
    <span className="stepper" role="group" aria-label="Change length">
      <button
        type="button"
        aria-label="One second shorter"
        disabled={durationFrames <= framesPerSecond}
        onClick={() => {
          props.onLength(shorter);
        }}
      >
        -
      </button>
      <span>{secondsText({ frames: durationFrames, framesPerSecond })}</span>
      <button
        type="button"
        aria-label="One second longer"
        onClick={() => {
          props.onLength(durationFrames + framesPerSecond);
        }}
      >
        +
      </button>
    </span>
  );
}
