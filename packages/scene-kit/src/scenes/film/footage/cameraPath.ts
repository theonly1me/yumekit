import type { SceneRegion } from "@yumekit/scene";
import { drawCurve } from "../../../motion/curves.js";
import { blendRegions } from "../../../film/regionView.js";

export interface PlacedStop {
  region: SceneRegion;
  frame: number;
}

export function regionAtFrame(options: {
  stops: readonly PlacedStop[];
  frame: number;
  moveFrames: number;
}): SceneRegion | undefined {
  const { stops, frame, moveFrames } = options;
  const [first] = stops;
  if (first === undefined) return undefined;
  let region = first.region;
  for (const [index, stop] of stops.entries()) {
    const before = stops[index - 1];
    if (before === undefined) continue;
    const moveStart = Math.max(before.frame, stop.frame - moveFrames);
    if (frame <= moveStart) return region;
    const length = Math.max(1, stop.frame - moveStart);
    const share = Math.min(1, (frame - moveStart) / length);
    region = blendRegions({
      from: before.region,
      to: stop.region,
      share: drawCurve(share),
    });
    if (share < 1) return region;
    region = stop.region;
  }
  return region;
}
