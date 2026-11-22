import type { CSSProperties, ReactNode } from "react";
import { sceneAccentOf } from "../../kit/accentColors.js";
import { CheckMark, CrossMark } from "../../kit/CheckMark.js";
import { useKitMotion } from "../../kit/motion.js";
import { useSizes } from "../../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../../kit/textStyles.js";
import { draw } from "../../motion/index.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";

export type CompareSide = "left" | "right";

export const cellPaddingUnits = 4.5;

export function CompareTitle(props: {
  side: CompareSide;
  text: string;
  frame: number;
  startFrame: number;
  style?: CSSProperties;
}): ReactNode {
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const accent = sceneAccentOf(stylePack);
  return (
    <p
      data-text-prop={props.side}
      style={{
        ...displayTextStyle(stylePack),
        fontSize: sizes.fitted(
          sizes.textUnits("item") * (sizes.layout === "tall" ? 1 : 1.15),
        ),
        lineHeight: 1.1,
        color: props.side === "left" ? stylePack.colors.mutedText : accent.text,
        padding: `${sizes.fitted(cellPaddingUnits)} ${sizes.fitted(cellPaddingUnits)} ${sizes.fitted(1.5)}`,
        ...motion.enterAt({ frame: props.frame, startFrame: props.startFrame }),
        ...props.style,
      }}
    >
      {props.text}
    </p>
  );
}

export function CompareRowCell(props: {
  side: CompareSide;
  index: number;
  text: string;
  frame: number;
  startFrame: number;
  checkStart: number;
  checkSeconds: number;
  isLast: boolean;
  style?: CSSProperties;
}): ReactNode {
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const accent = sceneAccentOf(stylePack);
  const isLeft = props.side === "left";
  const markSize = sizes.fitted(sizes.textUnits("item") * 0.85);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: sizes.fitted(2.2),
        padding: `${sizes.fitted(1.4)} ${sizes.fitted(cellPaddingUnits)}`,
        paddingBottom: sizes.fitted(props.isLast ? cellPaddingUnits : 1.4),
        ...motion.enterAt({
          frame: props.frame,
          startFrame: props.startFrame,
          kind: isLeft ? "rise" : "slide-right",
          distanceUnits: 3,
        }),
        ...props.style,
      }}
    >
      <span style={{ flex: "none", width: markSize, height: markSize }}>
        {isLeft ? (
          <CrossMark
            color={stylePack.colors.mutedText}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <CheckMark
            color={accent.mark}
            share={draw({
              frame: props.frame,
              framesPerSecond: motion.framesPerSecond,
              startFrame: props.checkStart,
              durationSeconds: props.checkSeconds,
            })}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </span>
      <p
        data-text-prop={`rows.${String(props.index)}.${props.side}`}
        style={{
          ...bodyTextStyle(stylePack),
          minWidth: 0,
          fontSize: sizes.fitted(
            sizes.textUnits("item") * (sizes.layout === "tall" ? 0.82 : 0.9),
          ),
          lineHeight: 1.25,
          color: isLeft ? stylePack.colors.mutedText : stylePack.colors.text,
        }}
      >
        {props.text}
      </p>
    </div>
  );
}
