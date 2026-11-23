import { tween, type JsonObject } from "@yumekit/scene";
import type { CSSProperties, ReactNode } from "react";
import { sceneAccentOf } from "../../kit/accentColors.js";
import { contentBottomUnits } from "../../kit/captionArea.js";
import { FitBox } from "../../kit/FitBox.js";
import { MediaFill } from "../../kit/MediaFill.js";
import { useKitMotion } from "../../kit/motion.js";
import { MotionWords } from "../../kit/MotionWords.js";
import { useSizes } from "../../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../../kit/textStyles.js";
import { entryCurve } from "../../motion/curves.js";
import { draw } from "../../motion/index.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";
import { readSplitProps } from "./readSplitProps.js";

const seamFrames = 12;
const revealStartFrame = 6;
const revealFrames = 22;
const zoomFrames = 40;
const headingStartFrame = 12;
const textGapUnits = 9;

export function Split(props: { props: JsonObject }): ReactNode {
  const { assetId, heading, body, side } = readSplitProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const accent = sceneAccentOf(stylePack);
  const headingWordsAt = motion.wordsFrom({
    text: heading,
    startFrame: motion.framesOf(headingStartFrame),
  });
  const bodyStart = headingWordsAt(0).settleFrame - motion.framesOf(10);
  const motionFrame = motion.paced(
    Math.max(
      motion.framesOf(zoomFrames),
      bodyStart + motion.framesOf(stylePack.motion.riseFrames),
    ),
  );
  const seamShare = draw({
    frame: motionFrame,
    framesPerSecond: motion.framesPerSecond,
    durationSeconds: motion.framesOf(seamFrames) / motion.framesPerSecond,
  });
  const reveal = tween({
    frame: motionFrame,
    startFrame: motion.framesOf(revealStartFrame),
    endFrame: motion.framesOf(revealStartFrame + revealFrames),
    from: 0,
    to: 1,
    easing: entryCurve,
  });
  const zoom = tween({
    frame: motionFrame,
    startFrame: motion.framesOf(revealStartFrame),
    endFrame: motion.framesOf(zoomFrames),
    from: 1.18,
    to: 1,
    easing: entryCurve,
  });
  const isSideBySide = sizes.layout !== "tall";
  const mediaFirst = side !== "right";
  const half = "50%";
  const hidden = `${String((1 - reveal) * 100)}%`;
  const mediaBox: CSSProperties = isSideBySide
    ? {
        top: 0,
        bottom: 0,
        width: half,
        ...(mediaFirst ? { left: 0 } : { right: 0 }),
      }
    : {
        left: 0,
        right: 0,
        height: half,
        ...(mediaFirst ? { top: 0 } : { bottom: 0 }),
      };
  const clipFromSeam = isSideBySide
    ? mediaFirst
      ? `inset(0 0 0 ${hidden})`
      : `inset(0 ${hidden} 0 0)`
    : mediaFirst
      ? `inset(${hidden} 0 0 0)`
      : `inset(0 0 ${hidden} 0)`;
  const seamStyle: CSSProperties = isSideBySide
    ? {
        top: 0,
        bottom: 0,
        width: sizes.pixels(0.7),
        left: `calc(${half} - ${sizes.pixels(0.35)})`,
        transformOrigin: "center top",
        transform: `scaleY(${String(seamShare)})`,
      }
    : {
        left: 0,
        right: 0,
        height: sizes.pixels(0.7),
        top: `calc(${half} - ${sizes.pixels(0.35)})`,
        transformOrigin: "left center",
        transform: `scaleX(${String(seamShare)})`,
      };
  const margin = stylePack.layout.marginUnits;
  const bottomUnits = contentBottomUnits(stylePack);
  const textBox: CSSProperties = isSideBySide
    ? {
        top: sizes.pixels(margin),
        bottom: sizes.pixels(bottomUnits),
        ...(mediaFirst
          ? {
              left: `calc(${half} + ${sizes.pixels(textGapUnits)})`,
              right: sizes.pixels(margin),
            }
          : {
              left: sizes.pixels(margin),
              right: `calc(${half} + ${sizes.pixels(textGapUnits)})`,
            }),
      }
    : {
        left: sizes.pixels(margin),
        right: sizes.pixels(margin),
        ...(mediaFirst
          ? {
              top: `calc(${half} + ${sizes.pixels(textGapUnits)})`,
              bottom: sizes.pixels(bottomUnits),
            }
          : {
              top: sizes.pixels(margin),
              bottom: `calc(${half} + ${sizes.pixels(textGapUnits)})`,
            }),
      };
  const pictureDrift = motion.drift("scale");
  return (
    <>
      <MediaFill
        assetId={assetId}
        kinds={["image", "video"]}
        style={{ inset: "auto", ...mediaBox, clipPath: clipFromSeam }}
        pictureStyle={{
          transform: `scale(${String(zoom * pictureDrift.scale)})`,
        }}
      />
      <div
        aria-hidden="true"
        style={{ position: "absolute", background: accent.mark, ...seamStyle }}
      />
      <FitBox style={{ ...textBox, justifyContent: "center" }}>
        <h2
          data-text-prop="heading"
          style={{
            ...displayTextStyle(stylePack),
            fontSize: sizes.text("heading"),
            lineHeight: 1.06,
          }}
        >
          <MotionWords
            words={headingWordsAt(motionFrame).words}
            settledAs="text"
          />
        </h2>
        {body === undefined || body === "" ? null : (
          <p
            data-text-prop="body"
            style={{
              ...bodyTextStyle(stylePack),
              marginTop: sizes.fitted(4),
              fontSize: sizes.fitted(sizes.textUnits("item") * 0.8),
              lineHeight: 1.35,
              color: stylePack.colors.mutedText,
              ...motion.enterAt({ frame: motionFrame, startFrame: bodyStart }),
            }}
          >
            {body}
          </p>
        )}
      </FitBox>
    </>
  );
}
