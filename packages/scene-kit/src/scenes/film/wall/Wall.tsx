import { useSceneContext, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { FilmHeading } from "../../../film/FilmHeading.js";
import { useFilmGrid } from "../../../film/filmGrid.js";
import { filmMediaOf } from "../../../film/filmMedia.js";
import { FilmPicture } from "../../../film/FilmPicture.js";
import { useFilmTiming } from "../../../film/filmTiming.js";
import { MediaWindow } from "../../../film/MediaWindow.js";
import { readField } from "../../../props/readField.js";
import { wallLimits, wallSchema } from "../../../schemas/film/wall.js";
import { readAssetIds, readFilmHeading } from "../readFilmProps.js";
import { wallCellsOf } from "./wallGrid.js";

const entryBeatsAtMost = 3;

export function Wall(props: { props: JsonObject }): ReactNode {
  const { shape } = wallSchema.props;
  const { heading, accent } = readFilmHeading(props.props);
  const assetIds = readAssetIds({
    value: props.props["assetIds"],
    maxItems: wallLimits.assets,
  });
  const columns = readField({
    field: shape.columns,
    value: props.props["columns"],
    fallback: undefined,
  });
  const startSeconds =
    readField({
      field: shape.startSeconds,
      value: props.props["startSeconds"],
      fallback: undefined,
    }) ?? 0;
  const hasHeading = heading !== undefined;
  const grid = useFilmGrid({ hasHeading });
  const { findAsset } = useSceneContext();
  const media = assetIds.map((assetId) => filmMediaOf({ findAsset, assetId }));
  const aspect = media[0]?.aspect ?? 16 / 9;
  const { cells, height: cellsHeight } = wallCellsOf({
    count: assetIds.length,
    columns,
    width: grid.media.width,
    height: grid.media.height,
    gap: grid.gap,
    aspect,
  });
  const firstBeat = hasHeading ? 0.5 : 0;
  const eachBeats = Math.min(
    0.5,
    entryBeatsAtMost / Math.max(1, assetIds.length - 1),
  );
  const timing = useFilmTiming({
    lastEntryBeat: firstBeat + eachBeats * Math.max(0, assetIds.length - 1),
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
      {cells.map((...[cell, index]) => {
        const assetId = assetIds[index] ?? "";
        const cellMedia = media[index] ?? filmMediaOf({ findAsset, assetId });
        return (
          <MediaWindow
            key={`${String(index)}-${assetId}`}
            box={{
              ...cell,
              left: grid.media.left + cell.left,
              top:
                grid.media.top +
                cell.top +
                (hasHeading ? 0 : (grid.media.height - cellsHeight) / 2),
            }}
            grid={grid}
            motion={timing.enterAt(firstBeat + index * eachBeats)}
          >
            <FilmPicture
              assetId={assetId}
              media={cellMedia}
              assetFrame={assetFrame}
            />
          </MediaWindow>
        );
      })}
    </>
  );
}
