import type { JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { HeadedContent } from "../kit/HeadedContent.js";
import { useKitMotion } from "../kit/motion.js";
import { MotionWords } from "../kit/MotionWords.js";
import { useSizes } from "../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../kit/textStyles.js";
import { readBarChartProps } from "../props/readProps.js";
import { countUp, pulse, sequence, words } from "../motion/index.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";

const headingStartFrame = 2;
const firstBarStartFrame = 12;
const growFrames = 30;
const barGapUnits = 5;

export function BarChart(props: { props: JsonObject }): ReactNode {
  const { heading, bars, valuePrefix, valueSuffix } = readBarChartProps(
    props.props,
  );
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const growSeconds = motion.framesOf(growFrames) / motion.framesPerSecond;
  const barStarts = sequence({
    count: bars.length,
    framesPerSecond: motion.framesPerSecond,
    startFrame: motion.framesOf(firstBarStartFrame),
    eachSeconds: motion.staggerFrames / motion.framesPerSecond,
    itemSeconds: growSeconds,
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
      (barStarts.at(-1) ?? 0) + motion.framesOf(growFrames),
    ),
  );
  const countFrom = (options: { startFrame: number; to: number }) =>
    countUp({
      ...options,
      frame: motionFrame,
      framesPerSecond: motion.framesPerSecond,
      durationSeconds: growSeconds,
      prefix: valuePrefix,
      suffix: valueSuffix,
    });
  const contentDrift = motion.drift("scale");
  const longestBarPercent =
    100 *
    (sizes.layout === "wide"
      ? stylePack.layout.longestBarShare
      : stylePack.layout.stackedLongestBarShare);
  const largestValue = Math.max(0, ...bars.map((bar) => bar.value));
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
      contentStyle={{ gap: sizes.fitted(barGapUnits) }}
    >
      {[...bars.entries()].map(([index, bar]) => {
        const startFrame = barStarts[index] ?? 0;
        const growth = countFrom({ startFrame, to: 1 }).value;
        const counted = countFrom({ startFrame, to: bar.value });
        const landing = pulse({
          frame: motionFrame,
          framesPerSecond: motion.framesPerSecond,
          atFrame: startFrame + motion.framesOf(growFrames) * 0.55,
          amount: 0.07,
        });
        const share =
          largestValue === 0 ? 0 : Math.max(0, bar.value) / largestValue;
        const color =
          stylePack.colors.bars[index % stylePack.colors.bars.length] ??
          stylePack.colors.accent;
        return (
          <div
            key={`${String(index)}-${bar.label}`}
            style={motion.enterAt({ frame: motionFrame, startFrame })}
          >
            <p
              data-text-prop={`bars.${String(index)}.label`}
              style={{
                ...bodyTextStyle(stylePack),
                fontSize: sizes.text("label"),
                lineHeight: 1.2,
                marginBottom: sizes.fitted(1.2),
              }}
            >
              {bar.label}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: sizes.fitted(2.5),
              }}
            >
              <div
                style={{
                  flex: "none",
                  height: sizes.fitted(stylePack.layout.barUnits),
                  width: `${String(growth * share * longestBarPercent)}%`,
                  minWidth: sizes.fitted(0.6),
                  borderRadius: sizes.fitted(stylePack.cornerUnits),
                  background: color,
                }}
              />
              <span
                style={{
                  ...displayTextStyle(stylePack),
                  fontSize: sizes.text("value"),
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  transformOrigin: "left center",
                  transform:
                    landing === 1 ? "none" : `scale(${String(landing)})`,
                }}
              >
                {counted.text}
              </span>
            </div>
          </div>
        );
      })}
    </HeadedContent>
  );
}
