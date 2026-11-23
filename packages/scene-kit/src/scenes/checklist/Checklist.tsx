import type { JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { sceneAccentOf, textOnAccent } from "../../kit/accentColors.js";
import { CheckMark } from "../../kit/CheckMark.js";
import { HeadedContent } from "../../kit/HeadedContent.js";
import { useKitMotion } from "../../kit/motion.js";
import { MotionWords } from "../../kit/MotionWords.js";
import { useSizes } from "../../kit/sizes.js";
import { bodyTextStyle } from "../../kit/textStyles.js";
import { draw, enter, sequence } from "../../motion/index.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";
import { readChecklistProps } from "./readChecklistProps.js";

const firstItemFrame = 8;
const itemStaggerFrames = 9;
const checkDelayFrames = 7;
const checkFrames = 9;
const itemLineHeight = 1.25;

export function Checklist(props: { props: JsonObject }): ReactNode {
  const { heading, items } = readChecklistProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const accent = sceneAccentOf(stylePack);
  const itemStarts = sequence({
    count: items.length,
    framesPerSecond: motion.framesPerSecond,
    startFrame: motion.framesOf(heading === undefined ? 2 : firstItemFrame),
    eachSeconds: motion.framesOf(itemStaggerFrames) / motion.framesPerSecond,
    itemSeconds: motion.itemSeconds,
  });
  const checkStartOf = (index: number) =>
    (itemStarts[index] ?? 0) + motion.framesOf(checkDelayFrames);
  const headingWordsAt = motion.wordsFrom({
    text: heading ?? "",
    startFrame: 0,
  });
  const motionFrame = motion.paced(
    Math.max(
      headingWordsAt(0).settleFrame,
      checkStartOf(items.length - 1) + motion.framesOf(checkFrames + 6),
    ),
  );
  const itemUnits = sizes.textUnits("item");
  const boxUnits = itemUnits * 1.05;
  const contentDrift = motion.drift("scale");
  return (
    <HeadedContent
      heading={heading}
      headingContent={
        <MotionWords
          words={headingWordsAt(motionFrame).words}
          settledAs="text"
        />
      }
      boxStyle={{
        transform: contentDrift.transform,
        transformOrigin: "center bottom",
      }}
      contentStyle={{ gap: sizes.fitted(itemUnits * 0.6) }}
    >
      {[...items.entries()].map(([index, item]) => {
        const checkStart = checkStartOf(index);
        const checkShare = draw({
          frame: motionFrame,
          framesPerSecond: motion.framesPerSecond,
          startFrame: checkStart,
          durationSeconds:
            motion.framesOf(checkFrames) / motion.framesPerSecond,
        });
        return (
          <div
            key={`${String(index)}-${item}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: sizes.fitted(3.2),
              ...motion.enterAt({
                frame: motionFrame,
                startFrame: itemStarts[index] ?? 0,
                distanceUnits: 3,
              }),
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "relative",
                flex: "none",
                width: sizes.fitted(boxUnits),
                height: sizes.fitted(boxUnits),
                marginTop: sizes.fitted(
                  (itemUnits * itemLineHeight - boxUnits) / 2,
                ),
                borderRadius: sizes.fitted(
                  Math.max(0.5, stylePack.cornerUnits * 1.4),
                ),
                border: `${sizes.fitted(0.45)} solid color-mix(in srgb, ${stylePack.colors.mutedText} 60%, transparent)`,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: sizes.fitted(-0.45),
                  borderRadius: "inherit",
                  background: accent.mark,
                  ...enter({
                    kind: "pop",
                    frame: motionFrame,
                    startFrame: checkStart - motion.framesOf(2),
                    framesPerSecond: motion.framesPerSecond,
                    durationSeconds: motion.itemSeconds,
                  }),
                }}
              />
              <CheckMark
                share={checkShare}
                color={textOnAccent({ stylePack, accent: accent.mark })}
                style={{
                  position: "absolute",
                  inset: "12%",
                  width: "76%",
                  height: "76%",
                }}
              />
            </span>
            <p
              data-text-prop={`items.${String(index)}`}
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
        );
      })}
    </HeadedContent>
  );
}
