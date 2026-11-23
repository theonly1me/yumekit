import { useEffect, useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Output, Snapshot } from "../../engine/snapshot.js";
import type { PictureCard } from "./usePictureCards.js";
import { picturesOf, type ScenePicture } from "./useScenePictures.js";

export const largePictureScale = 0.5;

export function useLargePicture(options: {
  client: EngineClient;
  output: Output;
  card: PictureCard;
  snapshot: Snapshot;
}): ScenePicture | undefined {
  const { client, output, card, snapshot } = options;
  const [picture, setPicture] = useState<ScenePicture>();
  const { key, clip, scene } = card;

  useEffect(() => {
    let isCurrent = true;
    picturesOf({
      client,
      snapshot,
      output,
      scale: largePictureScale,
      clips: clip === undefined ? [] : [clip],
      unplacedSceneIds: clip === undefined ? [scene.id] : [],
    })
      .then((made) => {
        if (isCurrent) setPicture(made.get(key));
      })
      .catch(() => {
        if (isCurrent) setPicture({ kind: "failed" });
      });
    return () => {
      isCurrent = false;
    };
  }, [client, snapshot, output, key, clip, scene.id]);

  return picture;
}
