import type { ReactNode } from "react";
import { sceneAccentOf } from "../../kit/accentColors.js";
import { MediaFill, useHasMedia } from "../../kit/MediaFill.js";
import { useSizes } from "../../kit/sizes.js";
import { displayTextStyle } from "../../kit/textStyles.js";
import type { MotionStyle } from "../../motion/index.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";

const ringStrokeShare = 0.035;
const visibleShare = 0.02;

export function LogoMark(props: {
  name: string;
  assetId: string;
  sizeUnits: number;
  ringShare: number;
  burstShare: number;
  markStyle: MotionStyle;
}): ReactNode {
  const stylePack = useStylePack();
  const sizes = useSizes();
  const accent = sceneAccentOf(stylePack);
  const hasLogo = useHasMedia({ assetId: props.assetId, kinds: ["image"] });
  const size = sizes.fitted(props.sizeUnits);
  const letter = Array.from(props.name.trim())[0] ?? "";
  return (
    <div
      aria-hidden="true"
      style={{ position: "relative", flex: "none", width: size, height: size }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `${sizes.fitted(props.sizeUnits * ringStrokeShare)} solid ${accent.mark}`,
          opacity:
            props.burstShare > 0 && props.burstShare < 1
              ? 0.6 * (1 - props.burstShare)
              : 0,
          transform: `scale(${String(1 + 0.45 * props.burstShare)})`,
        }}
      />
      <svg
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          opacity: props.ringShare > visibleShare ? 1 : 0,
        }}
      >
        <circle
          cx={50}
          cy={50}
          r={50 - ringStrokeShare * 50}
          pathLength={1}
          fill="none"
          stroke={accent.mark}
          strokeWidth={ringStrokeShare * 100}
          strokeLinecap="round"
          strokeDasharray="1 1"
          strokeDashoffset={1 - props.ringShare}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: "16%",
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          overflow: "hidden",
          background: hasLogo ? "transparent" : stylePack.colors.surface,
          ...props.markStyle,
        }}
      >
        {hasLogo ? (
          <MediaFill
            assetId={props.assetId}
            kinds={["image"]}
            fit="contain"
            style={{ background: "transparent" }}
          />
        ) : (
          <span
            style={{
              ...displayTextStyle(stylePack),
              fontSize: sizes.fitted(props.sizeUnits * 0.4),
              lineHeight: 1,
              color: accent.text,
            }}
          >
            {letter}
          </span>
        )}
      </div>
    </div>
  );
}
