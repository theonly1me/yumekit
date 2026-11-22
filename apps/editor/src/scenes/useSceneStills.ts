import { useEffect, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output, SceneClip } from "../engine/snapshot.js";

const framesInOneCall = 8;
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
  output: Output;
  clips: SceneClip[];
}): Promise<Map<string, string>> {
  const { client, output, clips } = options;
  const stills = new Map<string, string>();
  for (let first = 0; first < clips.length; first += framesInOneCall) {
    const group = clips.slice(first, first + framesInOneCall);
    const reply = await client.callTool({
      name: "preview_frames",
      input: {
        output_id: output.id,
        frames: group.map(stillFrameOf),
        scale: stillScaleOf(output),
      },
    });
    if (!reply.ok || reply.value.isError) continue;
    group.forEach((...[clip, index]) => {
      const image = reply.value.images[index];
      if (image !== undefined) {
        stills.set(
          stillKey({ outputId: output.id, clipId: clip.id }),
          `data:${image.mimeType};base64,${image.base64}`,
        );
      }
    });
  }
  return stills;
}

export function useSceneStills(options: {
  client: EngineClient;
  output: Output;
  clips: SceneClip[];
  revision: number;
}): ReadonlyMap<string, string> {
  const { client, output, clips, revision } = options;
  const [stills, setStills] = useState<ReadonlyMap<string, string>>(new Map());

  useEffect(() => {
    let isCurrent = true;
    stillsOf({ client, output, clips })
      .then((made) => {
        if (isCurrent) setStills(made);
      })
      .catch(() => {
        if (isCurrent) setStills(new Map());
      });
    return () => {
      isCurrent = false;
    };
  }, [client, output, clips, revision]);

  return stills;
}
