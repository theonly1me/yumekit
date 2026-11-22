import type { JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { sceneAccentOf } from "../../kit/accentColors.js";
import { FitBox } from "../../kit/FitBox.js";
import { useKitMotion } from "../../kit/motion.js";
import { useSizes } from "../../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../../kit/textStyles.js";
import { draw, enter } from "../../motion/index.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";
import { readLowerThirdProps } from "./readLowerThirdProps.js";

const barFrames = 10;
const panelStartFrame = 5;
const panelFrames = 16;
const nameStartFrame = 9;
const roleStartFrame = 14;
const gapAboveCaptionsUnits = 3;
const wideWidthUnits = 100;

export function LowerThird(props: { props: JsonObject }): ReactNode {
  const { name, role } = readLowerThirdProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const accent = sceneAccentOf(stylePack);
  const hasRole = role !== undefined && role !== "";
  const motionFrame = motion.paced(
    motion.framesOf(
      Math.max(
        panelStartFrame + panelFrames,
        (hasRole ? roleStartFrame : nameStartFrame) +
          stylePack.motion.riseFrames,
      ),
    ),
  );
  const barShare = draw({
    frame: motionFrame,
    framesPerSecond: motion.framesPerSecond,
    durationSeconds: motion.framesOf(barFrames) / motion.framesPerSecond,
  });
  const { marginUnits, captionAreaUnits } = stylePack.layout;
  const isWide = sizes.layout === "wide";
  const textEntry = (startFrame: number) =>
    motion.enterAt({
      frame: motionFrame,
      startFrame: motion.framesOf(startFrame),
      kind: "slide-right",
      distanceUnits: 5,
    });
  return (
    <FitBox
      style={{
        left: sizes.pixels(marginUnits),
        right: sizes.pixels(marginUnits),
        top: "45%",
        bottom: sizes.pixels(captionAreaUnits + gapAboveCaptionsUnits),
        justifyContent: "flex-end",
        alignItems: "flex-start",
        ...(isWide ? { maxWidth: sizes.pixels(wideWidthUnits) } : {}),
      }}
      contentStyle={{ display: "flex", alignItems: "stretch" }}
    >
      <span
        aria-hidden="true"
        style={{
          flex: "none",
          width: sizes.fitted(1.3),
          borderRadius: sizes.fitted(0.3),
          background: accent.mark,
          transformOrigin: "center bottom",
          transform: barShare >= 1 ? "none" : `scaleY(${String(barShare)})`,
        }}
      />
      <div
        style={{
          minWidth: 0,
          padding: `${sizes.fitted(2.4)} ${sizes.fitted(4)} ${sizes.fitted(2.6)} ${sizes.fitted(3.4)}`,
          borderRadius: `0 ${sizes.fitted(1.2)} ${sizes.fitted(1.2)} 0`,
          background: stylePack.colors.captionPanel,
          color: stylePack.colors.captionText,
          overflow: "hidden",
          ...enter({
            kind: "wipe",
            frame: motionFrame,
            startFrame: motion.framesOf(panelStartFrame),
            framesPerSecond: motion.framesPerSecond,
            durationSeconds:
              motion.framesOf(panelFrames) / motion.framesPerSecond,
          }),
        }}
      >
        <p
          data-text-prop="name"
          style={{
            ...displayTextStyle(stylePack),
            fontSize: sizes.text("item"),
            lineHeight: 1.1,
            ...textEntry(nameStartFrame),
          }}
        >
          {name}
        </p>
        {hasRole ? (
          <p
            data-text-prop="role"
            style={{
              ...bodyTextStyle(stylePack),
              marginTop: sizes.fitted(0.9),
              fontSize: sizes.text("label"),
              lineHeight: 1.25,
              ...textEntry(roleStartFrame),
            }}
          >
            {role}
          </p>
        ) : null}
      </div>
    </FitBox>
  );
}
