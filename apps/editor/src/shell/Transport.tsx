import { clockText } from "../timeline/clock.js";

export function Transport(props: {
  frame: number;
  frameCount: number;
  framesPerSecond: number;
  isPlaying: boolean;
  onToggle: () => void;
  onScrub: (frame: number) => void;
}) {
  const { frame, frameCount, framesPerSecond } = props;
  const now = clockText({ frame, framesPerSecond });
  const end = clockText({ frame: frameCount, framesPerSecond });
  const share = frameCount <= 1 ? 0 : (frame / (frameCount - 1)) * 100;
  return (
    <div className="transport">
      <button
        type="button"
        className="play"
        data-playing={props.isPlaying}
        disabled={frameCount === 0}
        onClick={props.onToggle}
      >
        {props.isPlaying ? "Pause" : "Play"}
      </button>
      <input
        type="range"
        className="progress-line"
        min={0}
        max={Math.max(0, frameCount - 1)}
        value={frame}
        aria-label="Position in the video"
        aria-valuetext={`${now} of ${end}`}
        disabled={frameCount === 0}
        style={{ backgroundSize: `${String(share)}% 100%` }}
        onChange={(event) => {
          props.onScrub(Number(event.currentTarget.value));
        }}
      />
      <p className="clock" data-testid="timecode">
        {now} of {end}
      </p>
    </div>
  );
}
