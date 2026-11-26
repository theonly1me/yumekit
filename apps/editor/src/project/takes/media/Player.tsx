import { useEffect, useRef, useState } from "react";

const speeds = [0.25, 0.5, 1];

export function clockOf(seconds: number): string {
  const whole = Math.floor(seconds);
  const tenth = Math.floor((seconds - whole) * 10);
  return `${String(Math.floor(whole / 60))}:${String(whole % 60).padStart(2, "0")}.${String(tenth)}`;
}

export function Player(props: {
  url: string | undefined;
  isSound: boolean;
  title: string;
  framesPerSecond: number;
  moments: number[];
  onMark: ((seconds: number) => void) | undefined;
}) {
  const media = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const [seconds, setSeconds] = useState(0);
  const [length, setLength] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (media.current !== null) media.current.playbackRate = speed;
  }, [speed, props.url]);

  const seek = (to: number) => {
    const element = media.current;
    if (element === null) return;
    element.currentTime = Math.min(Math.max(0, to), length);
    setSeconds(element.currentTime);
  };
  const step = (frames: number) => {
    media.current?.pause();
    seek(seconds + frames / props.framesPerSecond);
  };
  const mediaProps = {
    ref: media,
    src: props.url,
    preload: "auto",
    onLoadedMetadata: () => {
      const duration = media.current?.duration ?? 0;
      setLength(Number.isFinite(duration) ? duration : 0);
    },
    onTimeUpdate: () => {
      setSeconds(media.current?.currentTime ?? 0);
    },
    onPlay: () => {
      setPlaying(true);
    },
    onPause: () => {
      setPlaying(false);
    },
  } as const;
  return (
    <div className="player-box">
      <div className="stage-box" data-sound={props.isSound}>
        {props.isSound ? (
          <>
            <span className="tile-wave">{props.title}</span>
            <audio {...mediaProps} />
          </>
        ) : (
          <video {...mediaProps} playsInline />
        )}
      </div>
      <div className="player">
        <button
          type="button"
          className="play"
          onClick={() => {
            const element = media.current;
            if (element === null) return;
            if (element.paused) element.play().catch(() => undefined);
            else element.pause();
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <div className="scrub">
          <input
            type="range"
            min={0}
            max={length || 1}
            step={0.01}
            value={seconds}
            aria-label={`Time in ${props.title}`}
            onChange={(event) => {
              seek(Number(event.target.value));
            }}
          />
          {props.moments.map((moment) => (
            <span
              key={moment}
              className="moment-mark"
              style={{ left: `${String((moment / (length || 1)) * 100)}%` }}
            />
          ))}
        </div>
        <span className="time">{clockOf(seconds)}</span>
        {props.onMark === undefined ? undefined : (
          <button
            type="button"
            className="mark-moment"
            onClick={() => {
              media.current?.pause();
              props.onMark?.(Math.round(seconds * 10) / 10);
            }}
          >
            Mark this moment
          </button>
        )}
      </div>
      <div className="large-tools">
        <button
          type="button"
          onClick={() => {
            step(-1);
          }}
        >
          One frame back
        </button>
        <button
          type="button"
          onClick={() => {
            step(1);
          }}
        >
          One frame on
        </button>
        <span className="segments" role="group" aria-label="Speed">
          {speeds.map((each) => (
            <button
              key={each}
              type="button"
              aria-pressed={each === speed}
              onClick={() => {
                setSpeed(each);
              }}
            >
              {each} x
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}
