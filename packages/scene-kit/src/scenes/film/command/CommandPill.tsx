import type { ReactNode } from "react";
import type { Sizes } from "../../../kit/sizes.js";
import type { MotionStyle } from "../../../motion/index.js";
import { useStylePack } from "../../../stylePacks/StylePackContext.js";

export const monospaceFamilies =
  'ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace';

export function CommandPill(props: {
  command: string;
  shown: string;
  cursorVisible: boolean;
  motion: MotionStyle;
  sizes: Sizes;
}): ReactNode {
  const stylePack = useStylePack();
  const { sizes } = props;
  const edge = `color-mix(in srgb, ${stylePack.colors.text} 14%, transparent)`;
  return (
    <div
      style={{
        ...props.motion,
        display: "flex",
        alignItems: "center",
        gap: sizes.fitted(2),
        padding: `${sizes.fitted(2.2)} ${sizes.fitted(3.6)}`,
        borderRadius: sizes.fitted(Math.max(0.6, stylePack.cornerUnits)),
        background: stylePack.colors.surface,
        boxShadow: `0 0 0 1px ${edge}`,
        fontFamily: monospaceFamilies,
        fontSize: sizes.text("filmCommand"),
        lineHeight: 1.2,
        whiteSpace: "pre",
        color: stylePack.colors.text,
      }}
    >
      <span style={{ color: stylePack.colors.mutedText }}>$</span>
      <span style={{ position: "relative" }}>
        <span style={{ visibility: "hidden" }}>{props.command}</span>
        <span
          data-text-prop="command"
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {props.shown}
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: "0.55em",
              height: "1.1em",
              verticalAlign: "-0.2em",
              background: stylePack.colors.text,
              opacity: props.cursorVisible ? 0.85 : 0,
            }}
          />
        </span>
      </span>
    </div>
  );
}
