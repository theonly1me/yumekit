import { stagger, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { HeadedContent } from "../kit/HeadedContent.js";
import { riseStyle, useMotionFrame } from "../kit/motion.js";
import { useSizes } from "../kit/sizes.js";
import { bodyTextStyle } from "../kit/textStyles.js";
import { readBulletListProps } from "../props/readProps.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";

const headingStartFrame = 4;
const firstItemStartFrame = 24;
const itemLineHeight = 1.25;
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
  const itemUnits = sizes.textUnits("item");
  const { bulletShareOfItem, itemGapShareOfItem } = stylePack.layout;
  const bulletUnits = itemUnits * bulletShareOfItem;
  const bulletOffsetUnits =
    (itemUnits * itemLineHeight - bulletUnits) / 2 +
    itemUnits * bulletDropShare;
  return (
    <HeadedContent
      heading={heading}
      headingStyle={rise(headingStartFrame)}
      contentStyle={{ gap: sizes.fitted(itemUnits * itemGapShareOfItem) }}
    >
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
    </HeadedContent>
  );
}
