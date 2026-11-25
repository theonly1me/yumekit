import {
  approvePicturesFirstOf,
  assetVerdictsOf,
  type ProjectSnapshot,
  type Take,
} from "@yumekit/project";
import { designCheckOf } from "../critic/design/designRecord.js";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure } from "../results.js";
import { isSavedClipEnd, keyPictureIdsOf } from "../storyPlan/designGate.js";
import { shotOfAsset } from "../storyPlan/shotOfAsset.js";

function quoted(ids: string[]): string {
  return ids.map((id) => `"${id}"`).join(" and ");
}

function waitingTakeOf(options: {
  takes: readonly Take[];
  assetIds: string[];
}): Take | undefined {
  return options.takes.findLast(
    (take) =>
      take.state !== "sent" &&
      take.items.some((item) => options.assetIds.includes(item.id)),
  );
}

function hintOf(options: {
  snapshot: ProjectSnapshot;
  waiting: string[];
}): string {
  const { snapshot, waiting } = options;
  const verdicts = assetVerdictsOf(snapshot.takes);
  const take = waitingTakeOf({ takes: snapshot.takes, assetIds: waiting });
  if (take?.state === "ready") {
    return `Take ${String(take.number)} with the picture waits for the person. End your turn now with one short line that take ${String(take.number)} is ready.`;
  }
  if (take?.state === "open") {
    return `Call ready_take for take ${String(take.number)}, then end your turn so the person can approve the pictures.`;
  }
  const changed = waiting.filter((id) => verdicts.get(id) === "change");
  const dropped = waiting.filter((id) => verdicts.get(id) === "dropped");
  if (changed.length > 0 || dropped.length > 0) {
    return `${changed.length === 0 ? "" : `The person asked for a change of ${quoted(changed)}: make it again in a new take of pictures. `}${dropped.length === 0 ? "" : `The person dropped ${quoted(dropped)}: use another picture.`}`.trim();
  }
  return "Open a take of pictures with open_take, give the pictures to the person with ready_take (name an earlier picture in items), and end your turn. Only the person can turn this off, in Settings.";
}

function isKeptByPerson(options: {
  snapshot: ProjectSnapshot;
  assetId: string;
}): boolean {
  const { snapshot, assetId } = options;
  const asset = snapshot.assets.find((candidate) => candidate.id === assetId);
  const shot =
    asset === undefined ? undefined : shotOfAsset({ snapshot, asset });
  return (
    shot !== undefined &&
    designCheckOf({ shot, assetId })?.personKept !== undefined
  );
}

export function waitsForPerson(options: {
  snapshot: ProjectSnapshot;
  assetId: string;
}): boolean {
  const { snapshot, assetId } = options;
  if (!approvePicturesFirstOf(snapshot.project)) return false;
  if (isSavedClipEnd({ snapshot, assetId })) return false;
  const verdict = assetVerdictsOf(snapshot.takes).get(assetId);
  return verdict === undefined
    ? !isKeptByPerson(options)
    : verdict !== "approved";
}

export function pictureApprovalFailureOf(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): HarnessFailure | undefined {
  const { snapshot, request } = options;
  if (request.capability !== "video") return undefined;
  if (request.person_chose_this_picture !== undefined) return undefined;
  const waiting = keyPictureIdsOf(request).filter((assetId) =>
    waitsForPerson({ snapshot, assetId }),
  );
  if (waiting.length === 0) return undefined;
  return {
    kind: "picture-not-approved",
    message: `The person has not approved ${quoted(waiting)} in a take. "Approve pictures before clips" is on, so a clip starts only from pictures that the person approved, before any money goes to the clip.`,
    hint: `${hintOf({ snapshot, waiting })} Only when the person chose the picture in words, give their words in person_chose_this_picture.`,
  };
}
