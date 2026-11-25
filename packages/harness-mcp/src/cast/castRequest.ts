import type { CastMember, ProjectSnapshot } from "@yumekit/project";
import type { MediaModel, MediaTools } from "@yumekit/tools";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { startsOnPicture } from "../storyPlan/firstFrameRule.js";
import { findCastMembers } from "./castMembers.js";

function referenceMaximumOf(model: MediaModel | undefined): number {
  const setting = model?.settings.find(
    (candidate) => candidate.name === "reference_image_paths",
  );
  return setting?.kind === "image-files" ? setting.maximum : 0;
}

function referenceIdsOf(options: {
  request: GenerateAssetInput;
  members: CastMember[];
  maximum: number;
}): string[] | undefined {
  const given = options.request.reference_asset_ids;
  if (options.maximum === 0) return given;
  const explicit = given ?? [];
  const castIds = [
    ...new Set(options.members.flatMap((member) => member.referenceAssetIds)),
  ].filter((assetId) => !explicit.includes(assetId));
  const room = Math.max(0, options.maximum - explicit.length);
  const merged = [...explicit, ...castIds.slice(0, room)];
  return merged.length === 0 ? given : merged;
}

export async function withCast(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
  mediaTools: MediaTools;
}): Promise<Outcome<GenerateAssetInput, HarnessFailure>> {
  const { request } = options;
  const castIds = request.cast_ids ?? [];
  if (castIds.length === 0) return { ok: true, value: request };
  if (request.capability !== "image" && request.capability !== "video") {
    return {
      ok: false,
      failure: {
        kind: "invalid-value",
        message: `cast_ids is for a picture or a video clip, not for ${request.capability}.`,
        hint: "Leave out cast_ids, or use the capability image or video.",
      },
    };
  }
  const found = findCastMembers({ snapshot: options.snapshot, castIds });
  if (!found.ok) return found;
  if (startsOnPicture(request)) return { ok: true, value: request };
  const members = found.value;
  const maximum = referenceMaximumOf(
    await options.mediaTools.chosenModel({
      capability: request.capability,
      ...(request.server === undefined ? {} : { server: request.server }),
      ...(request.model === undefined ? {} : { model: request.model }),
    }),
  );
  const referenceIds = referenceIdsOf({ request, members, maximum });
  return {
    ok: true,
    value: {
      ...request,
      ...(referenceIds === undefined
        ? {}
        : { reference_asset_ids: referenceIds }),
    },
  };
}
