import { z } from "zod";
import { idInput } from "../../inputs.js";
import { regionInput } from "../../media/markInputs.js";
import type { HarnessFailure, Outcome } from "../../results.js";
import { designFrameInput } from "./designAnswer.js";

export const mostDesignChecksTogether = 12;

const targetInput = z.strictObject({
  asset_id: idInput("The picture or the clip of a shot to check."),
  shot_id: idInput("The shot of the story plan that it shows."),
});

export const checkDesignInput = {
  asset_id: idInput(
    "One picture or clip of a shot to check. For a batch, give assets.",
  ).optional(),
  shot_id: idInput("The shot of asset_id.").optional(),
  assets: z
    .array(targetInput)
    .min(1)
    .max(mostDesignChecksTogether)
    .optional()
    .describe(
      `A batch: up to ${String(mostDesignChecksTogether)} pictures or clips, each with its shot. One call gives the brief of all of them, and one call with design stores one check for each.`,
    ),
  cast_id: idInput(
    "To look: the person to crop, with asset_id, shot_id, region, and seconds (a clip).",
  ).optional(),
  region: regionInput
    .optional()
    .describe("The part of the frame with the person, as shares from 0 to 1."),
  seconds: z
    .number()
    .min(0)
    .optional()
    .describe("For a clip: the time of the frame to crop."),
  design: z
    .array(designFrameInput)
    .optional()
    .describe(
      "To store: your whole answer, one entry for each person and each frame of the list. With assets, each entry names its asset_id.",
    ),
};

export interface DesignTargetInput {
  asset_id: string;
  shot_id: string;
}

export function targetsOf(input: {
  asset_id?: string | undefined;
  shot_id?: string | undefined;
  assets?: DesignTargetInput[] | undefined;
}): Outcome<DesignTargetInput[], HarnessFailure> {
  const { asset_id, shot_id, assets } = input;
  if (assets !== undefined && asset_id === undefined && shot_id === undefined) {
    return { ok: true, value: assets };
  }
  if (assets === undefined && asset_id !== undefined && shot_id !== undefined) {
    return { ok: true, value: [{ asset_id, shot_id }] };
  }
  return {
    ok: false,
    failure: {
      kind: "invalid-value",
      message:
        "check_design takes asset_id with shot_id for one picture or clip, or assets for a batch.",
      hint: "Give asset_id and shot_id, or assets with each asset_id and its shot_id.",
    },
  };
}
