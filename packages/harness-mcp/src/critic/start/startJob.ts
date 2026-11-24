import type { Asset, CastMember, Shot } from "@yumekit/project";
import { knownLimitLinesOf } from "../../storyGuide/knownLimits.js";
import { stateText } from "../../storyPlan/stateText.js";
import { planNoteSectionOf } from "../plan/planNoteLines.js";
import type { SheetAnswer } from "../sheet/sheetJob.js";

export interface StartJob {
  kind: "start";
  picture: Asset;
  shot: Shot;
  members: CastMember[];
  pictures: Asset[];
  previousEnd: Asset | undefined;
  openPlanFaults: string[];
  answer: SheetAnswer | undefined;
}

export const startListItems = [
  "Start state: each person and prop is where the plan puts it at the start: its screen side, its facing, the hand that holds it, its state. Nothing more is in the frame than the plan names.",
  "Framing: the size and the angle of the shot as the plan gives them (a close up is close, a low angle looks up).",
  "The sheets: face, hair, each garment, each mark and its side, as the facts and the sheet pictures show. A likeness to a known character or uniform is blocking.",
  "Anatomy and hands: each arm joins its own shoulder and ends in the hand of that side; five natural fingers on each visible hand. Merged or extra fingers that a viewer sees are blocking.",
  "Objects: count each object that the facts name; nothing doubled, nothing on the wrong side.",
  "The action can happen from here: the target of a contact is large in the frame, hands are large or out of the frame, and nothing on the list of known limits is asked of the clip.",
  "Every visible part is whole and clean: no lump or half drawn hand at an edge, no writing.",
  "The cut: with an end picture of the shot before, the same place, screen side, and facing.",
] as const;

function memberLines(members: CastMember[]): string[] {
  return members.map(
    (member) =>
      `- ${member.id} (${member.kind}), ${member.name}: ${member.description}. Fixed: ${(member.facts ?? []).join("; ") || "no facts"}${(member.briefFacts ?? []).length === 0 ? "" : `. From the person's brief: ${(member.briefFacts ?? []).join("; ")}`}`,
  );
}

export function startBriefOf(job: StartJob): string {
  const { shot } = job;
  return [
    `Review job: the start picture "${job.picture.id}" of the shot "${shot.id}". It becomes the exact first frame of the clip, so the clip can only be as good as this picture.`,
    "",
    "The plan of the shot:",
    `- Action: ${shot.action}`,
    `- Camera: ${shot.camera.size}, ${shot.camera.angle}${shot.camera.lens === undefined ? "" : `, ${shot.camera.lens} lens`}.`,
    `- Start: ${stateText(shot.startState)}`,
    "",
    "The cast in the shot and their fixed facts:",
    ...memberLines(job.members),
    ...planNoteSectionOf(job.openPlanFaults),
    "",
    "The known limits of the models:",
    ...knownLimitLinesOf([]),
    "",
    "The list (answer each item by its number):",
    ...startListItems.map(
      (...[item, index]) => `${String(index + 1)}. ${item}`,
    ),
    "",
    "Severity: put each fault that the clip cannot recover from in faults (blocking), and each difference that a viewer would not see in notes. Only a blocking fault fails the picture.",
    "",
    `Steps: 1. Call view_for_review with no input to see the start picture${job.previousEnd === undefined ? "" : ", the end of the shot before"}, and the sheets. 2. Look closer with asset_id and a region at each hand, face, and object. 3. Call give_start_review once with your whole answer. If it refuses, correct it and call again.`,
  ].join("\n");
}
