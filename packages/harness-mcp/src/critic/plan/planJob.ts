import type { CastMember, Lesson, Shot, StoryPlan } from "@yumekit/project";
import { knownLimitLinesOf } from "../../storyGuide/knownLimits.js";
import { stateText, strikeText } from "../../storyPlan/stateText.js";
import type { PlanAnswer } from "./planAnswerInput.js";
import type { PlanFinding } from "./planFindings.js";

export interface PlanJob {
  kind: "plan";
  plan: StoryPlan;
  members: CastMember[];
  style: string;
  findings: PlanFinding[];
  planKey: string;
  answer: PlanAnswer | undefined;
}

export const planListItems = [
  "Story: each shot has ONE action with a result, and each shot follows from the one before. A shot with more than one action, or too much in the frame, is a note. Two shots in a row that show one unbroken action from one camera need continues_shot on the second; a missing one is a note.",
  "Brief: no fact and no prompt changes or drops a fact of the person's brief. Each one that does goes in brief_faults, with the exact brief fact and the exact text to restore. This is blocking (kind a).",
  "Design: each person names each garment with its color and cut, the hair, the face, and what the design must NOT resemble. A thin design or a likeness to a known work is a note; the sheet review judges the picture.",
  "Known limits: a pose, a shot, or a sheet on the list of known limits, or a fact given as a bare number or a ratio (the limit of exact scale), written with no form that works, is blocking (kind c). The same limit written in its working form is fine.",
  "Strikes and effects: each strike shows its contact on screen, and each effect has a named source on screen. A strike with no contact or an effect with no source is blocking (kind d).",
  "Prompts: a prompt that contradicts itself is blocking (kind b). A prompt that leaves a visible part undescribed, or that differs a little from its shot or the facts, is a note, unless it is a known limit.",
  "Places: a place fact that a later shot contradicts is a note, unless the fact comes from the person's brief.",
  "Restrictions: a shot that breaks a restriction of a sheet is blocking (kind c), because a restriction is a known limit of that sheet.",
] as const;

export const planStrictnessRule =
  "Strictness: a blocking fault is only (a) a contradiction with a fact of the person's brief, (b) a prompt that contradicts itself, (c) a known limit (or a restriction of a sheet) with no working form used, or (d) a strike or an effect with no contact or source. Everything else is a note. At most 3 blocking faults for one shot: keep the 3 most likely to fail and put the rest in notes. A finding of the word test is a fault only when it is one of these four kinds.";

function memberLines(member: CastMember): string[] {
  return [
    `- ${member.id} (${member.kind}), ${member.name}: ${member.description}`,
    `  Facts: ${(member.facts ?? []).join("; ") || "none"}`,
    ...((member.briefFacts ?? []).length === 0
      ? []
      : [
          `  From the person's brief (protected): ${(member.briefFacts ?? []).join("; ")}`,
        ]),
    ...(member.sheetPrompts ?? []).map(
      (...[prompt, index]) =>
        `  Sheet prompt ${String(index + 1)}: "${prompt}"`,
    ),
    ...((member.restrictions ?? []).length === 0
      ? []
      : [`  Restrictions: ${(member.restrictions ?? []).join("; ")}`]),
  ];
}

function shotLines(options: { shot: Shot; number: number }): string[] {
  const { shot } = options;
  const strikes = (shot.strikes ?? []).map(strikeText);
  const camera = [
    shot.camera.size,
    shot.camera.angle,
    shot.camera.lens,
    shot.camera.move,
  ]
    .filter((part) => part !== undefined)
    .join(", ");
  return [
    `Shot ${String(options.number)} "${shot.id}", ${String(shot.seconds)} seconds, camera ${camera}, place ${shot.placeId}, cast ${shot.castIds.join(", ") || "none"}`,
    `  Action: ${shot.action}`,
    shot.continuesShotId === undefined
      ? "  Starts: a cut, on its own start picture"
      : `  Starts: on the last frame of "${shot.continuesShotId}", with the same camera`,
    `  Start: ${stateText(shot.startState)}`,
    `  End: ${stateText(shot.endState)}`,
    ...(strikes.length === 0 ? [] : [`  Strikes: ${strikes.join(" | ")}`]),
    `  Start picture prompt: "${shot.startPicturePrompt ?? ""}"`,
    `  Video prompt: "${shot.videoPrompt ?? ""}"`,
  ];
}

function learnedLimitsOf(lessons: Lesson[] | undefined): Lesson[] {
  return (lessons ?? []).filter((lesson) => lesson.isLimit);
}

export function planBriefOf(job: PlanJob): string {
  const { plan } = job;
  return [
    `Review job: the plan of the film, before any paid picture or clip. It has ${String(plan.shots.length)} shots.`,
    "",
    `Story: ${plan.logline} Wants: ${plan.want} In the way: ${plan.obstacle} By the end: ${plan.change}`,
    `Art direction (added to each prompt): ${job.style || "none"}`,
    "",
    "The cast, with the prompt of each sheet picture:",
    ...job.members.flatMap(memberLines),
    "",
    "The shots in film order, with the prompts the lead will send:",
    ...plan.shots.flatMap((...[shot, index]) =>
      shotLines({ shot, number: index + 1 }),
    ),
    "",
    "The known limits of the picture and video models:",
    ...knownLimitLinesOf(learnedLimitsOf(plan.lessons)),
    "",
    "The findings of the word test (answer each one by its number):",
    job.findings.length === 0
      ? "No findings."
      : job.findings
          .map((...[finding, index]) => `${String(index + 1)}. ${finding.text}`)
          .join("\n"),
    "",
    "The list (answer each item by its number):",
    ...planListItems.map((...[item, index]) => `${String(index + 1)}. ${item}`),
    "",
    planStrictnessRule,
    "",
    "Steps: 1. Read the whole plan. 2. For each shot, give its difficulty from 1 (easy for the models) to 5 (likely to fail), the ids of the known limits it touches, at most 3 blocking faults, and its notes. 3. For each cast entry, its blocking faults and its notes. 4. Put each break of a brief fact in brief_faults. 5. Name the easiest and the hardest shot. 6. Call give_plan_review once with your whole answer. If it refuses, correct it and call again.",
  ].join("\n");
}
