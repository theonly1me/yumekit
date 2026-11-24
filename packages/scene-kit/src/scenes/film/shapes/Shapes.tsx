import { useSceneContext, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { FilmHeading } from "../../../film/FilmHeading.js";
import { useFilmGrid } from "../../../film/filmGrid.js";
import { filmMediaOf } from "../../../film/filmMedia.js";
import { FilmPicture } from "../../../film/FilmPicture.js";
import { useFilmTiming } from "../../../film/filmTiming.js";
import {
  labelRowHeight,
  MediaLabel,
  MediaWindow,
} from "../../../film/MediaWindow.js";
import { readField } from "../../../props/readField.js";
import { filmLimits } from "../../../schemas/film/shared.js";
import { shapesLimits, shapesSchema } from "../../../schemas/film/shapes.js";
import { readAssetIds, readFilmHeading, readTexts } from "../readFilmProps.js";
import { shapeBoxesOf } from "./shapeRows.js";

export function Shapes(props: { props: JsonObject }): ReactNode {
  const { heading, accent } = readFilmHeading(props.props);
  const assetIds = readAssetIds({
    value: props.props["assetIds"],
    maxItems: shapesLimits.assets,
  });
  const labels = readTexts({
    value: props.props["labels"],
    maxItems: shapesLimits.assets,
    maxLength: filmLimits.label,
  });
  const startSeconds =
    readField({
      field: shapesSchema.props.shape.startSeconds,
      value: props.props["startSeconds"],
      fallback: undefined,
    }) ?? 0;
  const hasHeading = heading !== undefined;
  const grid = useFilmGrid({ hasHeading });
  const { findAsset } = useSceneContext();
  const media = assetIds.map((assetId) => filmMediaOf({ findAsset, assetId }));
  const firstBeat = hasHeading ? 1 : 0;
  const timing = useFilmTiming({
    lastEntryBeat: firstBeat + Math.max(0, assetIds.length - 1),
  });
  const hasLabels = labels.some((label) => label !== "");
  const boxes = shapeBoxesOf({
    aspects: media.map((entry) => entry.aspect),
    width: grid.media.width,
    height: grid.media.height,
    gap: grid.gap,
    labelHeight: hasLabels ? labelRowHeight(grid) : 0,
  });
  const assetFrame =
    Math.round(startSeconds * timing.framesPerSecond) + timing.frame;
  return (
    <>
      <FilmHeading
        heading={heading}
        accent={accent}
        grid={grid}
        motion={timing.enterAt(0)}
      />
      {boxes.map((...[box, index]) => {
        const assetId = assetIds[index] ?? "";
        const placed = {
          ...box,
          left: grid.media.left + box.left,
          top: grid.media.top + box.top,
        };
        const motion = timing.enterAt(firstBeat + index);
        const label = labels[index] ?? "";
        return (
          <div key={`${String(index)}-${assetId}`}>
            <MediaWindow box={placed} grid={grid} motion={motion}>
              <FilmPicture
                assetId={assetId}
                media={media[index] ?? filmMediaOf({ findAsset, assetId })}
                assetFrame={assetFrame}
              />
            </MediaWindow>
            {label === "" ? null : (
              <MediaLabel
                box={placed}
                grid={grid}
                motion={motion}
                textProp={`labels.${String(index)}`}
                text={label}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
