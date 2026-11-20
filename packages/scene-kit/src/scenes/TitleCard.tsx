import { spring, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { contentBottomUnits } from "../kit/captionArea.js";
import { FitBox } from "../kit/FitBox.js";
import { riseStyle, useMotionFrame } from "../kit/motion.js";
import { useSizes } from "../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../kit/textStyles.js";
import { readTitleCardProps } from "../props/readProps.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";

const accentGrowStartFrame = 0;
const headingStartFrame = 8;
const subheadingStartFrame = 22;
const settleFrame = 40;
const accentSizeUnits = 46;
const accentTopUnits = -10;

export function TitleCard(props: { props: JsonObject }): ReactNode {
  const { heading, subheading } = readTitleCardProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motionFrame = useMotionFrame({ settleFrame });
  const margin = stylePack.layout.marginUnits;
  const accentSize = spring({
    frame: motionFrame,
    startFrame: accentGrowStartFrame,
    framesPerSecond: stylePack.motion.referenceFramesPerSecond,
    from: 0,
    to: accentSizeUnits,
    damping: 14,
  });
  const rise = (startFrame: number) =>
    riseStyle({ motionFrame, startFrame, stylePack, unit: sizes.unit });
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
        }}
      />
      <FitBox
        style={{
          left: sizes.pixels(margin),
          right: sizes.pixels(margin),
          top: sizes.pixels(accentTopUnits + accentSizeUnits + margin / 2),
          bottom: sizes.pixels(contentBottomUnits(stylePack)),
          justifyContent: "flex-end",
        }}
      >
        <h1
          style={{
            ...displayTextStyle(stylePack),
            fontSize: sizes.text("title"),
            lineHeight: 1.05,
            ...rise(headingStartFrame),
          }}
        >
          {heading}
        </h1>
        {subheading === undefined || subheading === "" ? null : (
          <p
            style={{
              ...bodyTextStyle(stylePack),
              color: stylePack.colors.mutedText,
              fontSize: sizes.text("label"),
              lineHeight: 1.3,
              marginTop: sizes.fitted(2.5),
              ...rise(subheadingStartFrame),
            }}
          >
            {subheading}
          </p>
        )}
      </FitBox>
    </>
  );
}
