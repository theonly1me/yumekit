import { tween, type JsonObject } from "@yumekit/scene";
import type { CSSProperties, ReactNode } from "react";
import { sceneAccentOf } from "../../kit/accentColors.js";
import { centeredContentBox } from "../../kit/captionArea.js";
import { FitBox } from "../../kit/FitBox.js";
import { useKitMotion } from "../../kit/motion.js";
import { useSizes } from "../../kit/sizes.js";
import { entryCurve } from "../../motion/curves.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";
import {
  CompareRowCell,
  CompareTitle,
  type CompareSide,
} from "./CompareCells.js";
import { compareTimingOf } from "./compareTiming.js";
import { readCompareProps } from "./readCompareProps.js";

const cardGapUnits = 4;

export function Compare(props: { props: JsonObject }): ReactNode {
  const { left, right, rows } = readCompareProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const accent = sceneAccentOf(stylePack);
  const timing = compareTimingOf({ motion, rowCount: rows.length });
  const motionFrame = motion.paced(timing.settleFrame);
  const isSideBySide = sizes.layout !== "tall";
  const cardShare = tween({
    frame: motionFrame,
    startFrame: timing.rightCard,
    endFrame: timing.rightCard + motion.itemSeconds * motion.framesPerSecond,
    from: 0,
    to: 1,
    easing: entryCurve,
  });
  const radius = sizes.fitted(Math.max(0.4, stylePack.cornerUnits * 2));
  const cardStyleOf = (side: CompareSide): CSSProperties =>
    side === "left"
      ? {
          borderRadius: radius,
          border: `${sizes.fitted(0.25)} solid color-mix(in srgb, ${stylePack.colors.mutedText} 35%, transparent)`,
          ...motion.enterAt({
            frame: motionFrame,
            startFrame: 0,
            kind: "fade",
          }),
        }
      : {
          borderRadius: radius,
          background: stylePack.colors.surface,
          border: `${sizes.fitted(0.35)} solid ${accent.mark}`,
          boxShadow: `0 0 ${sizes.fitted(6)} color-mix(in srgb, ${accent.mark} 28%, transparent)`,
          opacity: cardShare,
          transform:
            cardShare >= 1
              ? "none"
              : `scale(${String(0.94 + 0.06 * cardShare)})`,
        };
  const titleOf = ({
    side,
    style,
  }: {
    side: CompareSide;
    style?: CSSProperties;
  }) => (
    <CompareTitle
      key={`title-${side}`}
      side={side}
      text={side === "left" ? left : right}
      frame={motionFrame}
      startFrame={side === "left" ? timing.leftTitle : timing.rightTitle}
      {...(style === undefined ? {} : { style })}
    />
  );
  const rowOf = ({
    side,
    index,
    style,
  }: {
    side: CompareSide;
    index: number;
    style?: CSSProperties;
  }) => (
    <CompareRowCell
      key={`${side}-${String(index)}`}
      side={side}
      index={index}
      text={rows[index]?.[side] ?? ""}
      frame={motionFrame}
      startFrame={
        (side === "left" ? timing.leftRows : timing.rightRows)[index] ?? 0
      }
      checkStart={timing.checkStart(index)}
      checkSeconds={timing.checkSeconds}
      isLast={index === rows.length - 1}
      {...(style === undefined ? {} : { style })}
    />
  );
  const sides: CompareSide[] = ["left", "right"];
  const contentDrift = motion.drift("scale");
  const box = centeredContentBox({
    stylePack,
    sizes,
    boxStyle: {
      transform: contentDrift.transform,
      transformOrigin: "center bottom",
    },
  });
  if (isSideBySide) {
    return (
      <FitBox
        {...box}
        contentStyle={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: `repeat(${String(rows.length + 1)}, auto)`,
          columnGap: sizes.fitted(cardGapUnits),
        }}
      >
        {[...sides.entries()].map(([column, side]) => (
          <div
            key={`card-${side}`}
            aria-hidden="true"
            style={{
              gridColumn: column + 1,
              gridRow: "1 / -1",
              ...cardStyleOf(side),
            }}
          />
        ))}
        {[...sides.entries()].map(([column, side]) =>
          titleOf({ side, style: { gridColumn: column + 1, gridRow: 1 } }),
        )}
        {rows.flatMap((...[, index]) =>
          [...sides.entries()].map(([column, side]) =>
            rowOf({
              side,
              index,
              style: { gridColumn: column + 1, gridRow: index + 2 },
            }),
          ),
        )}
      </FitBox>
    );
  }
  return (
    <FitBox
      {...box}
      contentStyle={{
        display: "flex",
        flexDirection: "column",
        gap: sizes.fitted(cardGapUnits),
      }}
    >
      {sides.map((side) => (
        <div key={side} style={{ position: "relative" }}>
          <div
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, ...cardStyleOf(side) }}
          />
          <div style={{ position: "relative" }}>
            {titleOf({ side })}
            {rows.map((...[, index]) => rowOf({ side, index }))}
          </div>
        </div>
      ))}
    </FitBox>
  );
}
