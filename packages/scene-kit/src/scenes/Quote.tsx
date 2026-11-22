import { stagger, tween, type JsonObject } from "@yumekit/scene";
import { Fragment, type ReactNode } from "react";
import { centeredContentBox } from "../kit/captionArea.js";
import { FitBox } from "../kit/FitBox.js";
import { riseStyle, useMotionFrame } from "../kit/motion.js";
import { useSizes } from "../kit/sizes.js";
import { bodyTextStyle, displayTextStyle } from "../kit/textStyles.js";
import { readQuoteProps } from "../props/readProps.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";

const firstWordStartFrame = 6;
const wordFadeFrames = 10;
const ghostOpacity = 0.12;
const ruleGrowFrames = 30;
const ruleUnits = 34;

export function Quote(props: { props: JsonObject }): ReactNode {
  const { quote, source } = readQuoteProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const words = quote.split(/\s+/).filter((word) => word !== "");
  const eachFrames = stylePack.motion.wordStaggerFrames;
  const wordStart = (index: number) =>
    stagger({ index, startFrame: firstWordStartFrame, eachFrames });
  const ruleStartFrame = wordStart(words.length) + wordFadeFrames;
  const sourceStartFrame = ruleStartFrame + ruleGrowFrames / 2;
  const motionFrame = useMotionFrame({
    settleFrame: sourceStartFrame + stylePack.motion.riseFrames,
  });
  const ruleWidth = tween({
    frame: motionFrame,
    startFrame: ruleStartFrame,
    endFrame: ruleStartFrame + ruleGrowFrames,
    from: 0,
    to: ruleUnits,
  });
  return (
    <FitBox
      {...centeredContentBox({
        stylePack,
        sizes,
        wideWidthUnits: stylePack.layout.wideQuoteUnits,
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
        {[...words.entries()].map(([index, word]) => (
          <Fragment key={`${String(index)}-${word}`}>
            {index === 0 ? null : " "}
            <span
              style={{
                opacity: tween({
                  frame: motionFrame,
                  startFrame: wordStart(index),
                  endFrame: wordStart(index) + wordFadeFrames,
                  from: ghostOpacity,
                  to: 1,
                }),
              }}
            >
              {word}
            </span>
          </Fragment>
        ))}
      </p>
      <div
        aria-hidden="true"
        style={{
          height: sizes.fitted(1.4),
          width: sizes.fitted(ruleWidth),
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
            ...riseStyle({
              motionFrame,
              startFrame: sourceStartFrame,
              stylePack,
              unit: sizes.unit,
            }),
          }}
        >
          {source}
        </p>
      )}
    </FitBox>
  );
}
