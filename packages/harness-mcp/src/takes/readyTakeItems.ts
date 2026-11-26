import {
  cutItemId,
  storyItemId,
  takeTextLimit,
  type ProjectSnapshot,
  type Take,
  type TakeItem,
} from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../inputs.js";
import type { HarnessFailure, Outcome } from "../results.js";

const leadText = z.string().trim().min(1).max(takeTextLimit);

export const readyTakeInput = {
  items: z
    .array(
      z.object({
        id: z
          .string()
          .min(1)
          .max(64)
          .describe(
            `The item: an asset id of the take or an earlier asset to show in it, "${storyItemId}" for the story, or "${cutItemId}" for the cut.`,
          ),
        note: leadText.describe(
          "Your honest note for the person, one to three short sentences: what it shows, and the fault that you see or suspect, so the person knows where to look.",
        ),
        what_to_check: leadText
          .optional()
          .describe(
            "For a clip, music, or the cut: what the person must watch or listen for, with the seconds, because you cannot watch motion or hear sound.",
          ),
        replaces_asset_id: idInput(
          "The asset of an earlier take that this item makes again.",
        ).optional(),
      }),
    )
    .min(1)
    .max(100)
    .describe("Your note on each item of the take."),
  leave_out: z
    .array(idInput("An asset id."))
    .optional()
    .describe("Assets of the take that the person does not need to see."),
  next_step_estimate_usd: z
    .number()
    .min(0)
    .optional()
    .describe(
      "Your estimate in US dollars of the next step. The harness computes it from the prices and the shots of the chapter where it can.",
    ),
};

export type ReadyTakeInput = z.infer<z.ZodObject<typeof readyTakeInput>>;

type ItemInput = ReadyTakeInput["items"][number];

function needsCheck(options: {
  item: TakeItem;
  snapshot: ProjectSnapshot;
}): boolean {
  const { item } = options;
  if (item.kind === "cut") return true;
  if (item.kind !== "asset") return false;
  const asset = options.snapshot.assets.find(
    (candidate) => candidate.id === item.id,
  );
  return asset?.kind === "video" || asset?.kind === "audio";
}

function baseItemOf(options: {
  input: ItemInput;
  take: Take;
  snapshot: ProjectSnapshot;
}): TakeItem | undefined {
  const { input, take, snapshot } = options;
  const existing = take.items.find((item) => item.id === input.id);
  if (existing !== undefined) return existing;
  if (input.id === storyItemId && take.step === "story") {
    return snapshot.bible.story === undefined
      ? undefined
      : { kind: "story", id: storyItemId };
  }
  return snapshot.assets.some((asset) => asset.id === input.id)
    ? { kind: "asset", id: input.id }
    : undefined;
}

function withNote(options: { item: TakeItem; input: ItemInput }): TakeItem {
  const { item, input } = options;
  const note = { note: input.note };
  const check =
    input.what_to_check === undefined
      ? {}
      : { whatToCheck: input.what_to_check };
  switch (item.kind) {
    case "story":
      return { ...item, ...note };
    case "cut":
      return { ...item, ...note, ...check };
    case "asset":
      return {
        ...item,
        ...note,
        ...check,
        ...(input.replaces_asset_id === undefined
          ? {}
          : { replaces: input.replaces_asset_id }),
      };
  }
}

function missingFailure(options: {
  message: string;
  hint: string;
}): Outcome<TakeItem[], HarnessFailure> {
  return { ok: false, failure: { kind: "take-not-ready", ...options } };
}

export function readyItemsOf(options: {
  take: Take;
  snapshot: ProjectSnapshot;
  input: ReadyTakeInput;
}): Outcome<TakeItem[], HarnessFailure> {
  const { take, snapshot, input } = options;
  const notes = new Map(input.items.map((item) => [item.id, item]));
  const unknown = input.items.filter(
    (item) => baseItemOf({ input: item, take, snapshot }) === undefined,
  );
  if (unknown.length > 0) {
    return {
      ok: false,
      failure: {
        kind: "item-not-found",
        message: `The take has no item ${unknown.map((item) => `"${item.id}"`).join(", ")}, and no asset has that id.`,
        hint: "Call get_work to see the open take and its items.",
      },
    };
  }
  const leftOut = new Set(input.leave_out ?? []);
  const items = [
    ...take.items,
    ...input.items.flatMap((item) => {
      const added = baseItemOf({ input: item, take, snapshot });
      return added === undefined || take.items.includes(added) ? [] : [added];
    }),
  ].filter((item) => !leftOut.has(item.id));
  const order = input.items.map((item) => item.id);
  const noted = items
    .map((item) => {
      const given = notes.get(item.id);
      return given === undefined ? item : withNote({ item, input: given });
    })
    .toSorted(
      (...[first, second]) =>
        order.indexOf(first.id) - order.indexOf(second.id),
    );
  const unnoted = noted.filter((item) => item.note === undefined);
  const unchecked = noted.filter(
    (item) =>
      item.kind !== "story" &&
      item.whatToCheck === undefined &&
      needsCheck({ item, snapshot }),
  );
  if (noted.length === 0) {
    return missingFailure({
      message: "The take has no item for the person.",
      hint: `Make the work of the round first. A take of the story has the item "${storyItemId}", and a take of the cut needs render_video with chapter_id.`,
    });
  }
  if (unnoted.length > 0 || unchecked.length > 0) {
    return missingFailure({
      message:
        `${unnoted.length === 0 ? "" : `No note on ${unnoted.map((item) => `"${item.id}"`).join(", ")}. `}${unchecked.length === 0 ? "" : `No what_to_check on ${unchecked.map((item) => `"${item.id}"`).join(", ")}.`}`.trim(),
      hint: "Give a note for each item, and what_to_check for each clip, music, and cut. Use leave_out for an asset that the person does not need to see.",
    });
  }
  return { ok: true, value: noted };
}
