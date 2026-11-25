import {
  isRefusedByPerson,
  type Asset,
  type ProjectSnapshot,
} from "@yumekit/project";
import type { HarnessFailure } from "../results.js";
import {
  designNotChecked,
  isOpen,
  shortestCleanSeconds,
  shotNeedsDesign,
  standingCheckOf,
} from "./designGate.js";
import { shotOfAsset } from "./shotOfAsset.js";

function rounded(seconds: number): string {
  return String(Math.round(seconds * 100) / 100);
}

export function shownClipFailureOf(options: {
  snapshot: ProjectSnapshot;
  asset: Asset;
  fromFrame: number;
  shownFrames: number;
}): HarnessFailure | undefined {
  const { snapshot, asset, fromFrame } = options;
  const shot = shotOfAsset({ snapshot, asset });
  if (shot === undefined || !shotNeedsDesign({ snapshot, shot })) {
    return undefined;
  }
  const isRefused = isRefusedByPerson({
    takes: snapshot.takes,
    assetId: asset.id,
  });
  const keptWhole =
    !isRefused &&
    (shot.reviews ?? []).some(
      (review) =>
        review.assetId === asset.id && review.personKept !== undefined,
    );
  const check = standingCheckOf({ snapshot, shot, assetId: asset.id });
  if (keptWhole) return undefined;
  if (check === undefined) {
    return designNotChecked({
      shotId: shot.id,
      assetIds: [asset.id],
      what: "clip",
    });
  }
  if (isOpen(check)) return undefined;
  const { framesPerSecond } = snapshot.project;
  const cleanUntil = check.cleanUntilSeconds ?? 0;
  const cleanFrames = Math.floor(cleanUntil * framesPerSecond);
  const lastShownFrame = fromFrame + options.shownFrames;
  if (cleanUntil >= shortestCleanSeconds && lastShownFrame <= cleanFrames + 1) {
    return undefined;
  }
  const breaks = check.breaks.join("; ");
  const isTooShort = cleanUntil < shortestCleanSeconds;
  return {
    kind: "design-break-in-range",
    message: isTooShort
      ? `The design of the clip "${asset.id}" breaks after ${rounded(cleanUntil)}s (${breaks}). A clean part under ${String(shortestCleanSeconds)} seconds is too short to show.`
      : `The design of the clip "${asset.id}" breaks after ${rounded(cleanUntil)}s (${breaks}), and this placement shows it until ${rounded(lastShownFrame / framesPerSecond)}s.`,
    hint: isTooShort
      ? "Make the clip again from a checked start picture, with a prompt that names what must not change. Only when the person chose this clip, give their words in person_chose_this_clip of place_video."
      : `Give duration_frames (plus the start inside the clip) of at most ${String(cleanFrames)}, so only the clean part shows. Only when the person chose the whole clip, give their words in person_chose_this_clip of place_video.`,
  };
}
