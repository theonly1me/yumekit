import type { CSSProperties, ReactNode } from "react";
import { MediaFill } from "../../kit/MediaFill.js";
import { useSizes } from "../../kit/sizes.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";

export type DeviceKind = "browser" | "phone";

export const browserScreenRatio = 16 / 10;
export const browserBarUnits = 4.2;
export const phoneRatio = 9 / 19.5;
const phoneBezelUnits = 1.3;

function Glare(props: { share: number }): ReactNode {
  const position = -40 + 180 * props.share;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(115deg, transparent ${String(position - 18)}%, rgb(255 255 255 / 0.16) ${String(position)}%, transparent ${String(position + 18)}%)`,
      }}
    />
  );
}

export function DeviceShell(props: {
  kind: DeviceKind;
  assetId: string;
  widthUnits: number;
  glareShare: number;
  style: CSSProperties;
}): ReactNode {
  const stylePack = useStylePack();
  const sizes = useSizes();
  const shadow = `0 ${sizes.fitted(3)} ${sizes.fitted(10)} rgb(0 0 0 / 0.35)`;
  const screen = (
    <MediaFill assetId={props.assetId} kinds={["image", "video"]} />
  );
  if (props.kind === "phone") {
    const width = sizes.fitted(props.widthUnits);
    return (
      <div
        aria-hidden="true"
        style={{
          position: "relative",
          display: "flex",
          width,
          aspectRatio: String(phoneRatio),
          padding: sizes.fitted(phoneBezelUnits),
          borderRadius: sizes.fitted(props.widthUnits * 0.16),
          background: "#0c0d10",
          boxShadow: `${shadow}, inset 0 0 0 ${sizes.fitted(0.3)} rgb(255 255 255 / 0.14)`,
          ...props.style,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flex: 1,
            overflow: "hidden",
            borderRadius: sizes.fitted(
              props.widthUnits * 0.16 - phoneBezelUnits,
            ),
          }}
        >
          {screen}
          <div
            style={{
              position: "absolute",
              top: sizes.fitted(1.6),
              left: "50%",
              width: "30%",
              height: sizes.fitted(props.widthUnits * 0.06),
              transform: "translateX(-50%)",
              borderRadius: sizes.fitted(3),
              background: "#0c0d10",
            }}
          />
          <Glare share={props.glareShare} />
        </div>
      </div>
    );
  }
  const dot = (color: string) => (
    <span
      key={color}
      style={{
        width: sizes.fitted(1.3),
        height: sizes.fitted(1.3),
        borderRadius: "50%",
        background: color,
      }}
    />
  );
  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: sizes.fitted(props.widthUnits),
        overflow: "hidden",
        borderRadius: sizes.fitted(1.8),
        background: stylePack.colors.surface,
        boxShadow: `${shadow}, inset 0 0 0 ${sizes.fitted(0.2)} rgb(127 127 127 / 0.25)`,
        ...props.style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: sizes.fitted(0.9),
          height: sizes.fitted(browserBarUnits),
          padding: `0 ${sizes.fitted(1.8)}`,
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map(dot)}
        <span
          style={{
            marginLeft: sizes.fitted(3),
            flex: "0 1 40%",
            height: sizes.fitted(1.9),
            borderRadius: sizes.fitted(1),
            background: "rgb(127 127 127 / 0.22)",
          }}
        />
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          aspectRatio: String(browserScreenRatio),
        }}
      >
        {screen}
        <Glare share={props.glareShare} />
      </div>
    </div>
  );
}
