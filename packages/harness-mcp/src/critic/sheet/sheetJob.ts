import { sheetVerdicts, type Asset, type CastMember } from "@yumekit/project";
import { z } from "zod";
import type { HarnessContext } from "../../context.js";
import type { HarnessFailure, Outcome } from "../../results.js";
import { checkAnswerInput, countInput } from "../clip/clipAnswerInput.js";
import { joinedContent, pictureOf, type Content } from "../criticPictures.js";
import { designInput } from "../design/designAnswer.js";
import { designBriefLinesOf } from "../design/designBrief.js";
import type { DesignJob } from "../design/designJob.js";
import type { CriticLook } from "../clip/clipViews.js";

export const sheetAnswerInput = {
  checks: z
    .array(checkAnswerInput)
    .describe("One answer for each item of the list."),
  counts: z
    .array(countInput)
    .describe(
      "A count for each object that the facts name: the prop, swords, hands, fingers, eyes, horns.",
    ),
  verdict: z
    .enum(sheetVerdicts)
    .describe(
      "pass (no blocking fault: the sheet can fix the look of the film) or fail.",
    ),
  faults: z
    .array(z.string().trim().min(1))
    .describe(
      "Each BLOCKING fault in plain words: the film cannot use this. Empty only for pass.",
    ),
  notes: z
    .array(z.string().trim().min(1))
    .default([])
    .describe(
      "Each difference that a viewer would not see, or that the next step can absorb. Notes do not fail the sheet.",
    ),
  design: designInput,
};

export type SheetAnswer = z.output<z.ZodObject<typeof sheetAnswerInput>>;

export interface SheetJob {
  kind: "sheet";
  member: CastMember;
  pictures: Asset[];
  holds: string[];
  lookLines: string[];
  design: DesignJob | undefined;
  answer: SheetAnswer | undefined;
}

export function sheetListOf(job: SheetJob): string[] {
  const hands =
    job.holds.length === 0
      ? "Hands: five natural fingers on each hand that shows. Merged or extra fingers that a viewer sees are blocking."
      : `Hands: one picture shows the hands holding ${job.holds.join(", ")}, with five natural fingers and the grip of the facts. Merged or extra fingers that a viewer sees are blocking.`;
  return [
    "One of each: count each object that the facts name. A prop shows ONE object. Two states of a prop (sheathed and bare) are two entries, or the facts name the picture as two views of one object, with a rule for where the scabbard is when the blade is out.",
    "Facts: each fact holds in each picture: the side of each mark, the hand, the fingers, each color and garment. Judge a size or a shade by eye: a small difference is a note.",
    "Body and scale: a person shows the full body with both feet, and the height against the hero that the facts give. A height that differs a little is a note; another size class (a giant drawn at the hero's size) is blocking. A place shows the floor plan of its facts.",
    "Anatomy: count the arms, legs, hands, and fingers of each body. Each arm joins its own shoulder, the hand at its end is the hand of that side, elbows and wrists bend the way a body bends, and two arms never cross through each other or the body. A mirrored picture (the sword on the wrong hip, the wrong hand on the grip) is blocking.",
    "Design: the entry has its own design and personality (build, face, clothes, weapon, the way it moves and fights), not a copy of another entry. A villain shows the threat that the facts name (scale against the hero, stillness, what he does to the space around him). A design that reads as weak or silly is blocking.",
    "Likeness: does the design look like a known character, uniform, or costume of an existing work? A likeness is blocking: name the parts that match (for example a buttoned black uniform jacket, a badge, a patterned coat over it).",
    hands,
    "Style and writing: the art direction of the film, and no writing.",
  ];
}

export function sheetBriefOf(job: SheetJob): string {
  const { member } = job;
  return [
    `Review job: the sheet of the cast entry "${member.id}" (${member.kind}), ${member.name}.`,
    `Description: ${member.description}`,
    `Fixed facts: ${(member.facts ?? []).join("; ") || "none"}`,
    ...((member.briefFacts ?? []).length === 0
      ? []
      : [
          `From the person's brief, which wins over the facts: ${(member.briefFacts ?? []).join("; ")}`,
        ]),
    ...job.lookLines,
    `Pictures: ${job.pictures.map((asset) => asset.id).join(", ")}`,
    "",
    "The list (answer each item by its number):",
    ...sheetListOf(job).map(
      (...[item, index]) => `${String(index + 1)}. ${item}`,
    ),
    ...designBriefLinesOf({
      job: job.design,
      viewTool: "view_for_review",
      answerIn: "design of your answer",
    }),
    "",
    "Severity: put each fault that the film cannot use in faults (blocking), and each difference that a viewer would not see in notes. Only a blocking fault fails the sheet.",
    "",
    "Steps: 1. Call view_for_review with no input to see each picture. 2. Look closer with asset_id and a region at each hand, arm, face, mark, and object. 3. Call give_sheet_review once with your whole answer. If it refuses, correct it and call again.",
  ].join("\n");
}

export function sheetAnswerIssuesOf(options: {
  job: SheetJob;
  answer: SheetAnswer;
}): string[] {
  return listAnswerIssuesOf({
    itemCount: sheetListOf(options.job).length,
    answer: options.answer,
  });
}

export function listAnswerIssuesOf(options: {
  itemCount: number;
  answer: SheetAnswer;
}): string[] {
  const { answer } = options;
  const items = new Set(answer.checks.map((check) => check.item));
  const missing = Array.from({ length: options.itemCount }).flatMap(
    (...[, index]) =>
      items.has(index + 1)
        ? []
        : [`Answer item ${String(index + 1)} of the list in checks.`],
  );
  if (answer.verdict === "fail") {
    return answer.faults.length === 0
      ? [...missing, "A fail names its faults."]
      : missing;
  }
  return [
    ...missing,
    ...(answer.faults.length > 0
      ? [
          "A pass has no blocking faults. Move a difference that a viewer would not see to notes, or give fail.",
        ]
      : []),
    ...answer.counts.flatMap((count) =>
      count.seen === count.expected
        ? []
        : [
            `The count of ${count.object} differs (${String(count.seen)}, not ${String(count.expected)}), so it fails.`,
          ],
    ),
  ];
}

export function sheetViewOf(options: {
  context: HarnessContext;
  job: { pictures: Asset[] };
  look: CriticLook;
}): Promise<Outcome<Content, HarnessFailure>> {
  const { context, job, look } = options;
  if (look.asset_id === undefined) {
    return joinedContent(
      job.pictures.map((asset) =>
        pictureOf({
          context,
          asset,
          label: `The picture "${asset.id}"`,
          region: look.region,
        }),
      ),
    );
  }
  const asset = job.pictures.find(
    (candidate) => candidate.id === look.asset_id,
  );
  if (asset === undefined) {
    return Promise.resolve({
      ok: false,
      failure: {
        kind: "not-in-review",
        message: `"${look.asset_id}" is not a picture of this review.`,
        hint: `Look at one of: ${job.pictures.map((candidate) => candidate.id).join(", ")}.`,
      },
    });
  }
  return pictureOf({
    context,
    asset,
    label: `A closer look at "${asset.id}"`,
    region: look.region,
  });
}
