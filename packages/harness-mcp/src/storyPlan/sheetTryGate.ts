import {
  type CastMember,
  type ProjectSnapshot,
  type SheetTry,
} from "@yumekit/project";
import { sheetTriesOf } from "./sheetTries.js";
import { castMemberNotFound } from "../cast/castMembers.js";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { withReviewedPrompt } from "./promptPlan.js";
import {
  reviewFirst,
  simplifyFirst,
  sourceTextOf,
  tryStepOf,
  triesUsedUp,
} from "./tryRules.js";

type RequestOutcome = Outcome<GenerateAssetInput, HarnessFailure>;

export function bestSheetTryOf(tries: SheetTry[]): SheetTry | undefined {
  return tries
    .filter((entry) => entry.verdict === "fail")
    .reduce<SheetTry | undefined>(
      (...[best, entry]) =>
        best === undefined || entry.faults.length <= best.faults.length
          ? entry
          : best,
      undefined,
    );
}

function failed(failure: HarnessFailure): RequestOutcome {
  return { ok: false, failure };
}

function stepFailure(options: {
  member: CastMember;
  request: GenerateAssetInput;
  tries: SheetTry[];
}): HarnessFailure | undefined {
  const { member, request, tries } = options;
  const refused = tries.filter((entry) => entry.verdict === "fail");
  const step = tryStepOf(refused.length);
  const subject = `The sheet of "${member.id}"`;
  if (step === "refine") {
    const last = refused.at(-1)?.assetIds ?? [];
    const references = request.reference_asset_ids ?? [];
    return last.some((id) => references.includes(id))
      ? undefined
      : {
          kind: "start-from-refused",
          message: `${subject} was refused once. The second try starts from the refused picture and changes only the named faults.`,
          hint: `Give the refused picture (${last.join(" or ")}) in reference_asset_ids, and write "Keep everything of the reference and change only: <each fault>".`,
        };
  }
  if (step === "simplify") {
    return (request.simpler_form ?? "").trim() === ""
      ? simplifyFirst(subject)
      : undefined;
  }
  if (step === "first") return undefined;
  const best = bestSheetTryOf(tries);
  return triesUsedUp({
    subject,
    best: `Its best version is ${best?.assetIds.join(" and ") ?? "the last one"}, with ${String(best?.faults.length ?? 0)} blocking faults.`,
    aroundIt: `Use the best version: give it to put_cast_member with restrictions that keep the film away from its faults (for example "never show both hands close up"), then call review_plan again.`,
  });
}

export function withSheetTry(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): RequestOutcome {
  const { snapshot, request } = options;
  const castId = request.sheet_of;
  if (castId === undefined) return { ok: true, value: request };
  if (request.capability !== "image") {
    return failed({
      kind: "invalid-value",
      message: "sheet_of is for a sheet picture, with the capability image.",
      hint: "Leave out sheet_of, or use the capability image.",
    });
  }
  const member = snapshot.bible.cast.find((entry) => entry.id === castId);
  if (member === undefined) {
    return failed(castMemberNotFound({ snapshot, castId }));
  }
  const tries = sheetTriesOf(member);
  const reviewed = new Set(tries.flatMap((entry) => entry.assetIds));
  const made = snapshot.assets.filter(
    (asset) => sourceTextOf({ asset, field: "sheet_of" }) === castId,
  );
  const waiting = made.filter((asset) => !reviewed.has(asset.id));
  const pictureCount = Math.max(1, (member.sheetPrompts ?? []).length);
  if (waiting.length >= pictureCount) {
    return failed(
      reviewFirst({
        subject: `The sheet of "${castId}"`,
        tool: "review_sheet",
      }),
    );
  }
  if (request.person_asked_for_another_try === true) {
    return { ok: true, value: request };
  }
  const failure = stepFailure({ member, request, tries });
  if (failure !== undefined) return failed(failure);
  const isFirst = tries.every((entry) => entry.verdict !== "fail");
  return isFirst
    ? withReviewedPrompt({
        request,
        planned: member.sheetPrompts ?? [],
        made,
        subject: `the sheet of "${castId}"`,
      })
    : { ok: true, value: request };
}
