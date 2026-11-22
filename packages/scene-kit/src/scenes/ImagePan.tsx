import { useFrame, useSceneContext, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { CaptionPanel } from "../kit/CaptionPanel.js";
import { useKitMotion } from "../kit/motion.js";
import { readImagePanProps } from "../props/readProps.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import { panTransform } from "./panMotion.js";

const captionStartFrame = 6;

export function ImagePan(props: { props: JsonObject }): ReactNode {
  const { assetId, caption, direction } = readImagePanProps(props.props);
  const stylePack = useStylePack();
  const frame = useFrame();
  const { durationFrames, findAsset } = useSceneContext();
  const motion = useKitMotion();
  const captionStart = motion.framesOf(captionStartFrame);
  const motionFrame = motion.paced(
    captionStart + motion.framesOf(stylePack.motion.riseFrames),
  );
  const asset = assetId === "" ? undefined : findAsset(assetId);
  const imageUrl = asset?.kind === "image" ? asset.url : undefined;
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
        {imageUrl === undefined ? null : (
          <img
            src={imageUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: panTransform({
                direction: direction ?? "in",
                frame,
                durationFrames,
              }),
            }}
          />
        )}
      </div>
      {caption === undefined || caption === "" ? null : (
        <CaptionPanel
          placement="top"
          textProp="caption"
          style={motion.enterAt({
            frame: motionFrame,
            startFrame: captionStart,
            kind: "wipe",
          })}
        >
          {caption}
        </CaptionPanel>
      )}
    </>
  );
}
