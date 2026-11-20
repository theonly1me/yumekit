import {
  useFrame,
  useSceneContext,
  VideoFrame,
  type JsonObject,
} from "@yumekit/scene";
import type { ReactNode } from "react";
import { CaptionPanel } from "../kit/CaptionPanel.js";
import { readVideoClipProps } from "../props/readProps.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";

export function VideoClip(props: { props: JsonObject }): ReactNode {
  const { assetId, fit, focus, startSeconds, caption } = readVideoClipProps(
    props.props,
  );
  const stylePack = useStylePack();
  const frame = useFrame();
  const { framesPerSecond, findAsset } = useSceneContext();
  const asset = assetId === "" ? undefined : findAsset(assetId);
  const hasPictures =
    asset?.kind === "video" && asset.framePictures !== undefined;
  const startFrame = Math.round((startSeconds ?? 0) * framesPerSecond);
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          background: stylePack.colors.placeholder,
        }}
      >
        {hasPictures ? (
          <VideoFrame
            assetId={assetId}
            assetFrame={frame + startFrame}
            {...(fit === undefined ? {} : { fit })}
            {...(focus === undefined ? {} : { focus })}
          />
        ) : null}
      </div>
      {caption === undefined || caption === "" ? null : (
        <CaptionPanel placement="top">{caption}</CaptionPanel>
      )}
    </>
  );
}
