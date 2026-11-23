import type { JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { centeredContentBox } from "../../kit/captionArea.js";
import { FitBox } from "../../kit/FitBox.js";
import { useKitMotion } from "../../kit/motion.js";
import { useSizes } from "../../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../../kit/textStyles.js";
import { draw, enter } from "../../motion/index.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";
import { LogoMark } from "./LogoMark.js";
import { readLogoRevealProps } from "./readLogoRevealProps.js";

const ringFrames = 20;
const markStartFrame = 10;
const burstFrames = 16;
const nameStartFrame = 18;
const nameFrames = 18;
const taglineStartFrame = 30;

export function LogoReveal(props: { props: JsonObject }): ReactNode {
  const { name, assetId, tagline } = readLogoRevealProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const hasTagline = tagline !== undefined && tagline !== "";
  const motionFrame = motion.paced(
    motion.framesOf(
      Math.max(
        nameStartFrame + nameFrames,
        markStartFrame + burstFrames + 4,
        hasTagline ? taglineStartFrame + stylePack.motion.riseFrames : 0,
      ),
    ),
  );
  const ringShare = draw({
    frame: motionFrame,
    framesPerSecond: motion.framesPerSecond,
    durationSeconds: motion.framesOf(ringFrames) / motion.framesPerSecond,
  });
  const burstStart = motion.framesOf(markStartFrame + 4);
  const burstShare = Math.min(
    1,
    Math.max(0, (motionFrame - burstStart) / motion.framesOf(burstFrames)),
  );
  const isWide = sizes.layout === "wide";
  const nameDrift = motion.drift("scale");
  return (
    <FitBox
      {...centeredContentBox({
        stylePack,
        sizes,
        boxStyle: {
          transform: nameDrift.transform,
          transformOrigin: "center bottom",
        },
      })}
      contentStyle={{
        display: "flex",
        flexDirection: isWide ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        gap: sizes.fitted(isWide ? 7 : 6),
      }}
    >
      <LogoMark
        name={name}
        assetId={assetId ?? ""}
        sizeUnits={isWide ? 34 : 40}
        ringShare={ringShare}
        burstShare={burstShare}
        markStyle={enter({
          kind: "pop",
          frame: motionFrame,
          startFrame: motion.framesOf(markStartFrame),
          framesPerSecond: motion.framesPerSecond,
          durationSeconds: motion.itemSeconds,
        })}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isWide ? "flex-start" : "center",
          minWidth: 0,
          gap: sizes.fitted(2.5),
          textAlign: isWide ? "left" : "center",
        }}
      >
        <h1
          data-text-prop="name"
          style={{
            ...displayTextStyle(stylePack),
            fontSize: sizes.fitted(sizes.textUnits("title") * 1.15),
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
            ...enter({
              kind: "wipe",
              frame: motionFrame,
              startFrame: motion.framesOf(nameStartFrame),
              framesPerSecond: motion.framesPerSecond,
              durationSeconds:
                motion.framesOf(nameFrames) / motion.framesPerSecond,
            }),
          }}
        >
          {name}
        </h1>
        {hasTagline ? (
          <p
            data-text-prop="tagline"
            style={{
              ...bodyTextStyle(stylePack),
              fontSize: sizes.fitted(sizes.textUnits("item") * 0.8),
              lineHeight: 1.3,
              color: stylePack.colors.mutedText,
              ...motion.enterAt({
                frame: motionFrame,
                startFrame: motion.framesOf(taglineStartFrame),
              }),
            }}
          >
            {tagline}
          </p>
        ) : null}
      </div>
    </FitBox>
  );
}
