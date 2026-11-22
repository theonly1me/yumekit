import type { JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { centeredContentBox } from "../kit/captionArea.js";
import { FitBox } from "../kit/FitBox.js";
import { useKitMotion } from "../kit/motion.js";
import { MotionWords } from "../kit/MotionWords.js";
import { useSizes } from "../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../kit/textStyles.js";
import { readQuoteProps } from "../props/readProps.js";
import { draw, words } from "../motion/index.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";

const firstWordStartFrame = 4;
const wordStaggerShare = 1.6;
const ruleDelayFrames = 4;
const ruleGrowFrames = 22;
const quoteRiseUnits = 3;
const ruleUnits = 34;

export function Quote(props: { props: JsonObject }): ReactNode {
  const { quote, source } = readQuoteProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const quoteWordsAt = (frame: number) =>
    words({
      text: quote,
      frame,
      framesPerSecond: motion.framesPerSecond,
      startFrame: motion.framesOf(firstWordStartFrame),
      eachSeconds: motion.wordStaggerSeconds * wordStaggerShare,
      wordSeconds: motion.itemSeconds,
      unit: motion.unit,
      distanceUnits: quoteRiseUnits,
    });
  const ruleStartFrame =
    quoteWordsAt(0).settleFrame -
    motion.framesOf(stylePack.motion.riseFrames - ruleDelayFrames);
  const sourceStartFrame = ruleStartFrame + motion.framesOf(ruleGrowFrames / 2);
  const motionFrame = motion.paced(
    Math.max(
      ruleStartFrame + motion.framesOf(ruleGrowFrames),
      sourceStartFrame + motion.framesOf(stylePack.motion.riseFrames),
    ),
  );
  const ruleShare = draw({
    frame: motionFrame,
    framesPerSecond: motion.framesPerSecond,
    startFrame: ruleStartFrame,
    durationSeconds: motion.framesOf(ruleGrowFrames) / motion.framesPerSecond,
  });
  const contentDrift = motion.drift("scale");
  return (
    <FitBox
      {...centeredContentBox({
        stylePack,
        sizes,
        wideWidthUnits: stylePack.layout.wideQuoteUnits,
        boxStyle: {
          transform: contentDrift.transform,
          transformOrigin: "center bottom",
        },
      })}
      contentStyle={{
        display: "flex",
        flexDirection: "column",
        gap: sizes.fitted(4),
      }}
    >
      <p
        data-text-prop="quote"
        style={{
          ...displayTextStyle(stylePack),
          fontSize: sizes.text("quote"),
          lineHeight: 1.08,
        }}
      >
        <MotionWords
          words={quoteWordsAt(motionFrame).words}
          settledAs="word-spans"
        />
      </p>
      <div
        aria-hidden="true"
        style={{
          height: sizes.fitted(1.4),
          width: sizes.fitted(ruleShare * ruleUnits),
          borderRadius: sizes.fitted(1),
          background: stylePack.colors.accent,
        }}
      />
      {source === undefined || source === "" ? null : (
        <p
          data-text-prop="source"
          style={{
            ...bodyTextStyle(stylePack),
            color: stylePack.colors.mutedText,
            fontSize: sizes.text("label"),
            lineHeight: 1.3,
            ...motion.enterAt({
              frame: motionFrame,
              startFrame: sourceStartFrame,
            }),
          }}
        >
          {source}
        </p>
      )}
    </FitBox>
  );
}
