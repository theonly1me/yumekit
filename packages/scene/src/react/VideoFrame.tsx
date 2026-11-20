import type { ReactNode } from "react";
import type { SceneAsset } from "../contract.js";
import { useSceneContext } from "./hooks.js";

type FramePictures = NonNullable<SceneAsset["framePictures"]>;

function shareOf(value: number | undefined): number {
  return value === undefined || Number.isNaN(value)
    ? 0.5
    : Math.min(1, Math.max(0, value));
}

function pictureIndexOf(options: {
  assetFrame: number;
  framePictures: FramePictures;
}): number {
  const lastIndex = Math.max(0, options.framePictures.count - 1);
  const wholeFrame = Number.isNaN(options.assetFrame)
    ? 0
    : Math.floor(options.assetFrame);
  return Math.min(lastIndex, Math.max(0, wholeFrame));
}

export function VideoFrame(props: {
  assetId: string;
  assetFrame: number;
  fit?: "cover" | "contain";
  focus?: { x: number; y: number };
}): ReactNode {
  const { findAsset } = useSceneContext();
  const asset = findAsset(props.assetId);
  if (asset === undefined) {
    throw new Error(`VideoFrame: the asset "${props.assetId}" does not exist`);
  }
  if (asset.kind !== "video" || asset.framePictures === undefined) {
    throw new Error(
      `VideoFrame: the asset "${props.assetId}" is of kind ${asset.kind}, not a video with frame pictures`,
    );
  }
  const { framePictures } = asset;
  const pictureIndex = pictureIndexOf({
    assetFrame: props.assetFrame,
    framePictures,
  });
  const focusX = shareOf(props.focus?.x) * 100;
  const focusY = shareOf(props.focus?.y) * 100;
  return (
    <img
      src={`${framePictures.urlPrefix}${String(pictureIndex)}.jpg`}
      alt=""
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: props.fit ?? "cover",
        objectPosition: `${String(focusX)}% ${String(focusY)}%`,
      }}
    />
  );
}
