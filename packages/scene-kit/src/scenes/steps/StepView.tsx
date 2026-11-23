import type { ReactNode } from "react";
import { sceneAccentOf, textOnAccent } from "../../kit/accentColors.js";
import { useKitMotion } from "../../kit/motion.js";
import { useSizes } from "../../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../../kit/textStyles.js";
import { draw, enter } from "../../motion/index.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";

export interface StepTiming {
  circle: number;
  fill: number;
  text: number;
  line: number;
  lineSeconds: number;
}

export function StepView(props: {
  index: number;
  text: string;
  isLast: boolean;
  frame: number;
  timing: StepTiming;
  gap: string;
}): ReactNode {
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const accent = sceneAccentOf(stylePack);
  const isRow = sizes.layout === "wide";
  const circleUnits = isRow ? 15 : 14;
  const lineShare = draw({
    frame: props.frame,
    framesPerSecond: motion.framesPerSecond,
    startFrame: props.timing.line,
    durationSeconds: props.timing.lineSeconds,
  });
  const lineThickness = sizes.fitted(0.6);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isRow ? "column" : "row",
        gap: sizes.fitted(isRow ? 4 : 4.5),
        alignItems: isRow ? "stretch" : "stretch",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          display: "flex",
          flexDirection: isRow ? "row" : "column",
          alignItems: "center",
          flex: "none",
        }}
      >
        <div
          style={{
            flex: "none",
            position: "relative",
            display: "grid",
            placeItems: "center",
            width: sizes.fitted(circleUnits),
            height: sizes.fitted(circleUnits),
            borderRadius: "50%",
            border: `${sizes.fitted(0.5)} solid ${accent.mark}`,
            ...enter({
              kind: "pop",
              frame: props.frame,
              startFrame: props.timing.circle,
              framesPerSecond: motion.framesPerSecond,
              durationSeconds: motion.itemSeconds,
            }),
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: sizes.fitted(0.9),
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              background: accent.mark,
              color: textOnAccent({ stylePack, accent: accent.mark }),
              ...displayTextStyle(stylePack),
              fontSize: sizes.fitted(circleUnits * 0.42),
              lineHeight: 1,
              ...enter({
                kind: "scale",
                frame: props.frame,
                startFrame: props.timing.fill,
                framesPerSecond: motion.framesPerSecond,
                durationSeconds: motion.itemSeconds,
              }),
            }}
          >
            {props.index + 1}
          </div>
        </div>
        {props.isLast ? null : (
          <div
            style={{
              flex: 1,
              alignSelf: "stretch",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: isRow
                ? `0 calc(-1 * ${props.gap}) 0 ${sizes.fitted(2)}`
                : `${sizes.fitted(2)} 0 calc(-1 * ${props.gap})`,
              ...(isRow ? {} : { minHeight: sizes.fitted(4) }),
            }}
          >
            <div
              style={{
                width: isRow ? "100%" : lineThickness,
                height: isRow ? lineThickness : "100%",
                marginRight: isRow ? sizes.fitted(2) : 0,
                marginBottom: isRow ? 0 : sizes.fitted(2),
                borderRadius: lineThickness,
                background: `color-mix(in srgb, ${accent.mark} 70%, transparent)`,
                transformOrigin: isRow ? "left center" : "center top",
                transform:
                  lineShare >= 1
                    ? "none"
                    : `${isRow ? "scaleX" : "scaleY"}(${String(lineShare)})`,
              }}
            />
          </div>
        )}
      </div>
      <p
        data-text-prop={`steps.${String(props.index)}`}
        style={{
          ...bodyTextStyle(stylePack),
          minWidth: 0,
          alignSelf: isRow ? "auto" : "flex-start",
          paddingTop: isRow ? 0 : sizes.fitted(circleUnits * 0.2),
          paddingBottom: isRow ? 0 : sizes.fitted(1),
          fontSize: sizes.fitted(
            sizes.textUnits("item") * (isRow ? 0.9 : 1.05),
          ),
          lineHeight: 1.2,
          ...motion.enterAt({
            frame: props.frame,
            startFrame: props.timing.text,
            distanceUnits: 3,
          }),
        }}
      >
        {props.text}
      </p>
    </div>
  );
}
