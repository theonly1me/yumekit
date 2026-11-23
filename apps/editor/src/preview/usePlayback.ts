import { useCallback, useEffect, useRef, useState } from "react";

export interface PlaybackRun {
  startFrame: number;
  startedAt: number;
}

export function usePlayback(options: {
  frame: number;
  frameCount: number;
  framesPerSecond: number;
  setFrame: (frame: number) => void;
}) {
  const { frame, frameCount, framesPerSecond, setFrame } = options;
  const [run, setRun] = useState<PlaybackRun>();
  const liveRun = useRef<PlaybackRun | undefined>(undefined);
  const changeRun = useCallback((next: PlaybackRun | undefined) => {
    liveRun.current = next;
    setRun(next);
  }, []);
  const lastFrame = Math.max(0, frameCount - 1);

  useEffect(() => {
    if (run === undefined) return;
    let animation = 0;
    const tick = (now: number) => {
      if (liveRun.current !== run) return;
      const elapsedSeconds = (now - run.startedAt) / 1000;
      const next =
        run.startFrame + Math.floor(elapsedSeconds * framesPerSecond);
      if (next >= lastFrame) {
        setFrame(lastFrame);
        changeRun(undefined);
        return;
      }
      setFrame(next);
      animation = window.requestAnimationFrame(tick);
    };
    animation = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(animation);
    };
  }, [run, framesPerSecond, lastFrame, setFrame, changeRun]);

  const pause = useCallback(() => {
    changeRun(undefined);
  }, [changeRun]);

  const toggle = useCallback(() => {
    if (run !== undefined) {
      changeRun(undefined);
      return;
    }
    if (frameCount === 0) return;
    changeRun({
      startFrame: frame >= lastFrame ? 0 : frame,
      startedAt: performance.now(),
    });
  }, [run, frame, frameCount, lastFrame, changeRun]);

  return { run, isPlaying: run !== undefined, toggle, pause };
}
