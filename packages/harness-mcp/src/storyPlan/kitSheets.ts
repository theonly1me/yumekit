import {
  castLookOf,
  defaultLookId,
  lookLimits,
  lookSheetKinds,
  shotLookIdOf,
  type CastMember,
  type JsonObject,
  type Shot,
  type StoryPlan,
} from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../inputs.js";

export const kitSheetInput = {
  look_id: idInput(
    `With sheet_of: the look that the sheet shows. Default: "${defaultLookId}".`,
  ).optional(),
  sheet_kind: z
    .enum(lookSheetKinds)
    .optional()
    .describe(
      "With sheet_of: the kind of the sheet. A kit sheet (expressions or poses) is a help for the clips: it waits for no review and has no rule of tries, and the critic checks it against the turnaround of its look.",
    ),
  poses: z
    .array(z.string().trim().min(1).max(lookLimits.characters))
    .max(lookLimits.items)
    .optional()
    .describe(
      "With sheet_kind poses: the name of each pose on the sheet. Leave it out to record the poses that get_work proposes for this look, one for each shot. Write the prompt from them: one figure for each pose, in the clothes of the look, on a plain background.",
    ),
};

export interface PoseProposal {
  pose: string;
  shotId: string;
}

function holdingText(options: { shot: Shot; castId: string }): string {
  const { startState } = options.shot;
  if (typeof startState === "string") return "";
  return startState
    .flatMap((entry) =>
      entry.heldBy?.castId === options.castId
        ? [`; holds ${entry.castId} in the ${entry.heldBy.hand} hand`]
        : [],
    )
    .join("");
}

export function poseProposalsOf(options: {
  plan: StoryPlan | undefined;
  castId: string;
  lookId: string;
}): PoseProposal[] {
  const { castId, lookId } = options;
  return (options.plan?.shots ?? []).flatMap((shot) => {
    if (!shot.castIds.includes(castId)) return [];
    if (shotLookIdOf({ castLooks: shot.castLooks, castId }) !== lookId) {
      return [];
    }
    const entry =
      typeof shot.startState === "string"
        ? undefined
        : shot.startState.find((candidate) => candidate.castId === castId);
    const pose =
      entry === undefined
        ? `${shot.id}: ${shot.action}`
        : `${shot.id}: ${entry.state}; faces ${entry.facing}${holdingText({ shot, castId })}`;
    return [{ pose: pose.slice(0, lookLimits.characters), shotId: shot.id }];
  });
}

export function kitSheetRecordOf(options: {
  plan: StoryPlan | undefined;
  request: {
    sheet_of?: string | undefined;
    look_id?: string | undefined;
    sheet_kind?: string | undefined;
    poses?: string[] | undefined;
  };
}): JsonObject {
  const { request } = options;
  if (request.sheet_of === undefined) return {};
  const lookId = request.look_id ?? defaultLookId;
  const poses =
    request.sheet_kind !== "poses"
      ? undefined
      : (request.poses ??
        poseProposalsOf({
          plan: options.plan,
          castId: request.sheet_of,
          lookId,
        }).map((proposal) => proposal.pose));
  return {
    ...(request.look_id === undefined ? {} : { look_id: request.look_id }),
    ...(request.sheet_kind === undefined
      ? {}
      : { sheet_kind: request.sheet_kind }),
    ...(poses === undefined ? {} : { poses }),
  };
}

export function isKitSheetCall(request: {
  look_id?: string | undefined;
  sheet_kind?: string | undefined;
}): boolean {
  return (
    request.sheet_kind === "expressions" ||
    request.sheet_kind === "poses" ||
    (request.look_id !== undefined && request.look_id !== defaultLookId)
  );
}

function wordsOf(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[a-z]{3,}/g) ?? []);
}

export function nearestPoseOf(options: {
  plan: StoryPlan;
  shot: Shot;
  member: CastMember;
}): { assetId: string; pose: string } | undefined {
  const { plan, shot, member } = options;
  const lookId = shotLookIdOf({ castLooks: shot.castLooks, castId: member.id });
  const look = castLookOf({ member, lookId });
  const poses = (look?.sheets ?? []).flatMap((sheet) =>
    sheet.kind !== "poses" || sheet.check?.breaks.length
      ? []
      : (sheet.poses ?? []).map((pose) => ({ assetId: sheet.assetId, pose })),
  );
  const own = poses.find((entry) => entry.pose.startsWith(`${shot.id}:`));
  if (own !== undefined) return own;
  const wanted = wordsOf(
    poseProposalsOf({ plan, castId: member.id, lookId }).find(
      (proposal) => proposal.shotId === shot.id,
    )?.pose ?? shot.action,
  );
  const scored = poses.map((entry) => ({
    entry,
    score: [...wordsOf(entry.pose)].filter((word) => wanted.has(word)).length,
  }));
  const best = scored.reduce<(typeof scored)[number] | undefined>(
    (...[chosen, candidate]) =>
      chosen === undefined || candidate.score > chosen.score
        ? candidate
        : chosen,
    undefined,
  );
  return best === undefined || best.score === 0 ? undefined : best.entry;
}
