import type { JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { FilmHeading } from "../../../film/FilmHeading.js";
import { boxStyle, useFilmGrid } from "../../../film/filmGrid.js";
import { useFilmTiming } from "../../../film/filmTiming.js";
import { FitBox } from "../../../kit/FitBox.js";
import { displayTextStyle } from "../../../kit/textStyles.js";
import { countUp } from "../../../motion/index.js";
import { keepValidItems, readField } from "../../../props/readField.js";
import {
  countsItem,
  countsLimits,
  countsSchema,
} from "../../../schemas/film/counts.js";
import { useStylePack } from "../../../stylePacks/StylePackContext.js";
import { readFilmHeading } from "../readFilmProps.js";

const countSeconds = 1;

export function Counts(props: { props: JsonObject }): ReactNode {
  const { heading, accent } = readFilmHeading(props.props);
  const items = readField({
    field: countsSchema.props.shape.items,
    value: props.props["items"],
    fallback: [{ value: 0, label: "Count" }],
    repair: keepValidItems({ item: countsItem, maxItems: countsLimits.items }),
  });
  const stylePack = useStylePack();
  const grid = useFilmGrid({ hasHeading: heading !== undefined });
  const firstBeat = heading === undefined ? 0 : 1;
  const timing = useFilmTiming({
    lastEntryBeat: firstBeat + items.length - 1,
    tailSeconds: countSeconds,
  });
  const { sizes } = grid;
  const isWide = sizes.layout === "wide";
  return (
    <>
      <FilmHeading
        heading={heading}
        accent={accent}
        grid={grid}
        motion={timing.enterAt(0)}
      />
      <FitBox
        style={boxStyle(grid.media)}
        contentStyle={{
          display: "flex",
          flexDirection: isWide ? "row" : "column",
          gap: sizes.pixels(isWide ? 10 : 5),
        }}
      >
        {items.map((...[item, index]) => {
          const beat = firstBeat + index;
          const count = countUp({
            frame: timing.pacedFrame,
            framesPerSecond: timing.framesPerSecond,
            startFrame: timing.frameOfBeat(beat),
            durationSeconds: countSeconds,
            to: item.value,
            prefix: item.prefix,
            suffix: item.suffix,
          });
          return (
            <div
              key={`${String(index)}-${item.label}`}
              style={{
                ...timing.enterAt(beat),
                display: "flex",
                alignItems: "baseline",
                gap: sizes.fitted(1.6),
              }}
            >
              <p
                style={{
                  ...displayTextStyle(stylePack),
                  fontSize: sizes.text("filmNumber"),
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {count.text}
              </p>
              <p
                data-text-prop={`items.${String(index)}.label`}
                style={{
                  margin: 0,
                  fontSize: sizes.text("filmLabel"),
                  color: stylePack.colors.mutedText,
                  maxWidth: sizes.pixels(30),
                }}
              >
                {item.label}
              </p>
            </div>
          );
        })}
      </FitBox>
    </>
  );
}
