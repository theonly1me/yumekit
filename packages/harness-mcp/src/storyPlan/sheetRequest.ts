import type { ProjectSnapshot } from "@yumekit/project";
import { castMemberNotFound } from "../cast/castMembers.js";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { isKitSheetCall } from "./kitSheets.js";
import { withPlannedPrompt } from "./promptPlan.js";
import { sourceTextOf } from "./tryRules.js";

export function withSheetRequest(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): Outcome<GenerateAssetInput, HarnessFailure> {
  const { snapshot, request } = options;
  const castId = request.sheet_of;
  if (castId === undefined) return { ok: true, value: request };
  if (request.capability !== "image") {
    return {
      ok: false,
      failure: {
        kind: "invalid-value",
        message: "sheet_of is for a sheet picture, with the capability image.",
        hint: "Leave out sheet_of, or use the capability image.",
      },
    };
  }
  const member = snapshot.bible.cast.find((entry) => entry.id === castId);
  if (member === undefined) {
    return { ok: false, failure: castMemberNotFound({ snapshot, castId }) };
  }
  if (isKitSheetCall(request)) return { ok: true, value: request };
  const made = snapshot.assets.filter(
    (asset) =>
      sourceTextOf({ asset, field: "sheet_of" }) === castId &&
      !isKitSheetCall({
        look_id: sourceTextOf({ asset, field: "look_id" }),
        sheet_kind: sourceTextOf({ asset, field: "sheet_kind" }),
      }),
  );
  return {
    ok: true,
    value: withPlannedPrompt({
      request,
      planned: member.sheetPrompts ?? [],
      made,
    }),
  };
}
