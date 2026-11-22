import { useEffect, useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Output, SceneClip } from "../../engine/snapshot.js";
import { stillFrameOf, stillScaleOf } from "../../scenes/useSceneStills.js";

export type ScenePicture =
  { kind: "ready"; source: string } | { kind: "failed" };

const picturesInOneCall = 8;

export function clipPictureKey(clipId: string): string {
  return `clip/${clipId}`;
}

export function scenePictureKey(sceneId: string): string {
  return `scene/${sceneId}`;
}

function groupsOf<Item>(items: Item[]): Item[][] {
  const groups: Item[][] = [];
  for (let first = 0; first < items.length; first += picturesInOneCall) {
    groups.push(items.slice(first, first + picturesInOneCall));
  }
  return groups;
}

async function callForPictures(options: {
  client: EngineClient;
  name: "preview_frames" | "preview_scenes";
  input: object;
  keys: string[];
  pictures: Map<string, ScenePicture>;
}): Promise<void> {
  const reply = await options.client.callTool({
    name: options.name,
    input: options.input,
  });
  const images = reply.ok && !reply.value.isError ? reply.value.images : [];
  options.keys.forEach((...[key, index]) => {
    const image = images[index];
    options.pictures.set(
      key,
      image === undefined
        ? { kind: "failed" }
        : {
            kind: "ready",
            source: `data:${image.mimeType};base64,${image.base64}`,
          },
    );
  });
}

export async function picturesOf(options: {
  client: EngineClient;
  output: Output;
  scale: number;
  clips: SceneClip[];
  unplacedSceneIds: string[];
}): Promise<Map<string, ScenePicture>> {
  const { client, output, scale } = options;
  const pictures = new Map<string, ScenePicture>();
  for (const group of groupsOf(options.clips)) {
    await callForPictures({
      client,
      name: "preview_frames",
      input: { output_id: output.id, frames: group.map(stillFrameOf), scale },
      keys: group.map((clip) => clipPictureKey(clip.id)),
      pictures,
    });
  }
  for (const group of groupsOf(options.unplacedSceneIds)) {
    await callForPictures({
      client,
      name: "preview_scenes",
      input: { output_id: output.id, scene_ids: group, scale },
      keys: group.map(scenePictureKey),
      pictures,
    });
  }
  return pictures;
}

export function useScenePictures(options: {
  client: EngineClient;
  output: Output;
  clips: SceneClip[];
  unplacedSceneIds: string[];
  revision: number;
}): ReadonlyMap<string, ScenePicture> {
  const { client, output, clips, unplacedSceneIds, revision } = options;
  const [pictures, setPictures] = useState<ReadonlyMap<string, ScenePicture>>(
    new Map(),
  );

  useEffect(() => {
    let isCurrent = true;
    picturesOf({
      client,
      output,
      scale: stillScaleOf(output),
      clips,
      unplacedSceneIds,
    })
      .then((made) => {
        if (isCurrent) setPictures(made);
      })
      .catch(() => {
        if (!isCurrent) return;
        const keys = [
          ...clips.map((clip) => clipPictureKey(clip.id)),
          ...unplacedSceneIds.map(scenePictureKey),
        ];
        setPictures(new Map(keys.map((key) => [key, { kind: "failed" }])));
      });
    return () => {
      isCurrent = false;
    };
  }, [client, output, clips, unplacedSceneIds, revision]);

  return pictures;
}
