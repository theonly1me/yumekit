import { VideoFrame, type SceneRegion } from "@yumekit/scene";
import type { CSSProperties, ReactNode } from "react";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import type { FilmMedia } from "./filmMedia.js";
import { wholePicture } from "./regionView.js";

function percent(value: number): string {
  return `${String(value * 100)}%`;
}

export function FilmPicture(props: {
  assetId: string;
  media: FilmMedia;
  assetFrame: number;
  view?: SceneRegion;
}): ReactNode {
  const stylePack = useStylePack();
  const view = props.view ?? wholePicture;
  const pictureStyle: CSSProperties = {
    position: "absolute",
    left: percent(-view.x / view.width),
    top: percent(-view.y / view.height),
    width: percent(1 / view.width),
    height: percent(1 / view.height),
  };
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: stylePack.colors.placeholder,
      }}
    >
      {props.media.kind === "none" ? null : (
        <div style={pictureStyle}>
          {props.media.kind === "video" ? (
            <VideoFrame
              assetId={props.assetId}
              assetFrame={props.assetFrame}
              fit="cover"
            />
          ) : (
            <img
              src={props.media.url}
              alt=""
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
