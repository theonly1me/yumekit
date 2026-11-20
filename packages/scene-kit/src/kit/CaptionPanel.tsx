import type { CSSProperties, ReactNode } from "react";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import { FitBox } from "./FitBox.js";
import { useSizes } from "./sizes.js";
import { bodyTextStyle } from "./textStyles.js";

const paddingUnits = 3;
const bottomInsetUnits = 2.5;

export function CaptionPanel(props: {
  placement: "top" | "bottom";
  style?: CSSProperties;
  children: ReactNode;
}): ReactNode {
  const stylePack = useStylePack();
  const sizes = useSizes();
  const margin = stylePack.layout.marginUnits;
  const { captionAreaUnits } = stylePack.layout;
  const isTop = props.placement === "top";
  return (
    <FitBox
      style={{
        left: sizes.pixels(margin - paddingUnits),
        right: sizes.pixels(margin - paddingUnits),
        top: isTop
          ? sizes.pixels(margin - paddingUnits)
          : `calc(100% - ${sizes.pixels(captionAreaUnits)})`,
        bottom: isTop ? "50%" : sizes.pixels(bottomInsetUnits),
        justifyContent: isTop ? "flex-start" : "flex-end",
        alignItems: "flex-start",
      }}
    >
      <p
        style={{
          ...bodyTextStyle(stylePack),
          fontSize: sizes.text("caption"),
          lineHeight: 1.35,
          padding: `${sizes.fitted(1.4)} ${sizes.fitted(paddingUnits)}`,
          borderRadius: sizes.fitted(2),
          background: stylePack.colors.captionPanel,
          color: stylePack.colors.captionText,
          ...props.style,
        }}
      >
        {props.children}
      </p>
    </FitBox>
  );
}
