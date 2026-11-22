import type { JsonObject } from "@yumekit/scene";
import type { CSSProperties, ReactNode } from "react";
import { sceneAccentOf, textOnAccent } from "../../kit/accentColors.js";
import { centeredContentBox } from "../../kit/captionArea.js";
import { FitBox } from "../../kit/FitBox.js";
import { useKitMotion } from "../../kit/motion.js";
import { MotionWords } from "../../kit/MotionWords.js";
import { useSizes } from "../../kit/sizes.js";
import { bodyTextStyle } from "../../kit/textStyles.js";
import { enter, pulse } from "../../motion/index.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";
import { chatTimingOf } from "./chatTiming.js";
import { readChatProps } from "./readChatProps.js";
import { TypedText } from "./TypedText.js";
import { TypingDots } from "./TypingDots.js";

const wideColumnUnits = 144;

export function Chat(props: { props: JsonObject }): ReactNode {
  const { request, answer, requestName, answerName } = readChatProps(
    props.props,
  );
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const accent = sceneAccentOf(stylePack);
  const timing = chatTimingOf({ motion, request, answer });
  const answerWordsAt = motion.wordsFrom({
    text: answer,
    startFrame: timing.answerWords,
    eachSeconds: timing.wordEachSeconds,
  });
  const motionFrame = motion.paced(answerWordsAt(0).settleFrame);
  const isWide = sizes.layout === "wide";
  const textUnits = sizes.textUnits("item") * (isWide ? 0.9 : 0.95);
  const radius = sizes.fitted(textUnits * 1.1);
  const tail = sizes.fitted(textUnits * 0.25);
  const sentPulse = pulse({
    frame: motionFrame,
    framesPerSecond: motion.framesPerSecond,
    atFrame: timing.sent,
    amount: 0.04,
  });
  const dotsOpacity =
    motionFrame < timing.answerWords
      ? 1
      : Math.max(
          0,
          1 - (motionFrame - timing.answerWords) / motion.framesOf(4),
        );
  const bubbleStyle = (options: {
    isRequest: boolean;
    startFrame: number;
  }): CSSProperties => ({
    ...bodyTextStyle(stylePack),
    position: "relative",
    boxSizing: "border-box",
    fontSize: sizes.fitted(textUnits),
    lineHeight: 1.3,
    padding: `${sizes.fitted(textUnits * 0.62)} ${sizes.fitted(textUnits * 0.9)}`,
    maxWidth: isWide ? "78%" : "88%",
    borderRadius: options.isRequest
      ? `${radius} ${radius} ${tail} ${radius}`
      : `${radius} ${radius} ${radius} ${tail}`,
    background: options.isRequest ? accent.mark : stylePack.colors.surface,
    color: options.isRequest
      ? textOnAccent({ stylePack, accent: accent.mark })
      : stylePack.colors.text,
    transformOrigin: options.isRequest ? "right bottom" : "left bottom",
    ...enter({
      kind: "pop",
      frame: motionFrame,
      startFrame: options.startFrame,
      framesPerSecond: motion.framesPerSecond,
      durationSeconds: motion.itemSeconds,
    }),
  });
  const nameOf = (options: {
    name: string | undefined;
    textProp: string;
    startFrame: number;
    isRequest: boolean;
  }) =>
    options.name === undefined || options.name === "" ? null : (
      <p
        data-text-prop={options.textProp}
        style={{
          ...bodyTextStyle(stylePack),
          fontSize: sizes.fitted(sizes.textUnits("label") * 0.85),
          color: stylePack.colors.mutedText,
          margin: `0 ${sizes.fitted(1.5)} ${sizes.fitted(1.4)}`,
          alignSelf: options.isRequest ? "flex-end" : "flex-start",
          ...motion.enterAt({
            frame: motionFrame,
            startFrame: options.startFrame,
            kind: "fade",
          }),
        }}
      >
        {options.name}
      </p>
    );
  const requestStyle = bubbleStyle({
    isRequest: true,
    startFrame: timing.requestBubble,
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
          ...(isWide
            ? {
                left: `calc(50% - ${sizes.pixels(wideColumnUnits / 2)})`,
                right: `calc(50% - ${sizes.pixels(wideColumnUnits / 2)})`,
              }
            : {}),
        },
      })}
      contentStyle={{ display: "flex", flexDirection: "column" }}
    >
      {nameOf({
        name: requestName,
        textProp: "names.request",
        startFrame: timing.requestBubble,
        isRequest: true,
      })}
      <TypedText
        text={request}
        textProp="request"
        frame={motionFrame}
        framesPerSecond={motion.framesPerSecond}
        startFrame={timing.typingStart}
        charactersPerSecond={timing.charactersPerSecond}
        showCursor={motionFrame < timing.sent}
        cursorColor={textOnAccent({ stylePack, accent: accent.mark })}
        wrapperStyle={{
          alignSelf: "flex-end",
          maxWidth: requestStyle.maxWidth,
        }}
        bubbleStyle={{
          ...requestStyle,
          maxWidth: "100%",
          transform:
            sentPulse === 1
              ? requestStyle.transform
              : `scale(${String(sentPulse)})`,
        }}
      />
      <div style={{ height: sizes.fitted(isWide ? 4 : 5) }} />
      {nameOf({
        name: answerName,
        textProp: "names.answer",
        startFrame: timing.answerBubble,
        isRequest: false,
      })}
      <p
        data-text-prop="answer"
        style={{
          ...bubbleStyle({ isRequest: false, startFrame: timing.answerBubble }),
          alignSelf: "flex-start",
        }}
      >
        {dotsOpacity > 0 ? (
          <span
            style={{
              position: "absolute",
              left: sizes.fitted(textUnits * 0.9),
              top: sizes.fitted(textUnits * 0.62),
              height: "1.3em",
            }}
          >
            <TypingDots
              frame={motionFrame}
              framesPerSecond={motion.framesPerSecond}
              color={stylePack.colors.mutedText}
              sizePixels={sizes.fitted(textUnits * 0.32)}
              opacity={dotsOpacity}
            />
          </span>
        ) : null}
        <MotionWords
          words={answerWordsAt(motionFrame).words}
          settledAs="text"
        />
      </p>
    </FitBox>
  );
}
