import type { JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { HeadedContent } from "../kit/HeadedContent.js";
import { useKitMotion } from "../kit/motion.js";
import { MotionWords } from "../kit/MotionWords.js";
import { useSizes } from "../kit/sizes.js";
import { bodyTextStyle } from "../kit/textStyles.js";
import { readBulletListProps } from "../props/readProps.js";
import { enter, sequence, words } from "../motion/index.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";

const headingStartFrame = 2;
const firstItemStartFrame = 12;
const textDelayFrames = 2;
const slideUnits = 4;
const itemLineHeight = 1.25;
const bulletDropShare = 0.06;

export function BulletList(props: { props: JsonObject }): ReactNode {
  const { heading, items } = readBulletListProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const itemStarts = sequence({
    count: items.length,
    framesPerSecond: motion.framesPerSecond,
    startFrame: motion.framesOf(firstItemStartFrame),
    eachSeconds: motion.staggerFrames / motion.framesPerSecond,
    itemSeconds: motion.itemSeconds,
  });
  const headingWordsAt = (frame: number) =>
    words({
      text: heading ?? "",
      frame,
      framesPerSecond: motion.framesPerSecond,
      startFrame: motion.framesOf(headingStartFrame),
      eachSeconds: motion.wordStaggerSeconds,
      wordSeconds: motion.itemSeconds,
      unit: motion.unit,
      distanceUnits: stylePack.motion.riseDistanceUnits,
    });
  const motionFrame = motion.paced(
    Math.max(
      headingWordsAt(0).settleFrame,
      (itemStarts.at(-1) ?? 0) +
        motion.framesOf(textDelayFrames + stylePack.motion.riseFrames),
    ),
  );
  const headingWords = headingWordsAt(motionFrame);
  const contentDrift = motion.drift("scale");
  const itemUnits = sizes.textUnits("item");
  const { bulletShareOfItem, itemGapShareOfItem } = stylePack.layout;
  const bulletUnits = itemUnits * bulletShareOfItem;
  const bulletOffsetUnits =
    (itemUnits * itemLineHeight - bulletUnits) / 2 +
    itemUnits * bulletDropShare;
  return (
    <HeadedContent
      heading={heading}
      headingContent={
        <MotionWords words={headingWords.words} settledAs="text" />
      }
      boxStyle={{
        transform: contentDrift.transform,
        transformOrigin: "center bottom",
      }}
      contentStyle={{ gap: sizes.fitted(itemUnits * itemGapShareOfItem) }}
    >
      {[...items.entries()].map(([index, item]) => (
        <div
          key={`${String(index)}-${item}`}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: sizes.fitted(3),
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
              ...enter({
                kind: "pop",
                frame: motionFrame,
                startFrame: itemStarts[index] ?? 0,
                framesPerSecond: motion.framesPerSecond,
                durationSeconds: motion.itemSeconds,
              }),
            }}
          />
          <p
            data-text-prop={`items.${String(index)}`}
            style={{
              ...bodyTextStyle(stylePack),
              minWidth: 0,
              fontSize: sizes.text("item"),
              lineHeight: itemLineHeight,
              ...motion.enterAt({
                kind: "slide-left",
                frame: motionFrame,
                startFrame:
                  (itemStarts[index] ?? 0) + motion.framesOf(textDelayFrames),
                distanceUnits: slideUnits,
              }),
            }}
          >
            {item}
          </p>
        </div>
      ))}
    </HeadedContent>
  );
}
