import { useEffect, useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Output, SceneClip, Snapshot } from "../../engine/snapshot.js";
import {
  clipPictureKey as clipContentKey,
  scenePictureKey as sceneContentKey,
} from "../../scenes/pictureKeys.js";
import {
  askForPictures,
  type PictureAsk,
  type ScenePicture,
} from "../../scenes/pictureStore.js";
import { timelineOf } from "../../timeline/timelineFacts.js";
import { stillFrameOf, stillScaleOf } from "../../scenes/useSceneStills.js";

export type { ScenePicture } from "../../scenes/pictureStore.js";

export function clipPictureKey(clipId: string): string {
  return `clip/${clipId}`;
}

export function scenePictureKey(sceneId: string): string {
  return `scene/${sceneId}`;
}

export async function picturesOf(options: {
  client: Pick<EngineClient, "callTool">;
  snapshot: Snapshot;
  output: Output;
  scale: number;
  clips: SceneClip[];
  unplacedSceneIds: string[];
}): Promise<Map<string, ScenePicture>> {
  const { snapshot, output, scale } = options;
  const timeline = timelineOf({ snapshot, outputId: output.id });
  const cards: { cardKey: string; ask: PictureAsk }[] = [
    ...options.clips.map((clip) => {
      const frame = stillFrameOf(clip);
      return {
        cardKey: clipPictureKey(clip.id),
        ask: {
          key: clipContentKey({ snapshot, timeline, output, scale, frame }),
          target: { kind: "frame" as const, frame },
        },
      };
    }),
    ...snapshot.scenes
      .filter((scene) => options.unplacedSceneIds.includes(scene.id))
      .map((scene) => ({
        cardKey: scenePictureKey(scene.id),
        ask: {
          key: sceneContentKey({ snapshot, output, scale, scene }),
          target: { kind: "scene" as const, sceneId: scene.id },
        },
      })),
  ];
  const pictures = await askForPictures({
    caller: options.client,
    outputId: output.id,
    scale,
    asks: cards.map((card) => card.ask),
  });
  return new Map(
    cards.map((card) => [
      card.cardKey,
      pictures.get(card.ask.key) ?? { kind: "failed" },
    ]),
  );
}

export function useScenePictures(options: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output;
  clips: SceneClip[];
  unplacedSceneIds: string[];
}): ReadonlyMap<string, ScenePicture> {
  const { client, snapshot, output, clips, unplacedSceneIds } = options;
  const [pictures, setPictures] = useState<ReadonlyMap<string, ScenePicture>>(
    new Map(),
  );

  useEffect(() => {
    let isCurrent = true;
    picturesOf({
      client,
      snapshot,
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
  }, [client, snapshot, output, clips, unplacedSceneIds]);

  return pictures;
}
