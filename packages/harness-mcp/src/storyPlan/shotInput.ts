import {
  cameraMoveIds,
  facings,
  hands,
  musicIntensityRange,
  screenSides,
  shotAngles,
  shotLenses,
  shotSecondsRange,
  shotSizes,
} from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../inputs.js";

const words = z.string().trim().min(1);

const stateEntryInput = z.strictObject({
  cast_id: idInput("A person or a prop of the shot."),
  count: z
    .int()
    .min(1)
    .max(99)
    .optional()
    .describe(
      "More than 1 only for a uniform group of copies of one design. Each opponent of a fight is better its own cast entry.",
    ),
  where: words.describe(
    "Where it is in the place, for example 'on the path, two steps in front of the giant tree' or 'high on the left branch'.",
  ),
  screen: z
    .enum(screenSides)
    .describe("Its side of the picture, or off when it is out of the shot."),
  facing: z.enum(facings).describe("Which way it faces in the picture."),
  held_by: z
    .strictObject({
      cast_id: idInput("The person who holds it."),
      hand: z.enum(hands),
    })
    .optional()
    .describe("For a prop in a hand: who holds it, and in which hand."),
  state: words.describe(
    "Its state, for example 'sheathed at his left hip', 'bare, raised high', 'crouched, claws spread'.",
  ),
  enters_from: words
    .optional()
    .describe(
      "Where it waited or how it enters, when it was not in the shot before.",
    ),
});

const strikeInput = z.strictObject({
  by: idInput("Who strikes."),
  target: idInput("The ONE target of the strike."),
  contact: words.describe("Where the blow lands, for example 'the left arm'."),
  reaction: words.describe(
    "What that target does, for example 'is thrown back and bursts into ink smoke'.",
  ),
  effect: z
    .strictObject({
      kind: words.describe("For example 'a wave of water'."),
      source: words.describe("Where it starts, for example 'the blade edge'."),
      path: words.describe("Where it travels, for example 'along the cut'."),
    })
    .optional()
    .describe("A drawn effect: it starts at its source and travels its path."),
});

export const shotInput = z.strictObject({
  shot_id: idInput("The id of the shot, for example 'strike'."),
  purpose: words.describe("Why the film needs this shot."),
  action: words.describe(
    "ONE action as a verb with its object, and what is different after it, for example 'she strikes the red steel and the blade bends'. Start inside the action.",
  ),
  place_id: idInput("The cast entry of kind place where the shot happens."),
  cast_ids: z
    .array(idInput("A person or a prop of the cast."))
    .describe("Each person and each prop that shows in the shot."),
  camera_size: z.enum(shotSizes).describe("How much the camera shows."),
  camera_angle: z.enum(shotAngles).describe("Where the camera looks from."),
  camera_lens: z
    .enum(shotLenses)
    .describe(
      "The lens feel: wide (deep space, speed), normal, or long (flat, soft background, a face).",
    ),
  camera_move: z
    .enum(cameraMoveIds)
    .optional()
    .describe("The camera move of the clip."),
  seconds: z
    .number()
    .min(shotSecondsRange.minimum)
    .max(shotSecondsRange.maximum)
    .describe("The length in seconds. One action fits 2 to 5 seconds."),
  start_state: z
    .array(stateEntryInput)
    .describe("One entry for each person and prop of the shot at the start."),
  end_state: z
    .array(stateEntryInput)
    .describe("One entry for each person and prop of the shot at the end."),
  inherits: z
    .string()
    .trim()
    .describe("What the next shot takes from this one. Empty only last."),
  strikes: z
    .array(strikeInput)
    .optional()
    .describe("Each strike of the shot, with its one target."),
  music_intensity: z
    .int()
    .min(musicIntensityRange.minimum)
    .max(musicIntensityRange.maximum)
    .describe("How strong the music is in this shot: 1 quiet to 5 the peak."),
  music_hits: z
    .array(z.number().min(0))
    .optional()
    .describe("Seconds inside the shot that the music marks: a strike, a cut."),
});

export type ShotInput = z.infer<typeof shotInput>;

export type StateEntryInput = z.infer<typeof stateEntryInput>;

export type StrikeInput = z.infer<typeof strikeInput>;
