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
  "Story: each shot has ONE action with a result, and each shot follows from the one before.",
  "Facts: each fact is something a picture can show. A bare number or a ratio ('twice his width', 'a little taller') is a fault: ask for a visual comparison. A fact that drops or changes the meaning of a fact from the person's brief is blocking.",
  "Design: each person names each garment with its color and cut, the hair, the face, and what the design must NOT resemble. A design thin enough that the model will borrow a known character, uniform, or costume of an existing work is a fault.",
  "Known limits: a pose, a shot, or a sheet on the list of known limits, written without the form that works, is a fault.",
  "One action, a clear frame: a shot with more than one action, or too much in the frame for its length and size, is a fault.",
  "Prompts: each prompt describes every part that will be visible (each garment, each hand, the ground, what moves in the background), agrees with its shot, its start state, its camera, and the facts, and has no simile that the model could draw ('a head like a stone lantern').",
  "Places: no fact of a place that a later shot contradicts, and each shot in a place fits its floor plan.",
  "Restrictions: no shot breaks a restriction of a sheet.",
] as const;

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
    "Steps: 1. Read the whole plan. 2. For each shot, give its difficulty from 1 (easy for the models) to 5 (likely to fail), the ids of the known limits it touches, its blocking faults, and its notes. 3. For each cast entry, its blocking faults and its notes. 4. Name the easiest and the hardest shot. 5. Call give_plan_review once with your whole answer. If it refuses, correct it and call again.",
  ].join("\n");
}
