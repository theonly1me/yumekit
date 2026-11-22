import { kitScenesOf, type LookId } from "@yumekit/scene-kit";
import { useEffect, useRef, useState } from "react";

export const pictureOutput = {
  id: "look",
  widthPixels: 320,
  heightPixels: 180,
};

const framesPerSecond = 30;
const playFrames = 90;
const loopFrames = 150;

export type PictureState = "drawing" | "ready" | "failed";

function isMotionReduced(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useLookPicture(options: { look: LookId; heading: string }) {
  const { look, heading } = options;
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PictureState>("drawing");

  useEffect(() => {
    const host = hostRef.current;
    const scene = kitScenesOf(look)["title-card"];
    if (host === null || scene === undefined) return;
    const element = document.createElement("div");
    element.style.width = `${String(pictureOutput.widthPixels)}px`;
    element.style.height = `${String(pictureOutput.heightPixels)}px`;
    host.replaceChildren(element);
    let isClosed = false;
    let frameRequest = 0;
    let dispose = () => undefined;

    const loop = (seek: (frame: number) => Promise<void>) => {
      const startTime = performance.now();
      let isSeeking = false;
      const step = (now: number) => {
        if (isClosed) return;
        const shown = Math.floor(
          (((now - startTime) / 1000) * framesPerSecond) % loopFrames,
        );
        if (!isSeeking) {
          isSeeking = true;
          seek(Math.min(shown, playFrames - 1))
            .catch(() => undefined)
            .finally(() => {
              isSeeking = false;
            });
        }
        frameRequest = requestAnimationFrame(step);
      };
      frameRequest = requestAnimationFrame(step);
    };

    scene
      .mount({
        element,
        output: pictureOutput,
        framesPerSecond,
        durationFrames: playFrames,
        props: { heading },
        findAsset: () => undefined,
      })
      .then(async (mounted) => {
        if (isClosed) {
          mounted.dispose();
          return;
        }
        dispose = () => {
          mounted.dispose();
        };
        await mounted.seek(playFrames - 1);
        setState("ready");
        if (!isMotionReduced()) loop(mounted.seek);
      })
      .catch(() => {
        if (!isClosed) setState("failed");
      });

    return () => {
      isClosed = true;
      cancelAnimationFrame(frameRequest);
      dispose();
      element.remove();
    };
  }, [look, heading]);

  return { hostRef, state };
}
