import type { ProjectSnapshot, Shot } from "@yumekit/project";
import { stateText, strikeText } from "../../storyPlan/stateText.js";
import { freeShotLines } from "../../storyPlan/freeShots.js";
import { firstCutLines } from "./firstCutText.js";

function reviewText(shot: Shot): string {
  const reviews = shot.reviews ?? [];
  if (reviews.length === 0) return "No reviewed clip.";
  return reviews
    .map((review) => {
      const part =
        review.keepFromSeconds === undefined ||
        review.keepToSeconds === undefined
          ? ""
          : ` ${String(review.keepFromSeconds)}s to ${String(review.keepToSeconds)}s`;
      const faults =
        review.faults.length === 0
          ? ""
          : ` Faults: ${review.faults.join("; ")}.`;
      const notes =
        (review.notes ?? []).length === 0
          ? ""
          : ` Notes: ${(review.notes ?? []).join("; ")}.`;
      const end =
        review.endPictureAssetId === undefined
          ? ""
          : ` End picture: ${review.endPictureAssetId}.`;
      const by =
        review.by === "critic" ? "the critic" : "the maker (not checked)";
      const missed =
        (review.critic?.missed ?? []).length === 0
          ? ""
          : ` Did not happen: ${(review.critic?.missed ?? []).join("; ")}.`;
      const person =
        review.personKept === undefined
          ? ""
          : ` The person chose to keep it: "${review.personKept.words}".`;
      return `Clip ${review.assetId}: ${review.verdict} by ${by}${part}.${faults}${notes}${missed}${end}${person}`;
    })
    .join(" ");
}

function shotLines(options: { shot: Shot; number: number }): string[] {
  const { shot } = options;
  const camera = [
    shot.camera.size,
    shot.camera.angle,
    shot.camera.lens === undefined ? undefined : `${shot.camera.lens} lens`,
    shot.camera.move,
  ]
    .filter((part) => part !== undefined)
    .join(", ");
  return [
    `${String(options.number)}. ${shot.id} (${String(shot.seconds)}s, place ${shot.placeId}, cast ${shot.castIds.join(", ") || "none"}, camera ${camera})`,
    `   Purpose: ${shot.purpose}`,
    `   Shows from the story: ${shot.storyFact ?? "not named"}`,
    `   Action: ${shot.action}`,
    ...(shot.continuesShotId === undefined
      ? []
      : [`   Continues the last frame of: ${shot.continuesShotId}`]),
    `   Start: ${stateText(shot.startState)}`,
    `   End: ${stateText(shot.endState)}`,
    ...(shot.strikes ?? []).map((strike) => `   Strike: ${strikeText(strike)}`),
    `   Music: intensity ${String(shot.musicIntensity ?? "not set")}${(shot.musicHits ?? []).length === 0 ? "" : `, hits at ${(shot.musicHits ?? []).map((hit) => `${String(hit)}s`).join(", ")}`}`,
    `   Next shot inherits: ${shot.inherits === "" ? "nothing" : shot.inherits}`,
    `   Start picture prompt: ${shot.startPicturePrompt ?? "none"}`,
    `   Video prompt: ${shot.videoPrompt ?? "none"}`,
    `   ${reviewText(shot)}`,
  ];
}

export function planLines(snapshot: ProjectSnapshot): string[] {
  const plan = snapshot.bible.storyPlan;
  if (plan === undefined) {
    return ["### Story plan", "(no story plan: set_story_plan writes one)"];
  }
  return [
    "### Story plan",
    `Form: ${plan.form ?? "not set"}`,
    `Logline: ${plan.logline}`,
    `Wants: ${plan.want}. Against it: ${plan.obstacle}. Changes: ${plan.change}`,
    ...firstCutLines({ snapshot, plan }),
    ...freeShotLines({ snapshot, plan }),
    ...plan.shots.flatMap((...[shot, index]) =>
      shotLines({ shot, number: index + 1 }),
    ),
    ...(plan.musicChecks ?? []).map(
      (check) =>
        `Music check ${check.assetId}: fit ${String(check.fit)} from ${String(check.startSeconds)}s.${check.warnings.length === 0 ? "" : ` ${check.warnings.join(" ")}`}`,
    ),
  ];
}
