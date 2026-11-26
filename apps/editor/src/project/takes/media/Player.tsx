import { useEffect, useRef, useState } from "react";
import { PlayerTools } from "./PlayerTools.js";
import { stageStyleOf } from "./stageShape.js";

export type PlayerMedia = HTMLVideoElement & HTMLAudioElement;

export function clockOf(seconds: number): string {
  const tenths = Math.floor(seconds * 10 + 1e-6);
  const whole = Math.floor(tenths / 10);
  const tenth = tenths % 10;
  return `${String(Math.floor(whole / 60))}:${String(whole % 60).padStart(2, "0")}.${String(tenth)}`;
}

export function Player(props: {
  url: string | undefined;
  isSound: boolean;
  title: string;
  framesPerSecond: number;
  moments: number[];
  onMedia: (element: PlayerMedia | null) => void;
  onMark: ((seconds: number) => void) | undefined;
}) {
  const media = useRef<PlayerMedia | null>(null);
  const { onMedia } = props;
  const [seconds, setSeconds] = useState(0);
  const [length, setLength] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [shape, setShape] = useState<number>();

  useEffect(() => {
    if (media.current !== null) media.current.playbackRate = speed;
  }, [speed, props.url]);

  const seek = (to: number) => {
    const element = media.current;
    if (element === null) return;
    element.currentTime = Math.min(Math.max(0, to), length);
    setSeconds(element.currentTime);
  };
  const showTime = () => {
    setSeconds(media.current?.currentTime ?? 0);
  };
  const mediaProps = {
    ref: (element: PlayerMedia | null) => {
      media.current = element;
      onMedia(element);
    },
    src: props.url,
    preload: "auto",
    onLoadedMetadata: () => {
      const element = media.current;
      const duration = element?.duration ?? 0;
      setLength(Number.isFinite(duration) ? duration : 0);
      if (element !== null && element.videoWidth > 0) {
        setShape(element.videoWidth / element.videoHeight);
      }
    },
    onTimeUpdate: showTime,
    onSeeked: showTime,
    onPlay: () => {
      setPlaying(true);
    },
    onPause: () => {
      setPlaying(false);
    },
  } as const;
  return (
    <div className="player-box">
      <div
        className="stage-box"
        data-sound={props.isSound}
        style={props.isSound ? undefined : stageStyleOf(shape)}
      >
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
          {props.moments.map((...[moment, index]) => (
            <span
              key={`${String(moment)}-${String(index)}`}
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
              props.onMark?.(seconds);
            }}
          >
            Mark this moment
          </button>
        )}
      </div>
      <PlayerTools
        speed={speed}
        onSpeed={setSpeed}
        onStep={(frames) => {
          media.current?.pause();
          seek(seconds + frames / props.framesPerSecond);
        }}
      />
    </div>
  );
}
