import { useFrame, useSceneContext, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { CaptionPanel } from "../kit/CaptionPanel.js";
import { riseStyle, useMotionFrame } from "../kit/motion.js";
import { useSizes } from "../kit/sizes.js";
import { readImagePanProps } from "../props/readProps.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import { panTransform } from "./panMotion.js";

const captionStartFrame = 10;
const settleFrame = 24;

export function ImagePan(props: { props: JsonObject }): ReactNode {
  const { assetId, caption, direction } = readImagePanProps(props.props);
  const stylePack = useStylePack();
  const frame = useFrame();
  const { durationFrames, findAsset } = useSceneContext();
  const sizes = useSizes();
  const motionFrame = useMotionFrame({ settleFrame });
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
          style={riseStyle({
            motionFrame,
            startFrame: captionStartFrame,
            stylePack,
            unit: sizes.unit,
          })}
        >
          {caption}
        </CaptionPanel>
      )}
    </>
  );
}
