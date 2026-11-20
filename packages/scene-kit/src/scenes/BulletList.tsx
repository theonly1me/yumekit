import { stagger, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { FitBox } from "../kit/FitBox.js";
import { riseStyle, useMotionFrame } from "../kit/motion.js";
import { useSizes } from "../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../kit/textStyles.js";
import { readBulletListProps } from "../props/readProps.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";

const headingStartFrame = 4;
const firstItemStartFrame = 24;
const itemLineHeight = 1.25;
const bulletUnits = 3.4;
const bulletDropShare = 0.06;

export function BulletList(props: { props: JsonObject }): ReactNode {
  const { heading, items } = readBulletListProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const { staggerFrames, riseFrames } = stylePack.motion;
  const settleFrame =
    stagger({
      index: items.length - 1,
      startFrame: firstItemStartFrame,
      eachFrames: staggerFrames,
    }) + riseFrames;
  const motionFrame = useMotionFrame({ settleFrame });
  const rise = (startFrame: number) =>
    riseStyle({ motionFrame, startFrame, stylePack, unit: sizes.unit });
  const margin = stylePack.layout.marginUnits;
  const itemUnits = sizes.textUnits("item");
  const bulletOffsetUnits =
    (itemUnits * itemLineHeight - bulletUnits) / 2 +
    itemUnits * bulletDropShare;
  return (
    <FitBox
      style={{
        left: sizes.pixels(margin),
        right: sizes.pixels(margin),
        top: sizes.pixels(margin + 2),
        bottom: sizes.pixels(margin + 2),
        justifyContent: "center",
      }}
      contentStyle={{
        display: "flex",
        flexDirection: "column",
        gap: sizes.fitted(4.5),
      }}
    >
      {heading === undefined || heading === "" ? null : (
        <h2
          style={{
            ...displayTextStyle(stylePack),
            fontSize: sizes.text("heading"),
            lineHeight: 1.1,
            ...rise(headingStartFrame),
          }}
        >
          {heading}
        </h2>
      )}
      {[...items.entries()].map(([index, item]) => (
        <div
          key={`${String(index)}-${item}`}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: sizes.fitted(3),
            ...rise(
              stagger({
                index,
                startFrame: firstItemStartFrame,
                eachFrames: staggerFrames,
              }),
            ),
          }}
        >
          <span
            aria-hidden="true"
            style={{
              flex: "none",
              width: sizes.fitted(bulletUnits),
              height: sizes.fitted(bulletUnits),
              marginTop: sizes.fitted(bulletOffsetUnits),
              borderRadius: "50%",
              background: stylePack.colors.bullet,
            }}
          />
          <p
            style={{
              ...bodyTextStyle(stylePack),
              minWidth: 0,
              fontSize: sizes.text("item"),
              lineHeight: itemLineHeight,
            }}
          >
            {item}
          </p>
        </div>
      ))}
    </FitBox>
  );
}
