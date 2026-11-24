import { useSceneContext, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { FilmHeading } from "../../../film/FilmHeading.js";
import { useFilmGrid } from "../../../film/filmGrid.js";
import { filmMediaOf, markOf } from "../../../film/filmMedia.js";
import { FilmPicture } from "../../../film/FilmPicture.js";
import { useFilmTiming } from "../../../film/filmTiming.js";
import {
  labelRowHeight,
  MediaLabel,
  MediaWindow,
} from "../../../film/MediaWindow.js";
import { placeMedia } from "../../../film/mediaPlacement.js";
import {
  regionAspect,
  viewOf,
  wholePicture,
} from "../../../film/regionView.js";
import { readLookSwapProps } from "./readLookSwapProps.js";

export function LookSwap(props: { props: JsonObject }): ReactNode {
  const swap = readLookSwapProps(props.props);
  const hasHeading = swap.heading !== undefined;
  const grid = useFilmGrid({ hasHeading });
  const windowBeat = hasHeading ? 0.5 : 0;
  const count = Math.max(1, swap.assetIds.length);
  const timing = useFilmTiming({
    lastEntryBeat: windowBeat + (count - 1) * swap.beatsEach,
  });
  const { findAsset } = useSceneContext();
  const firstSwapFrame = timing.frameOfBeat(windowBeat);
  const swapFrames = Math.max(1, timing.beatFrames * swap.beatsEach);
  const shownIndex = Math.min(
    count - 1,
    Math.max(0, Math.floor((timing.pacedFrame - firstSwapFrame) / swapFrames)),
  );
  const shownFrom = firstSwapFrame + shownIndex * swapFrames;
  const assetId = swap.assetIds[shownIndex] ?? "";
  const media = filmMediaOf({ findAsset, assetId });
  const mark = markOf({ media, name: swap.marks[shownIndex] });
  const firstMedia = filmMediaOf({
    findAsset,
    assetId: swap.assetIds[0] ?? "",
  });
  const firstRegion =
    swap.region ??
    markOf({ media: firstMedia, name: swap.marks[0] })?.region ??
    wholePicture;
  const boxAspect = regionAspect({
    region: firstRegion,
    pictureAspect: firstMedia.aspect,
  });
  const placement = placeMedia({
    grid,
    aspect: boxAspect,
    hasHeading,
    labelHeight: labelRowHeight(grid),
  });
  const { box } = placement;
  const view = viewOf({
    region: swap.region ?? mark?.region ?? wholePicture,
    boxAspect,
    pictureAspect: media.aspect,
  });
  const assetFrame =
    Math.round((mark?.seconds ?? 0) * timing.framesPerSecond) +
    Math.max(0, timing.pacedFrame - shownFrom);
  const motion = timing.enterAt(windowBeat);
  const label = swap.labels[shownIndex] ?? "";
  return (
    <>
      <FilmHeading
        heading={swap.heading}
        accent={swap.accent}
        grid={grid}
        motion={timing.enterAt(0)}
        box={placement.heading}
      />
      <MediaWindow box={box} grid={grid} motion={motion}>
        <FilmPicture
          key={shownIndex}
          assetId={assetId}
          media={media}
          assetFrame={assetFrame}
          view={view}
        />
      </MediaWindow>
      {label === "" ? null : (
        <MediaLabel
          box={box}
          grid={grid}
          motion={motion}
          textProp={`labels.${String(shownIndex)}`}
          text={label}
        />
      )}
    </>
  );
}
