import { useSceneContext, type JsonObject } from "@yumekit/scene";
import type { ReactNode } from "react";
import { FilmHeading } from "../../../film/FilmHeading.js";
import { useFilmGrid } from "../../../film/filmGrid.js";
import { filmMediaOf } from "../../../film/filmMedia.js";
import { FilmPicture } from "../../../film/FilmPicture.js";
import { useFilmTiming } from "../../../film/filmTiming.js";
import { labelRowHeight, MediaWindow } from "../../../film/MediaWindow.js";
import { placeMedia } from "../../../film/mediaPlacement.js";
import { regionAspect, viewOf } from "../../../film/regionView.js";
import { regionAtFrame } from "./cameraPath.js";
import { footageShotOf, spreadFrames } from "./placeStops.js";
import { readFootageProps } from "./readFootageProps.js";

const moveSeconds = 0.8;

export function Footage(props: { props: JsonObject }): ReactNode {
  const footage = readFootageProps(props.props);
  const hasHeading = footage.heading !== undefined;
  const grid = useFilmGrid({ hasHeading });
  const windowBeat = hasHeading ? 0.5 : 0;
  const timing = useFilmTiming({ lastEntryBeat: windowBeat });
  const { findAsset, durationFrames } = useSceneContext();
  const media = filmMediaOf({ findAsset, assetId: footage.assetId });
  const shot = footageShotOf({
    props: footage,
    media,
    frameOfBeat: timing.frameOfBeat,
    framesPerSecond: timing.framesPerSecond,
  });
  const [firstRegion] = shot.regions;
  const boxAspect = regionAspect({
    region: firstRegion?.region ?? { x: 0, y: 0, width: 1, height: 1 },
    pictureAspect: media.aspect,
  });
  const placement = placeMedia({
    grid,
    aspect: boxAspect,
    hasHeading,
    labelHeight: labelRowHeight(grid),
  });
  const { box } = placement;
  const frames = spreadFrames({
    frames: shot.regions.map((entry) => entry.frame),
    durationFrames,
  });
  const view = regionAtFrame({
    stops: shot.regions.map((...[entry, index]) => ({
      region: viewOf({
        region: entry.region,
        boxAspect,
        pictureAspect: media.aspect,
      }),
      frame: frames[index] ?? 0,
    })),
    frame: timing.frame,
    moveFrames: moveSeconds * timing.framesPerSecond,
  });
  const assetFrame =
    Math.round(shot.startSeconds * timing.framesPerSecond) +
    timing.frame * footage.speed;
  return (
    <>
      <FilmHeading
        heading={footage.heading}
        accent={footage.accent}
        grid={grid}
        motion={timing.enterAt(0)}
        box={placement.heading}
      />
      <MediaWindow
        box={box}
        grid={grid}
        motion={timing.enterAt(windowBeat)}
        window={footage.window}
      >
        <FilmPicture
          assetId={footage.assetId}
          media={media}
          assetFrame={assetFrame}
          {...(view === undefined ? {} : { view })}
        />
      </MediaWindow>
    </>
  );
}
