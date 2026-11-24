import type { ReactNode } from "react";
import { FitBox } from "../kit/FitBox.js";
import type { MotionStyle } from "../motion/index.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import { boxStyle, type FilmBox, type FilmGrid } from "./filmGrid.js";

export type WindowKind = "plain" | "none";

const edgeShare = 0.16;

export function MediaWindow(props: {
  box: FilmBox;
  grid: FilmGrid;
  motion: MotionStyle;
  window?: WindowKind;
  children: ReactNode;
}): ReactNode {
  const stylePack = useStylePack();
  const { unit } = props.grid.sizes;
  const isPlain = (props.window ?? "plain") === "plain";
  const edge = `color-mix(in srgb, ${stylePack.colors.text} ${String(edgeShare * 100)}%, transparent)`;
  return (
    <div
      style={{
        ...boxStyle(props.box),
        ...props.motion,
        overflow: "hidden",
        borderRadius: isPlain
          ? `${String(Math.max(0.6, stylePack.cornerUnits) * unit)}px`
          : 0,
        boxShadow: isPlain
          ? `0 0 0 1px ${edge}, 0 ${String(2 * unit)}px ${String(8 * unit)}px rgb(0 0 0 / 0.28)`
          : "none",
      }}
    >
      {props.children}
    </div>
  );
}

export function MediaLabel(props: {
  box: FilmBox;
  grid: FilmGrid;
  motion: MotionStyle;
  textProp: string;
  text: string;
}): ReactNode {
  const stylePack = useStylePack();
  const { sizes, labelGap } = props.grid;
  return (
    <FitBox
      style={{
        left: `${String(props.box.left)}px`,
        top: `${String(props.box.top + props.box.height + labelGap)}px`,
        width: `${String(props.box.width)}px`,
        height: `${String(labelRowHeight(props.grid) - labelGap)}px`,
      }}
    >
      <p
        data-text-prop={props.textProp}
        style={{
          margin: 0,
          fontSize: sizes.text("filmLabel"),
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          color: stylePack.colors.mutedText,
          ...props.motion,
        }}
      >
        {props.text}
      </p>
    </FitBox>
  );
}

export function labelRowHeight(grid: FilmGrid): number {
  return (
    grid.labelGap + grid.sizes.textUnits("filmLabel") * grid.sizes.unit * 1.25
  );
}
