import type { Asset, CastMember, Shot } from "@yumekit/project";
import type { MotionWarning } from "@yumekit/render";
import {
  endEntryNamesOf,
  stateText,
  strikeText,
} from "../../storyPlan/stateText.js";
import type { ClipAnswer } from "./clipAnswerInput.js";
import { planNoteSectionOf } from "../plan/planNoteLines.js";
import { clipListText } from "./clipList.js";

export interface ClipJob {
  kind: "clip";
  clip: Asset;
  shot: Shot;
  members: CastMember[];
  pictures: Asset[];
  lengthSeconds: number;
  startPicture: Asset | undefined;
  previousEnd: Asset | undefined;
  warnings: MotionWarning[];
  openPlanFaults: string[];
  answer: ClipAnswer | undefined;
}

function rounded(seconds: number): string {
  return String(Math.round(seconds * 100) / 100);
}

export function warningLinesOf(warnings: MotionWarning[]): string {
  if (warnings.length === 0) return "No measured warnings.";
  return warnings
    .map(
      (...[warning, index]) =>
        `${String(index + 1)}. ${warning.kind}${warning.seconds === undefined ? "" : ` at ${rounded(warning.seconds)}s`}: ${warning.message}`,
    )
    .join("\n");
}

function factLines(members: CastMember[]): string {
  return members
    .map(
      (member) =>
        `- ${member.id} (${member.kind}), ${member.name}: ${member.description}. Fixed: ${(member.facts ?? []).join("; ") || "no facts"}`,
    )
    .join("\n");
}

export function clipBriefOf(job: ClipJob): string {
  const { shot } = job;
  const strikes = (shot.strikes ?? []).map(strikeText);
  return [
    `Review job: the clip "${job.clip.id}" of the shot "${shot.id}", ${rounded(job.lengthSeconds)} seconds long.`,
    "",
    "The plan of the shot:",
    `- Action: ${shot.action}`,
    `- Camera: ${shot.camera.size}, ${shot.camera.angle}${shot.camera.lens === undefined ? "" : `, ${shot.camera.lens} lens`}${shot.camera.move === undefined ? "" : `, move ${shot.camera.move}`}. One continuous shot.`,
    `- Start: ${stateText(shot.startState)}`,
    `- End: ${stateText(shot.endState)}`,
    ...(strikes.length === 0 ? [] : [`- Strikes: ${strikes.join(" | ")}`]),
    `- End entries to judge: ${endEntryNamesOf(shot.endState).join(", ")}`,
    "",
    "The cast in the shot and their fixed facts:",
    factLines(job.members),
    ...planNoteSectionOf(job.openPlanFaults),
    "",
    "The measured warnings (answer each one by its number):",
    warningLinesOf(job.warnings),
    "",
    "The list (answer each item by its number):",
    clipListText(),
    "",
    "Severity: put each fault that the film cannot use in faults (blocking), and each difference that a viewer would not see in notes. Hands, bodies, objects, contact, the source of an effect, and continuity stay blocking. Count only what is in the frame.",
    "",
    `Steps: 1. Call view_for_review with no input to see every frame, the start picture next to the first frame${job.previousEnd === undefined ? "" : ", the end of the shot before"}, and the sheets. 2. Look closer with view_for_review and a region and a time at each hand, each face, each weapon, each contact, and each warning. 3. Call give_clip_review once with your whole answer. If it refuses, correct the answer and call it again.`,
  ].join("\n");
}
