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
  return (
    <div className="transport">
      <button
        type="button"
        className="play"
        aria-label={props.isPlaying ? "Pause" : "Play"}
        data-playing={props.isPlaying}
        disabled={frameCount === 0}
        onClick={props.onToggle}
      >
        {props.isPlaying ? (
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 1h3v10H2zM7 1h3v10H7z" />
          </svg>
        ) : (
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 1v10l8.5-5z" />
          </svg>
        )}
      </button>
      <p className="timecode now" data-testid="timecode">
        {clockText({ frame, framesPerSecond })}
      </p>
      <input
        type="range"
        className="scrub"
        min={0}
        max={Math.max(0, frameCount - 1)}
        value={frame}
        aria-label="Frame"
        disabled={frameCount === 0}
        onChange={(event) => {
          props.onScrub(Number(event.currentTarget.value));
        }}
      />
      <p className="timecode">
        {clockText({ frame: frameCount, framesPerSecond })}
      </p>
    </div>
  );
}
