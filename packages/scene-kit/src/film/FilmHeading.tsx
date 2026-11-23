import type { ReactNode } from "react";
import { sceneAccentOf } from "../kit/accentColors.js";
import { FitBox } from "../kit/FitBox.js";
import { displayTextStyle } from "../kit/textStyles.js";
import type { MotionStyle } from "../motion/index.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import { boxStyle, type FilmBox, type FilmGrid } from "./filmGrid.js";
import { splitAccent } from "./splitAccent.js";

export function FilmHeading(props: {
  heading: string | undefined;
  accent: string | undefined;
  grid: FilmGrid;
  motion: MotionStyle;
  box?: FilmBox;
}): ReactNode {
  const stylePack = useStylePack();
  if (props.heading === undefined) return null;
  const parts = splitAccent({ text: props.heading, accent: props.accent });
  return (
    <FitBox style={boxStyle(props.box ?? props.grid.heading)}>
      <h2
        data-text-prop="heading"
        style={{
          ...displayTextStyle(stylePack),
          ...props.motion,
          fontSize: props.grid.sizes.text("filmHeading"),
          lineHeight: 1.06,
          letterSpacing: "-0.015em",
          textWrap: "balance",
        }}
      >
        {parts.before}
        {parts.accent === "" ? null : (
          <span style={{ color: sceneAccentOf(stylePack).text }}>
            {parts.accent}
          </span>
        )}
        {parts.after}
      </h2>
    </FitBox>
  );
}
