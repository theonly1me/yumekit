import { stagger, tween, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { HeadedContent } from "../kit/HeadedContent.js";
import { riseStyle, useMotionFrame } from "../kit/motion.js";
import { useSizes } from "../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../kit/textStyles.js";
import { readBarChartProps } from "../props/readProps.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import { formatValue, fractionDigitsOf } from "./formatValue.js";

const headingStartFrame = 2;
const firstBarStartFrame = 20;
const growFrames = 40;
const barGapUnits = 5;

export function BarChart(props: { props: JsonObject }): ReactNode {
  const { heading, bars, valuePrefix, valueSuffix } = readBarChartProps(
    props.props,
  );
  const stylePack = useStylePack();
  const sizes = useSizes();
  const eachFrames = stylePack.motion.staggerFrames;
  const startOf = (index: number) =>
    stagger({ index, startFrame: firstBarStartFrame, eachFrames });
  const motionFrame = useMotionFrame({
    settleFrame: startOf(bars.length - 1) + growFrames,
  });
  const rise = (startFrame: number) =>
    riseStyle({ motionFrame, startFrame, stylePack, unit: sizes.unit });
  const longestBarPercent =
    100 *
    (sizes.layout === "wide"
      ? stylePack.layout.longestBarShare
      : stylePack.layout.stackedLongestBarShare);
  const largestValue = Math.max(0, ...bars.map((bar) => bar.value));
  return (
    <HeadedContent
      heading={heading}
      headingStyle={rise(headingStartFrame)}
      contentStyle={{ gap: sizes.fitted(barGapUnits) }}
    >
      {[...bars.entries()].map(([index, bar]) => {
        const startFrame = startOf(index);
        const grow = (to: number) =>
          tween({
            frame: motionFrame,
            startFrame,
            endFrame: startFrame + growFrames,
            from: 0,
            to,
          });
        const share =
          largestValue === 0 ? 0 : Math.max(0, bar.value) / largestValue;
        const color =
          stylePack.colors.bars[index % stylePack.colors.bars.length] ??
          stylePack.colors.accent;
        return (
          <div key={`${String(index)}-${bar.label}`} style={rise(startFrame)}>
            <p
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
                  width: `${String(grow(share * longestBarPercent))}%`,
                  minWidth: sizes.fitted(0.6),
                  borderRadius: sizes.fitted(1.2),
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
                }}
              >
                {formatValue({
                  value: grow(bar.value),
                  fractionDigits: fractionDigitsOf(bar.value),
                  prefix: valuePrefix,
                  suffix: valueSuffix,
                })}
              </span>
            </div>
          </div>
        );
      })}
    </HeadedContent>
  );
}
