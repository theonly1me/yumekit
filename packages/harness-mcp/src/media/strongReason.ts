import type { ProjectSnapshot } from "@yumekit/project";
import { refusalsOf } from "../storyPlan/shotRefusals.js";
import type { GenerateAssetInput } from "./generateAssetInput.js";

export function strongReasonOf(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): string | undefined {
  const { request } = options;
  if (request.capability === "image" && request.sheet_of !== undefined) {
    return "every later picture copies a sheet";
  }
  if (request.shot_id === undefined) return undefined;
  if (request.capability === "image") {
    return "a start picture fixes the first frame of its clip";
  }
  const shot = options.snapshot.bible.storyPlan?.shots.find(
    (candidate) => candidate.id === request.shot_id,
  );
  const refused = shot !== undefined && refusalsOf({ shot }).length > 0;
  return refused && request.capability === "video"
    ? "a try after a refusal uses the strongest model"
    : undefined;
}
