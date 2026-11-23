import type { SceneAsset, SceneAssetMark } from "@yumekit/scene";

const defaultPictureAspect = 16 / 9;

export type FilmMedia =
  | { kind: "image"; url: string; aspect: number; marks: SceneAssetMark[] }
  | { kind: "video"; aspect: number; marks: SceneAssetMark[] }
  | { kind: "none"; aspect: number; marks: SceneAssetMark[] };

function aspectOf(asset: SceneAsset): number {
  const { widthPixels, heightPixels } = asset;
  return widthPixels !== undefined &&
    heightPixels !== undefined &&
    widthPixels > 0 &&
    heightPixels > 0
    ? widthPixels / heightPixels
    : defaultPictureAspect;
}

export function filmMediaOf(options: {
  findAsset: (assetId: string) => SceneAsset | undefined;
  assetId: string;
}): FilmMedia {
  const asset =
    options.assetId === "" ? undefined : options.findAsset(options.assetId);
  if (asset === undefined) {
    return { kind: "none", aspect: defaultPictureAspect, marks: [] };
  }
  const known = { aspect: aspectOf(asset), marks: asset.marks ?? [] };
  if (asset.kind === "image")
    return { kind: "image", url: asset.url, ...known };
  if (asset.kind === "video" && asset.framePictures !== undefined) {
    return { kind: "video", ...known };
  }
  return { kind: "none", ...known };
}

export function markOf(options: {
  media: FilmMedia;
  name: string | undefined;
}): SceneAssetMark | undefined {
  const wanted = options.name?.trim().toLowerCase();
  if (wanted === undefined || wanted === "") return undefined;
  return options.media.marks.find(
    (mark) => mark.name.trim().toLowerCase() === wanted,
  );
}
