import { useEffect, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output, SceneClip, Snapshot } from "../engine/snapshot.js";
import { timelineOf } from "../timeline/timelineFacts.js";
import { clipPictureKey } from "./pictureKeys.js";
import { askForPictures } from "./pictureStore.js";

const stillScales = [0.25, 0.5, 1] as const;
const smallestStillWidthPixels = 380;

export function stillFrameOf(clip: SceneClip): number {
  const settled = clip.startFrame + Math.round(clip.durationFrames * 0.75);
  return Math.min(clip.startFrame + clip.durationFrames - 1, settled);
}

export function stillKey(options: { outputId: string; clipId: string }) {
  return `${options.outputId}/${options.clipId}`;
}

export function stillScaleOf(output: Output): number {
  return (
    stillScales.find(
      (scale) => output.widthPixels * scale >= smallestStillWidthPixels,
    ) ?? 1
  );
}

async function stillsOf(options: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output;
  clips: SceneClip[];
}): Promise<Map<string, string>> {
  const { snapshot, output, clips } = options;
  const scale = stillScaleOf(output);
  const timeline = timelineOf({ snapshot, outputId: output.id });
  const asks = clips.map((clip) => {
    const frame = stillFrameOf(clip);
    return {
      clip,
      key: clipPictureKey({ snapshot, timeline, output, scale, frame }),
      target: { kind: "frame" as const, frame },
    };
  });
  const pictures = await askForPictures({
    caller: options.client,
    outputId: output.id,
    scale,
    asks,
  });
  return new Map(
    asks.flatMap((ask) => {
      const picture = pictures.get(ask.key);
      return picture?.kind === "ready"
        ? [
            [
              stillKey({ outputId: output.id, clipId: ask.clip.id }),
              picture.source,
            ] as const,
          ]
        : [];
    }),
  );
}

export function useSceneStills(options: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output;
  clips: SceneClip[];
}): ReadonlyMap<string, string> {
  const { client, snapshot, output, clips } = options;
  const [stills, setStills] = useState<ReadonlyMap<string, string>>(new Map());

  useEffect(() => {
    let isCurrent = true;
    stillsOf({ client, snapshot, output, clips })
      .then((made) => {
        if (isCurrent) setStills(made);
      })
      .catch(() => {
        if (isCurrent) setStills(new Map());
      });
    return () => {
      isCurrent = false;
    };
  }, [client, snapshot, output, clips]);

  return stills;
}
