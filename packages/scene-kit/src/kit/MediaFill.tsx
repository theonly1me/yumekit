import { useFrame, useSceneContext, VideoFrame } from "@yumekit/scene";
import type { CSSProperties, ReactNode } from "react";
import { useStylePack } from "../stylePacks/StylePackContext.js";

export type MediaKind = "image" | "video";

function useMedia(options: { assetId: string; kinds: readonly MediaKind[] }) {
  const { findAsset } = useSceneContext();
  const asset = options.assetId === "" ? undefined : findAsset(options.assetId);
  if (asset?.kind === "image" && options.kinds.includes("image")) {
    return { kind: "image" as const, url: asset.url };
  }
  if (
    asset?.kind === "video" &&
    asset.framePictures !== undefined &&
    options.kinds.includes("video")
  ) {
    return { kind: "video" as const };
  }
  return { kind: "none" as const };
}

export function useHasMedia(options: {
  assetId: string;
  kinds: readonly MediaKind[];
}): boolean {
  return useMedia(options).kind !== "none";
}

export function MediaFill(props: {
  assetId: string;
  kinds: readonly MediaKind[];
  fit?: "cover" | "contain";
  pictureStyle?: CSSProperties;
  style?: CSSProperties;
  placeholder?: ReactNode;
}): ReactNode {
  const stylePack = useStylePack();
  const frame = useFrame();
  const media = useMedia(props);
  const fit = props.fit ?? "cover";
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: stylePack.colors.placeholder,
        ...props.style,
      }}
    >
      <div style={{ position: "absolute", inset: 0, ...props.pictureStyle }}>
        {media.kind === "image" ? (
          <img
            src={media.url}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: fit,
            }}
          />
        ) : null}
        {media.kind === "video" ? (
          <VideoFrame assetId={props.assetId} assetFrame={frame} fit={fit} />
        ) : null}
        {media.kind === "none" ? props.placeholder : null}
      </div>
    </div>
  );
}
