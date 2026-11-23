import type { JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { sceneAccentOf } from "../../kit/accentColors.js";
import { centeredContentBox } from "../../kit/captionArea.js";
import { FitBox } from "../../kit/FitBox.js";
import { useKitMotion } from "../../kit/motion.js";
import { useSizes } from "../../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../../kit/textStyles.js";
import { formatNumber, fractionDigitsOf } from "../../motion/formatNumber.js";
import { countUp, draw, pulse } from "../../motion/index.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";
import { readStatProps } from "./readStatProps.js";
import { StatNumber } from "./StatNumber.js";

const countStartFrame = 3;
const countFrames = 34;
const lineStartFrame = 10;
const lineFrames = 16;
const labelStartFrame = 16;
const pulseFrames = 12;
const glowFrames = 16;
const visibleLineShare = 0.05;

export function Stat(props: { props: JsonObject }): ReactNode {
  const { value, prefix, suffix, label } = readStatProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const accent = sceneAccentOf(stylePack);
  const countEnd = motion.framesOf(countStartFrame + countFrames);
  const landingFrame = countEnd - motion.framesOf(5);
  const motionFrame = motion.paced(
    Math.max(
      landingFrame + motion.framesOf(glowFrames),
      motion.framesOf(labelStartFrame + stylePack.motion.riseFrames),
    ),
  );
  const fractionDigits = fractionDigitsOf(value);
  const counted = countUp({
    frame: motionFrame,
    framesPerSecond: motion.framesPerSecond,
    to: value,
    startFrame: motion.framesOf(countStartFrame),
    durationSeconds: motion.framesOf(countFrames) / motion.framesPerSecond,
    fractionDigits,
  });
  const settled = formatNumber({
    value,
    fractionDigits,
    prefix: undefined,
    suffix: undefined,
  });
  const landing = pulse({
    frame: motionFrame,
    framesPerSecond: motion.framesPerSecond,
    atFrame: landingFrame,
    amount: 0.07,
    durationSeconds: motion.framesOf(pulseFrames) / motion.framesPerSecond,
  });
  const glow = Math.max(
    0,
    1 - Math.abs(motionFrame - landingFrame) / motion.framesOf(glowFrames),
  );
  const lineShare = draw({
    frame: motionFrame,
    framesPerSecond: motion.framesPerSecond,
    startFrame: motion.framesOf(lineStartFrame),
    durationSeconds: motion.framesOf(lineFrames) / motion.framesPerSecond,
  });
  const isWide = sizes.layout === "wide";
  const contentDrift = motion.drift("scale");
  const hasLabel = label !== undefined && label !== "";
  return (
    <FitBox
      {...centeredContentBox({
        stylePack,
        sizes,
        boxStyle: {
          transform: contentDrift.transform,
          transformOrigin: "left bottom",
        },
      })}
      contentStyle={{
        display: "flex",
        flexDirection: isWide ? "row" : "column",
        alignItems: isWide ? "center" : "flex-start",
        gap: sizes.fitted(isWide ? 6 : 5),
      }}
    >
      <div style={{ position: "relative", flex: "none", maxWidth: "100%" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "-20% -12%",
            borderRadius: "50%",
            background: `radial-gradient(closest-side, ${accent.mark}, transparent)`,
            opacity: 0.45 * glow,
          }}
        />
        <StatNumber
          prefix={prefix}
          suffix={suffix}
          shown={counted.text}
          settled={settled}
          affixColor={accent.text}
          style={{
            position: "relative",
            transformOrigin: "left 60%",
            transform: landing === 1 ? "none" : `scale(${String(landing)})`,
          }}
          numberStyle={{
            ...displayTextStyle(stylePack),
            fontSize: sizes.text("number"),
            lineHeight: 1.16,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            textWrap: "nowrap",
          }}
        />
      </div>
      {hasLabel ? (
        <div
          style={{
            display: "flex",
            flexDirection: isWide ? "row" : "column",
            alignItems: isWide ? "center" : "flex-start",
            gap: sizes.fitted(isWide ? 5 : 4),
            minWidth: 0,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              flex: "none",
              width: sizes.fitted(isWide ? 0.7 : 18),
              height: sizes.fitted(isWide ? 28 : 0.7),
              borderRadius: sizes.fitted(0.35),
              background: accent.mark,
              opacity: lineShare > visibleLineShare ? 1 : 0,
              transformOrigin: isWide ? "center top" : "left center",
              transform:
                lineShare >= 1
                  ? "none"
                  : `${isWide ? "scaleY" : "scaleX"}(${String(lineShare)})`,
            }}
          />
          <p
            data-text-prop="label"
            style={{
              ...bodyTextStyle(stylePack),
              maxWidth: isWide ? sizes.pixels(72) : undefined,
              fontSize: sizes.text("item"),
              lineHeight: 1.2,
              textWrap: "balance",
              ...motion.enterAt({
                frame: motionFrame,
                startFrame: motion.framesOf(labelStartFrame),
                kind: isWide ? "slide-right" : "rise",
                distanceUnits: 4,
              }),
            }}
          >
            {label}
          </p>
        </div>
      ) : null}
    </FitBox>
  );
}
