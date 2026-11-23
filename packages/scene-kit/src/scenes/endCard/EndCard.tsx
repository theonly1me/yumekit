import type { JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { sceneAccentOf, textOnAccent } from "../../kit/accentColors.js";
import { centeredContentBox } from "../../kit/captionArea.js";
import { FitBox } from "../../kit/FitBox.js";
import { useKitMotion } from "../../kit/motion.js";
import { MotionWords } from "../../kit/MotionWords.js";
import { useSizes } from "../../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../../kit/textStyles.js";
import { enter, pulse } from "../../motion/index.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";
import { readEndCardProps } from "./readEndCardProps.js";

const buttonDelayFrames = 4;
const sheenDelayFrames = 10;
const sheenFrames = 18;
const handleDelayFrames = 8;
const wideHeadingUnits = 140;

export function EndCard(props: { props: JsonObject }): ReactNode {
  const { heading, action, handle } = readEndCardProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const accent = sceneAccentOf(stylePack);
  const headingWordsAt = motion.wordsFrom({ text: heading, startFrame: 0 });
  const buttonStart =
    headingWordsAt(0).settleFrame - motion.framesOf(10 - buttonDelayFrames);
  const sheenStart = buttonStart + motion.framesOf(sheenDelayFrames);
  const handleStart = buttonStart + motion.framesOf(handleDelayFrames);
  const motionFrame = motion.paced(
    Math.max(
      sheenStart + motion.framesOf(sheenFrames),
      handleStart + motion.framesOf(stylePack.motion.riseFrames),
    ),
  );
  const sheenShare = Math.min(
    1,
    Math.max(0, (motionFrame - sheenStart) / motion.framesOf(sheenFrames)),
  );
  const press = pulse({
    frame: motionFrame,
    framesPerSecond: motion.framesPerSecond,
    atFrame: sheenStart,
    amount: -0.05,
  });
  const isWide = sizes.layout === "wide";
  const hasAction = action !== undefined && action !== "";
  const hasHandle = handle !== undefined && handle !== "";
  const sheenPosition = -30 + 160 * sheenShare;
  const buttonEntry = enter({
    kind: "pop",
    frame: motionFrame,
    startFrame: buttonStart,
    framesPerSecond: motion.framesPerSecond,
    durationSeconds: motion.itemSeconds,
  });
  const contentDrift = motion.drift("scale");
  return (
    <FitBox
      {...centeredContentBox({
        stylePack,
        sizes,
        boxStyle: {
          transform: contentDrift.transform,
          transformOrigin: "center bottom",
          alignItems: "center",
        },
      })}
      contentStyle={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: sizes.fitted(isWide ? 7 : 9),
        ...(isWide ? { maxWidth: sizes.pixels(wideHeadingUnits) } : {}),
      }}
    >
      <h1
        data-text-prop="heading"
        style={{
          ...displayTextStyle(stylePack),
          fontSize: sizes.fitted(sizes.textUnits("title") * 1.1),
          lineHeight: 1.02,
        }}
      >
        <MotionWords
          words={headingWordsAt(motionFrame).words}
          settledAs="text"
        />
      </h1>
      {hasAction || hasHandle ? (
        <div
          style={{
            display: "flex",
            flexDirection: isWide ? "row" : "column",
            alignItems: "center",
            gap: sizes.fitted(isWide ? 6 : 5),
            maxWidth: "100%",
          }}
        >
          {hasAction ? (
            <p
              data-text-prop="action"
              style={{
                ...displayTextStyle(stylePack),
                fontSize: sizes.fitted(sizes.textUnits("item") * 0.9),
                lineHeight: 1.1,
                padding: `${sizes.fitted(3)} ${sizes.fitted(7)}`,
                minWidth: isWide ? undefined : sizes.fitted(56),
                borderRadius: sizes.fitted(20),
                color: textOnAccent({ stylePack, accent: accent.mark }),
                backgroundColor: accent.mark,
                backgroundImage:
                  sheenShare > 0 && sheenShare < 1
                    ? `linear-gradient(105deg, transparent ${String(sheenPosition - 14)}%, rgb(255 255 255 / 0.45) ${String(sheenPosition)}%, transparent ${String(sheenPosition + 14)}%)`
                    : "none",
                boxShadow: `0 ${sizes.fitted(1.5)} ${sizes.fitted(6)} color-mix(in srgb, ${accent.mark} 40%, transparent)`,
                ...buttonEntry,
                transform:
                  press !== 1
                    ? `scale(${String(press)})`
                    : buttonEntry.transform,
              }}
            >
              {action}
            </p>
          ) : null}
          {hasHandle ? (
            <p
              data-text-prop="handle"
              style={{
                ...bodyTextStyle(stylePack),
                fontSize: sizes.fitted(sizes.textUnits("label") * 1.15),
                lineHeight: 1.2,
                color: stylePack.colors.mutedText,
                ...motion.enterAt({
                  frame: motionFrame,
                  startFrame: handleStart,
                }),
              }}
            >
              {handle}
            </p>
          ) : null}
        </div>
      ) : null}
    </FitBox>
  );
}
