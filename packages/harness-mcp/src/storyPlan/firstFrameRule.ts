import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure } from "../results.js";

export const videoPromptLimit = 900;

export function startsOnPicture(request: GenerateAssetInput): boolean {
  return (
    request.capability === "video" && request.first_frame_asset_id !== undefined
  );
}

export function firstFrameFailureOf(
  request: GenerateAssetInput,
): HarnessFailure | undefined {
  if (!startsOnPicture(request)) return undefined;
  if ((request.reference_asset_ids ?? []).length === 0) return undefined;
  return {
    kind: "first-frame-only",
    message:
      "A clip with a first frame sends that picture as its only picture. More pictures let the model compose another shot.",
    hint: "Leave out reference_asset_ids. Put what the sheets show into the start picture, and have the critic check it with review_start.",
  };
}
