import type { JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { centeredContentBox } from "../../kit/captionArea.js";
import { FitBox } from "../../kit/FitBox.js";
import { useKitMotion } from "../../kit/motion.js";
import { MotionWords } from "../../kit/MotionWords.js";
import { useSizes } from "../../kit/sizes.js";
import { displayTextStyle } from "../../kit/textStyles.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";
import { readStepsProps } from "./readStepsProps.js";
import { StepView, type StepTiming } from "./StepView.js";

const firstCircleFrame = 8;
const stepEachFrames = 12;
const textDelayFrames = 3;
const lineDelayFrames = 5;
const lineFrames = 10;
const fillDelayFrames = 4;

export function Steps(props: { props: JsonObject }): ReactNode {
  const { heading, steps } = readStepsProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const hasHeading = heading !== undefined && heading !== "";
  const timingOf = (index: number): StepTiming => {
    const circle = motion.framesOf(
      (hasHeading ? firstCircleFrame : 2) + index * stepEachFrames,
    );
    return {
      circle,
      fill: circle + motion.framesOf(fillDelayFrames),
      text: circle + motion.framesOf(textDelayFrames),
      line: circle + motion.framesOf(lineDelayFrames),
      lineSeconds: motion.framesOf(lineFrames) / motion.framesPerSecond,
    };
  };
  const headingWordsAt = motion.wordsFrom({
    text: heading ?? "",
    startFrame: 0,
  });
  const motionFrame = motion.paced(
    Math.max(
      headingWordsAt(0).settleFrame,
      timingOf(steps.length - 1).text +
        motion.framesOf(stylePack.motion.riseFrames),
    ),
  );
  const isRow = sizes.layout === "wide";
  const gap = sizes.fitted(isRow ? 5 : 6);
  const contentDrift = motion.drift("scale");
  return (
    <FitBox
      {...centeredContentBox({
        stylePack,
        sizes,
        boxStyle: {
          transform: contentDrift.transform,
          transformOrigin: "left bottom",
        },
      })}
      contentStyle={{
        display: "flex",
        flexDirection: "column",
        gap: sizes.fitted(10),
      }}
    >
      {hasHeading ? (
        <h2
          data-text-prop="heading"
          style={{
            ...displayTextStyle(stylePack),
            fontSize: sizes.text("heading"),
            lineHeight: 1.08,
          }}
        >
          <MotionWords
            words={headingWordsAt(motionFrame).words}
            settledAs="text"
          />
        </h2>
      ) : null}
      <div
        style={
          isRow
            ? {
                display: "grid",
                gridTemplateColumns: `repeat(${String(steps.length)}, minmax(0, 1fr))`,
                columnGap: gap,
              }
            : { display: "flex", flexDirection: "column", rowGap: gap }
        }
      >
        {[...steps.entries()].map(([index, step]) => (
          <StepView
            key={`${String(index)}-${step}`}
            index={index}
            text={step}
            isLast={index === steps.length - 1}
            frame={motionFrame}
            timing={timingOf(index)}
            gap={gap}
          />
        ))}
      </div>
    </FitBox>
  );
}
