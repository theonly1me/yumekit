import { useMemo } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type {
  Output,
  Scene,
  SceneClip,
  Snapshot,
} from "../../engine/snapshot.js";
import { mainSceneClipsOf, timelineOf } from "../../timeline/timelineFacts.js";
import {
  clipPictureKey,
  scenePictureKey,
  useScenePictures,
  type ScenePicture,
} from "./useScenePictures.js";

export interface PictureCard {
  key: string;
  number: number;
  scene: Scene;
  clip: SceneClip | undefined;
  picture: ScenePicture | undefined;
}

export function usePictureCards(options: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output;
}): PictureCard[] {
  const { snapshot, output } = options;
  const clips = useMemo(
    () =>
      mainSceneClipsOf({
        timeline: timelineOf({ snapshot, outputId: output.id }),
        scenes: snapshot.scenes,
      }),
    [snapshot, output.id],
  );
  const unplacedScenes = useMemo(() => {
    const placedSceneIds = new Set(clips.map((clip) => clip.sceneId));
    return snapshot.scenes.filter((scene) => !placedSceneIds.has(scene.id));
  }, [snapshot.scenes, clips]);
  const unplacedSceneIds = useMemo(
    () => unplacedScenes.map((scene) => scene.id),
    [unplacedScenes],
  );
  const pictures = useScenePictures({
    client: options.client,
    output,
    clips,
    unplacedSceneIds,
    revision: snapshot.revision,
  });
  const placed = clips.flatMap((clip) => {
    const scene = snapshot.scenes.find(
      (candidate) => candidate.id === clip.sceneId,
    );
    return scene === undefined
      ? []
      : [{ key: clipPictureKey(clip.id), scene, clip }];
  });
  const unplaced = unplacedScenes.map((scene) => ({
    key: scenePictureKey(scene.id),
    scene,
    clip: undefined,
  }));
  return [...placed, ...unplaced].map((...[card, index]) => ({
    ...card,
    number: index + 1,
    picture: pictures.get(card.key),
  }));
}
