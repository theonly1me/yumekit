import type { CSSProperties, ReactNode } from "react";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import { centeredContentBox } from "./captionArea.js";
import { FitBox } from "./FitBox.js";
import { useSizes } from "./sizes.js";
import { displayTextStyle } from "./textStyles.js";

const headingGapUnits = 4.5;

export function HeadedContent(props: {
  heading: string | undefined;
  headingStyle: CSSProperties;
  contentStyle: CSSProperties;
  children: ReactNode;
}): ReactNode {
  const stylePack = useStylePack();
  const sizes = useSizes();
  const { marginUnits, wideHeadingColumnUnits, wideContentColumnStartUnits } =
    stylePack.layout;
  const isWide = sizes.layout === "wide";
  const heading =
    props.heading === undefined || props.heading === "" ? null : (
      <h2
        data-text-prop="heading"
        style={{
          ...displayTextStyle(stylePack),
          fontSize: sizes.text("heading"),
          lineHeight: 1.1,
          ...props.headingStyle,
        }}
      >
        {props.heading}
      </h2>
    );
  return (
    <FitBox
      {...centeredContentBox({ stylePack, sizes })}
      contentStyle={
        isWide
          ? {
              display: "flex",
              alignItems: "center",
              gap: sizes.pixels(
                wideContentColumnStartUnits -
                  marginUnits -
                  wideHeadingColumnUnits,
              ),
            }
          : {
              display: "flex",
              flexDirection: "column",
              gap: sizes.fitted(headingGapUnits),
            }
      }
    >
      {isWide ? (
        <div
          style={{ flex: "none", width: sizes.pixels(wideHeadingColumnUnits) }}
        >
          {heading}
        </div>
      ) : (
        heading
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          ...(isWide ? { flex: 1, minWidth: 0 } : {}),
          ...props.contentStyle,
        }}
      >
        {props.children}
      </div>
    </FitBox>
  );
}
