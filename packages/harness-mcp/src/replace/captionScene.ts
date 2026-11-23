import {
  captionComponent,
  type Asset,
  type Edit,
  type ProjectSnapshot,
} from "@yumekit/project";
import { isTestServerAsset } from "../timeline/narrationChecks.js";
import { uniqueId } from "../timeline/narrationPlan.js";

export function captionSceneOf(options: {
  snapshot: ProjectSnapshot;
  asset: Asset;
}): { edits: Edit[]; sceneId: string | undefined } {
  const { snapshot, asset } = options;
  if (!asset.hasWords || isTestServerAsset(asset)) {
    return { edits: [], sceneId: undefined };
  }
  const existing = snapshot.scenes.find(
    (scene) =>
      scene.source.kind === "kit" &&
      scene.source.component === captionComponent &&
      scene.source.props["assetId"] === asset.id,
  );
  if (existing !== undefined) return { edits: [], sceneId: existing.id };
  const sceneId = uniqueId({
    base: `captions-${asset.id}`,
    taken: snapshot.scenes.map((scene) => scene.id),
  });
  return {
    sceneId,
    edits: [
      {
        kind: "putScene",
        scene: {
          id: sceneId,
          title: "Captions",
          notes: "Made by replace_narration.",
          source: {
            kind: "kit",
            component: captionComponent,
            props: { assetId: asset.id },
          },
        },
      },
    ],
  };
}
