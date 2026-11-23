import { assetLabelOf } from "@yumekit/project/asset-labels";
import type { Asset, Scene } from "../engine/snapshot.js";

const sceneWithNoTitle = "Untitled scene";

export function assetNameOf(asset: Asset): string {
  return assetLabelOf(asset);
}

function namedAssetOf(options: { scene: Scene; assets: readonly Asset[] }) {
  const assetId = options.scene.source.props["assetId"];
  return options.assets.find((asset) => asset.id === assetId);
}

function isMadeTitle(options: { title: string; assetId: string }): boolean {
  return [`Video ${options.assetId}`, `Captions of ${options.assetId}`].some(
    (madeTitle) => madeTitle === options.title,
  );
}

export function sceneNameOf(options: {
  scene: Scene;
  assets: readonly Asset[];
}): string {
  const { scene } = options;
  const asset = namedAssetOf(options);
  if (
    asset !== undefined &&
    isMadeTitle({ title: scene.title, assetId: asset.id })
  ) {
    return scene.title.startsWith("Captions") ? "Captions" : assetNameOf(asset);
  }
  return scene.title.trim() === "" ? sceneWithNoTitle : scene.title;
}

export function sceneNameById(options: {
  sceneId: string;
  scenes: readonly Scene[];
  assets: readonly Asset[];
}): string {
  const scene = options.scenes.find((each) => each.id === options.sceneId);
  return scene === undefined
    ? sceneWithNoTitle
    : sceneNameOf({ scene, assets: options.assets });
}
