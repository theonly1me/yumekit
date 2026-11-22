import { tween, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { centeredContentBox } from "../../kit/captionArea.js";
import { FitBox } from "../../kit/FitBox.js";
import { useKitMotion } from "../../kit/motion.js";
import { MotionWords } from "../../kit/MotionWords.js";
import { useSizes } from "../../kit/sizes.js";
import { displayTextStyle } from "../../kit/textStyles.js";
import { entryCurve } from "../../motion/curves.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";
import { DeviceShell, type DeviceKind } from "./DeviceShell.js";
import { readDeviceProps } from "./readDeviceProps.js";

const deviceStartFrame = 2;
const deviceFrames = 32;
const captionStartFrame = 12;
const wideCaptionUnits = 60;

const deviceWidthUnits: Record<
  "wide" | "tall",
  Record<"caption" | "alone", Record<DeviceKind, number>>
> = {
  wide: {
    caption: { browser: 94, phone: 31 },
    alone: { browser: 100, phone: 31 },
  },
  tall: {
    caption: { browser: 84, phone: 50 },
    alone: { browser: 84, phone: 60 },
  },
};

export function Device(props: { props: JsonObject }): ReactNode {
  const { assetId, frame, caption } = readDeviceProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const isWide = sizes.layout === "wide";
  const kind: DeviceKind =
    frame ?? (sizes.layout === "tall" ? "phone" : "browser");
  const hasCaption = caption !== undefined && caption !== "";
  const captionWordsAt = motion.wordsFrom({
    text: caption ?? "",
    startFrame: motion.framesOf(captionStartFrame),
  });
  const deviceStart = motion.framesOf(deviceStartFrame);
  const deviceEnd = deviceStart + motion.framesOf(deviceFrames);
  const motionFrame = motion.paced(
    Math.max(deviceEnd, captionWordsAt(0).settleFrame),
  );
  const settle = tween({
    frame: motionFrame,
    startFrame: deviceStart,
    endFrame: deviceEnd,
    from: 0,
    to: 1,
    easing: entryCurve,
  });
  const opacity = tween({
    frame: motionFrame,
    startFrame: deviceStart,
    endFrame: deviceStart + motion.framesOf(10),
    from: 0,
    to: 1,
  });
  const remaining = 1 - settle;
  const turnDegrees = isWide && hasCaption ? -16 : 0;
  const lift = sizes.fitted(14 * remaining);
  const deviceDrift = motion.drift("scale");
  const widthUnits =
    deviceWidthUnits[isWide ? "wide" : "tall"][
      hasCaption ? "caption" : "alone"
    ][kind] * (isWide || sizes.layout === "tall" ? 1 : 0.8);
  return (
    <FitBox
      {...centeredContentBox({ stylePack, sizes })}
      contentStyle={{
        display: "flex",
        flexDirection: isWide ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        gap: sizes.fitted(isWide ? 7 : 6),
        perspective: sizes.fitted(220),
      }}
    >
      {hasCaption ? (
        <p
          data-text-prop="caption"
          style={{
            ...displayTextStyle(stylePack),
            flex: isWide ? `0 1 ${sizes.fitted(wideCaptionUnits)}` : "none",
            fontSize: sizes.fitted(
              sizes.textUnits("heading") * (isWide ? 0.9 : 0.8),
            ),
            lineHeight: 1.08,
            textAlign: isWide ? "left" : "center",
          }}
        >
          <MotionWords
            words={captionWordsAt(motionFrame).words}
            settledAs="text"
          />
        </p>
      ) : null}
      <div style={{ flex: "none", transform: deviceDrift.transform }}>
        <DeviceShell
          kind={kind}
          assetId={assetId}
          widthUnits={widthUnits}
          glareShare={settle}
          style={{
            opacity,
            transformOrigin: "center 80%",
            transform:
              remaining <= 0
                ? "none"
                : `translateY(${lift}) rotateX(${String(26 * remaining)}deg) rotateY(${String(turnDegrees * remaining)}deg) scale(${String(0.9 + 0.1 * settle)})`,
          }}
        />
      </div>
    </FitBox>
  );
}
