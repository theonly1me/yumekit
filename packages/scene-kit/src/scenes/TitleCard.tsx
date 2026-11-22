import { spring, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { contentBottomUnits } from "../kit/captionArea.js";
import { FitBox } from "../kit/FitBox.js";
import { useKitMotion } from "../kit/motion.js";
import { MotionWords } from "../kit/MotionWords.js";
import { useSizes } from "../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../kit/textStyles.js";
import { readTitleCardProps } from "../props/readProps.js";
import { words } from "../motion/index.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";

const accentGrowStartFrame = 0;
const headingStartFrame = 5;
const subheadingGapFrames = 3;
const accentSizeUnits = 46;
const accentTopUnits = -10;
const gapBelowAccentUnits = 2.5;

export function TitleCard(props: { props: JsonObject }): ReactNode {
  const { heading, subheading } = readTitleCardProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const headingWordsAt = (frame: number) =>
    words({
      text: heading,
      frame,
      framesPerSecond: motion.framesPerSecond,
      startFrame: motion.framesOf(headingStartFrame),
      eachSeconds: motion.wordStaggerSeconds,
      wordSeconds: motion.itemSeconds,
      unit: motion.unit,
      distanceUnits: stylePack.motion.riseDistanceUnits,
    });
  const subheadingStart =
    headingWordsAt(0).settleFrame -
    motion.framesOf(stylePack.motion.riseFrames - subheadingGapFrames);
  const motionFrame = motion.paced(
    subheadingStart + motion.framesOf(stylePack.motion.riseFrames),
  );
  const headingWords = headingWordsAt(motionFrame);
  const margin = stylePack.layout.marginUnits;
  const accentSize = spring({
    frame: motionFrame,
    startFrame: motion.framesOf(accentGrowStartFrame),
    framesPerSecond: motion.framesPerSecond,
    from: 0,
    to: accentSizeUnits,
    stiffness: 120,
    damping: 13,
  });
  const accentDrift = motion.drift("scale");
  const textDrift = motion.drift("scale");
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: sizes.pixels(-8),
          top: sizes.pixels(accentTopUnits),
          width: sizes.pixels(accentSize),
          height: sizes.pixels(accentSize),
          borderRadius: "50%",
          background: stylePack.colors.accent,
          transform: accentDrift.transform,
        }}
      />
      <FitBox
        style={{
          left: sizes.pixels(margin),
          right: sizes.pixels(margin),
          ...(sizes.layout === "wide"
            ? { maxWidth: sizes.pixels(stylePack.layout.wideTitleUnits) }
            : {}),
          top: sizes.pixels(
            sizes.layout === "wide"
              ? margin
              : accentTopUnits + accentSizeUnits + gapBelowAccentUnits,
          ),
          bottom: sizes.pixels(contentBottomUnits(stylePack)),
          justifyContent: "flex-end",
          transform: textDrift.transform,
          transformOrigin: "left bottom",
        }}
      >
        <h1
          data-text-prop="heading"
          style={{
            ...displayTextStyle(stylePack),
            fontSize: sizes.text("title"),
            lineHeight: 1.05,
          }}
        >
          <MotionWords words={headingWords.words} settledAs="text" />
        </h1>
        {subheading === undefined || subheading === "" ? null : (
          <p
            data-text-prop="subheading"
            style={{
              ...bodyTextStyle(stylePack),
              color: stylePack.colors.mutedText,
              fontSize: sizes.text("label"),
              lineHeight: 1.3,
              marginTop: sizes.fitted(2.5),
              ...motion.enterAt({
                frame: motionFrame,
                startFrame: subheadingStart,
              }),
            }}
          >
            {subheading}
          </p>
        )}
      </FitBox>
    </>
  );
}
