import { tween, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { boxStyle, useFilmGrid } from "../../../film/filmGrid.js";
import { useFilmTiming } from "../../../film/filmTiming.js";
import { sceneAccentOf } from "../../../kit/accentColors.js";
import { FitBox } from "../../../kit/FitBox.js";
import { displayTextStyle } from "../../../kit/textStyles.js";
import { keepValidItems, readField } from "../../../props/readField.js";
import {
  linesLimits,
  linesLine,
  linesSchema,
} from "../../../schemas/film/lines.js";
import { useStylePack } from "../../../stylePacks/StylePackContext.js";

const dimmedOpacity = 0.32;
const dimSeconds = 0.25;

export function Lines(props: { props: JsonObject }): ReactNode {
  const { shape } = linesSchema.props;
  const lines = readField({
    field: shape.lines,
    value: props.props["lines"],
    fallback: ["Line"],
    repair: keepValidItems({ item: linesLine, maxItems: linesLimits.lines }),
  });
  const accentLine = readField({
    field: shape.accentLine,
    value: props.props["accentLine"],
    fallback: undefined,
  });
  const stylePack = useStylePack();
  const grid = useFilmGrid({ hasHeading: false });
  const timing = useFilmTiming({ lastEntryBeat: lines.length - 1 });
  const accent = sceneAccentOf(stylePack);
  const brightnessOf = (index: number) =>
    index === lines.length - 1
      ? 1
      : tween({
          frame: timing.pacedFrame,
          startFrame: timing.frameOfBeat(index + 1),
          endFrame:
            timing.frameOfBeat(index + 1) + dimSeconds * timing.framesPerSecond,
          from: 1,
          to: dimmedOpacity,
        });
  return (
    <FitBox style={boxStyle(grid.content)}>
      {lines.map((...[line, index]) => {
        const motion = timing.enterAt(index);
        return (
          <p
            key={`${String(index)}-${line}`}
            data-text-prop={`lines.${String(index)}`}
            style={{
              ...displayTextStyle(stylePack),
              ...motion,
              opacity: motion.opacity * brightnessOf(index),
              fontSize: grid.sizes.text("filmLine"),
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              whiteSpace: "nowrap",
              color:
                accentLine === index + 1 ? accent.text : stylePack.colors.text,
            }}
          >
            {line}
          </p>
        );
      })}
    </FitBox>
  );
}
