import type { JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { sceneAccentOf } from "../../kit/accentColors.js";
import {
  centeredContentBox,
  contentBottomUnits,
} from "../../kit/captionArea.js";
import { FitBox } from "../../kit/FitBox.js";
import { Kicker, kickerSettleFrame } from "../../kit/Kicker.js";
import { useKitMotion } from "../../kit/motion.js";
import { useSizes } from "../../kit/sizes.js";
import { displayTextStyle } from "../../kit/textStyles.js";
import { draw, pulse } from "../../motion/index.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";
import { accentRangeOf } from "./accentRange.js";
import { HeroHeading } from "./HeroHeading.js";
import { readHeroProps } from "./readHeroProps.js";

export const heroTitleScale = 1.2;
const kickerStartFrame = 0;
const headingStartFrame = 7;
const wordStaggerFrames = 4;
const underlineLeadFrames = 6;
const underlineFrames = 16;
const pulseFrames = 12;
const wideHeadingUnits = 140;
const kickerSpaceUnits = { tall: 20, square: 14 } as const;

export function Hero(props: { props: JsonObject }): ReactNode {
  const { heading, accentWord, kicker } = readHeroProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const accent = sceneAccentOf(stylePack);
  const hasKicker = kicker !== undefined && kicker !== "";
  const headingWordsAt = motion.wordsFrom({
    text: heading,
    startFrame: motion.framesOf(hasKicker ? headingStartFrame : 2),
    eachSeconds: motion.framesOf(wordStaggerFrames) / motion.framesPerSecond,
  });
  const underlineStart =
    headingWordsAt(0).settleFrame - motion.framesOf(underlineLeadFrames);
  const underlineEnd = underlineStart + motion.framesOf(underlineFrames);
  const motionFrame = motion.paced(
    Math.max(
      underlineEnd + motion.framesOf(pulseFrames),
      kickerSettleFrame({
        startFrame: kickerStartFrame,
        framesPerSecond: motion.framesPerSecond,
        itemSeconds: motion.itemSeconds,
      }),
    ),
  );
  const headingWords = headingWordsAt(motionFrame).words;
  const accentRange = accentRangeOf({
    words: headingWords.map((word) => word.text),
    accentWord,
  });
  const underlineShare = draw({
    frame: motionFrame,
    framesPerSecond: motion.framesPerSecond,
    startFrame: underlineStart,
    durationSeconds: motion.framesOf(underlineFrames) / motion.framesPerSecond,
  });
  const landing = pulse({
    frame: motionFrame,
    framesPerSecond: motion.framesPerSecond,
    atFrame: underlineEnd - motion.framesOf(4),
    amount: 0.05,
  });
  const contentDrift = motion.drift("scale");
  const isWide = sizes.layout === "wide";
  const kickerView = hasKicker ? (
    <Kicker
      text={kicker}
      textProp="kicker"
      frame={motionFrame}
      startFrame={motion.framesOf(kickerStartFrame)}
      style={isWide ? { marginBottom: sizes.fitted(4) } : {}}
    />
  ) : null;
  const headingView = (
    <h1
      data-text-prop="heading"
      style={{
        ...displayTextStyle(stylePack),
        fontSize: sizes.fitted(sizes.textUnits("title") * heroTitleScale),
        lineHeight: 1.02,
      }}
    >
      <HeroHeading
        words={headingWords}
        accent={accentRange}
        accentStyle={{
          color: accent.text,
          display: "inline-block",
          maxWidth: "100%",
          transform: landing === 1 ? "none" : `scale(${String(landing)})`,
          backgroundImage: `linear-gradient(${accent.mark}, ${accent.mark})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0 96%",
          backgroundSize: `${String(underlineShare * 100)}% 0.09em`,
          paddingBottom: "0.06em",
        }}
      />
    </h1>
  );
  const box = centeredContentBox({
    stylePack,
    sizes,
    wideWidthUnits: wideHeadingUnits,
    boxStyle: {
      transform: contentDrift.transform,
      transformOrigin: "left bottom",
    },
  });
  if (isWide) {
    return (
      <FitBox {...box}>
        {kickerView}
        {headingView}
      </FitBox>
    );
  }
  const margin = stylePack.layout.marginUnits;
  const kickerSpace =
    kickerSpaceUnits[sizes.layout === "tall" ? "tall" : "square"];
  return (
    <>
      {kickerView === null ? null : (
        <FitBox
          style={{
            left: sizes.pixels(margin),
            right: sizes.pixels(margin),
            top: sizes.pixels(margin + 2),
            height: sizes.pixels(kickerSpace - 4),
          }}
        >
          {kickerView}
        </FitBox>
      )}
      <FitBox
        style={{
          ...box.style,
          top: sizes.pixels(margin + kickerSpace),
          bottom: sizes.pixels(contentBottomUnits(stylePack)),
          justifyContent: "center",
        }}
      >
        {headingView}
      </FitBox>
    </>
  );
}
