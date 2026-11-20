import type { CSSProperties, ReactNode } from "react";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import { FitBox } from "./FitBox.js";
import { useSizes } from "./sizes.js";
import { bodyTextStyle } from "./textStyles.js";

const paddingUnits = 3;
const wideBottomUnits = 6;
const tallBottomUnits = 24;

export function CaptionPanel(props: {
  placement: "top" | "bottom";
  style?: CSSProperties;
  children: ReactNode;
}): ReactNode {
  const stylePack = useStylePack();
  const sizes = useSizes();
  const margin = stylePack.layout.marginUnits;
  const bottomUnits =
    sizes.layout === "tall" ? tallBottomUnits : wideBottomUnits;
  const isTop = props.placement === "top";
  return (
    <FitBox
      style={{
        left: sizes.pixels(margin - paddingUnits),
        right: sizes.pixels(margin - paddingUnits),
        top: isTop ? sizes.pixels(margin - paddingUnits) : "50%",
        bottom: isTop ? "50%" : sizes.pixels(bottomUnits),
        justifyContent: isTop ? "flex-start" : "flex-end",
        alignItems: "flex-start",
      }}
    >
      <p
        style={{
          ...bodyTextStyle(stylePack),
          fontSize: sizes.text("caption"),
          lineHeight: 1.35,
          padding: `${sizes.fitted(1.6)} ${sizes.fitted(paddingUnits)}`,
          borderRadius: sizes.fitted(2),
          background: stylePack.colors.captionPanel,
          ...props.style,
        }}
      >
        {props.children}
      </p>
    </FitBox>
  );
}
