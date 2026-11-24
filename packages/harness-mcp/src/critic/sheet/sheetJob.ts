import { sheetVerdicts, type Asset, type CastMember } from "@yumekit/project";
import { z } from "zod";
import type { HarnessContext } from "../../context.js";
import type { HarnessFailure, Outcome } from "../../results.js";
import { checkAnswerInput, countInput } from "../clip/clipAnswerInput.js";
import { joinedContent, pictureOf, type Content } from "../criticPictures.js";
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
    .describe("pass (the sheet can fix the look of the film) or fail."),
  faults: z
    .array(z.string().trim().min(1))
    .describe("Each fault in plain words. Empty only for pass."),
};

export type SheetAnswer = z.output<z.ZodObject<typeof sheetAnswerInput>>;

export interface SheetJob {
  kind: "sheet";
  member: CastMember;
  pictures: Asset[];
  holds: string[];
  answer: SheetAnswer | undefined;
}

export function sheetListOf(job: SheetJob): string[] {
  const hands =
    job.holds.length === 0
      ? "Hands: five natural fingers on each hand that shows."
      : `Hands: one picture shows the hands holding ${job.holds.join(", ")}, with five natural fingers and the grip of the facts.`;
  return [
    "One of each: count each object that the facts name. A prop shows ONE object. Two states of a prop (sheathed and bare) are two entries, or the facts name the picture as two views of one object, with a rule for where the scabbard is when the blade is out.",
    "Facts: each fact holds in each picture: the side of each mark, the hand, the fingers, each color and garment.",
    "Body and scale: a person shows the full body with both feet, and the height against the hero that the facts give. A place shows the floor plan of its facts.",
    "Design: the entry has its own design and personality (build, face, clothes, weapon, the way it moves and fights), not a copy of another entry. A villain shows the threat that the facts name (scale against the hero, stillness, what he does to the space around him). A design that reads as weak or silly is a fault.",
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
    `Pictures: ${job.pictures.map((asset) => asset.id).join(", ")}`,
    "",
    "The list (answer each item by its number):",
    ...sheetListOf(job).map(
      (...[item, index]) => `${String(index + 1)}. ${item}`,
    ),
    "",
    "Steps: 1. Call view_for_review with no input to see each picture. 2. Look closer with asset_id and a region at each hand, face, mark, and object. 3. Call give_sheet_review once with your whole answer. If it refuses, correct it and call again.",
  ].join("\n");
}

export function sheetAnswerIssuesOf(options: {
  job: SheetJob;
  answer: SheetAnswer;
}): string[] {
  const { job, answer } = options;
  const items = new Set(answer.checks.map((check) => check.item));
  const missing = sheetListOf(job).flatMap((...[, index]) =>
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
      ? ["A pass has no faults. Give fail with the faults."]
      : []),
    ...answer.counts.flatMap((count) =>
      count.seen === count.expected
        ? []
        : [
            `The count of ${count.object} differs (${String(count.seen)}, not ${String(count.expected)}), so the sheet fails.`,
          ],
    ),
  ];
}

export function sheetViewOf(options: {
  context: HarnessContext;
  job: SheetJob;
  look: CriticLook;
}): Promise<Outcome<Content, HarnessFailure>> {
  const { context, job, look } = options;
  if (look.asset_id === undefined) {
    return joinedContent(
      job.pictures.map((asset) =>
        pictureOf({
          context,
          asset,
          label: `The sheet picture "${asset.id}"`,
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
        message: `"${look.asset_id}" is not a picture of this sheet.`,
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
