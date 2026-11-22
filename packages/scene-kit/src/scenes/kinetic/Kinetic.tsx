import {
  useFrame,
  useSceneContext,
  tween,
  type JsonObject,
} from "@yumekit/scene";
import type { ReactNode } from "react";
import { sceneAccentOf } from "../../kit/accentColors.js";
import { centeredContentBox } from "../../kit/captionArea.js";
import { FitBox } from "../../kit/FitBox.js";
import { useKitMotion } from "../../kit/motion.js";
import { MotionWords } from "../../kit/MotionWords.js";
import { useSizes } from "../../kit/sizes.js";
import { displayTextStyle } from "../../kit/textStyles.js";
import { pulse } from "../../motion/index.js";
import { useStylePack } from "../../stylePacks/StylePackContext.js";
import { activeLineAt, spokenLineStarts } from "./lineStarts.js";
import { readKineticProps } from "./readKineticProps.js";

const firstLineFrame = 2;
const lineEachFrames = 20;
const wordEachFrames = 2;
const exitFrames = 5;
const enterDelayFrames = 4;
const wideLineUnits = 150;

export function Kinetic(props: { props: JsonObject }): ReactNode {
  const { lines, assetId } = readKineticProps(props.props);
  const stylePack = useStylePack();
  const sizes = useSizes();
  const motion = useKitMotion();
  const frame = useFrame();
  const { durationFrames, findAsset } = useSceneContext();
  const accent = sceneAccentOf(stylePack);
  const voice = assetId === undefined ? undefined : findAsset(assetId);
  const spokenStarts = spokenLineStarts({ lines, words: voice?.words });
  const starts =
    spokenStarts ??
    lines.map((...[, index]) =>
      motion.framesOf(firstLineFrame + index * lineEachFrames),
    );
  const wordsOfLine = (index: number) =>
    motion.wordsFrom({
      text: lines[index] ?? "",
      startFrame:
        (starts[index] ?? 0) +
        (index === 0 ? 0 : motion.framesOf(enterDelayFrames)),
      kind: "scale",
      eachSeconds: motion.framesOf(wordEachFrames) / motion.framesPerSecond,
    });
  const lastIndex = lines.length - 1;
  const settleFrame =
    wordsOfLine(lastIndex)(0).settleFrame + motion.framesOf(8);
  const lineFrame =
    spokenStarts === undefined || durationFrames <= 1
      ? motion.paced(settleFrame)
      : frame;
  const active = activeLineAt({ starts, frame: lineFrame });
  const exitShare = tween({
    frame: lineFrame,
    startFrame: starts[active] ?? 0,
    endFrame: (starts[active] ?? 0) + motion.framesOf(exitFrames),
    from: 0,
    to: 1,
  });
  const landing = pulse({
    frame: lineFrame,
    framesPerSecond: motion.framesPerSecond,
    atFrame: wordsOfLine(lastIndex)(0).settleFrame - motion.framesOf(6),
    amount: 0.05,
  });
  const isWide = sizes.layout === "wide";
  const box = centeredContentBox({
    stylePack,
    sizes,
    boxStyle: {
      alignItems: "center",
      ...(isWide
        ? {
            left: `calc(50% - ${sizes.pixels(wideLineUnits / 2)})`,
            right: `calc(50% - ${sizes.pixels(wideLineUnits / 2)})`,
          }
        : {}),
    },
  });
  const shown = active > 0 && exitShare < 1 ? [active - 1, active] : [active];
  return shown.map((index) => {
    const isLeaving = index !== active;
    const isLast = index === lastIndex;
    return (
      <FitBox
        key={`${String(index)}-${lines[index] ?? ""}`}
        style={{
          ...box.style,
          ...(isLeaving
            ? {
                opacity: 1 - exitShare,
                transform: `translateY(${sizes.pixels(-6 * exitShare)}) scale(${String(1 - 0.08 * exitShare)})`,
              }
            : isLast && landing !== 1
              ? { transform: `scale(${String(landing)})` }
              : {}),
        }}
      >
        <p
          data-text-prop={`lines.${String(index)}`}
          style={{
            ...displayTextStyle(stylePack),
            overflowWrap: "normal",
            fontSize: sizes.text("statement"),
            lineHeight: 1,
            textAlign: "center",
            color:
              isLast && lines.length > 1 ? accent.text : stylePack.colors.text,
          }}
        >
          <MotionWords
            words={wordsOfLine(index)(lineFrame).words}
            settledAs="text"
          />
        </p>
      </FitBox>
    );
  });
}
