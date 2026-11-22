import type { CSSProperties, ReactNode } from "react";
import { draw } from "../motion/index.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import { sceneAccentOf } from "./accentColors.js";
import { useKitMotion } from "./motion.js";
import { useSizes } from "./sizes.js";
import { bodyTextStyle } from "./textStyles.js";

const lineUnits = 7;
const lineSeconds = 0.4;
const textDelaySeconds = 0.13;

export function kickerSettleFrame(options: {
  startFrame: number;
  framesPerSecond: number;
  itemSeconds: number;
}): number {
  return (
    options.startFrame +
    (textDelaySeconds + options.itemSeconds) * options.framesPerSecond
  );
}

export function Kicker(props: {
  text: string;
  textProp: string;
  frame: number;
  startFrame: number;
  style?: CSSProperties;
}): ReactNode {
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const accent = sceneAccentOf(stylePack);
  const lineShare = draw({
    frame: props.frame,
    framesPerSecond: motion.framesPerSecond,
    startFrame: props.startFrame,
    durationSeconds: lineSeconds,
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: sizes.fitted(2.4),
        ...props.style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flex: "none",
          width: sizes.fitted(lineUnits),
          height: sizes.fitted(0.8),
          borderRadius: sizes.fitted(0.4),
          background: accent.mark,
          transformOrigin: "left center",
          transform: lineShare >= 1 ? "none" : `scaleX(${String(lineShare)})`,
        }}
      />
      <p
        data-text-prop={props.textProp}
        style={{
          ...bodyTextStyle(stylePack),
          minWidth: 0,
          fontSize: sizes.text("label"),
          lineHeight: 1.25,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: stylePack.colors.mutedText,
          ...motion.enterAt({
            frame: props.frame,
            startFrame:
              props.startFrame + textDelaySeconds * motion.framesPerSecond,
            kind: "slide-right",
            distanceUnits: 3,
          }),
        }}
      >
        {props.text}
      </p>
    </div>
  );
}
