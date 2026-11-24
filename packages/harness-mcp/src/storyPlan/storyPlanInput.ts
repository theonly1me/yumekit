import {
  cameraMoveIds,
  shotAngles,
  shotSecondsRange,
  shotSizes,
  type Shot,
  type StoryPlan,
} from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../inputs.js";

const shotInput = z.strictObject({
  shot_id: idInput("The id of the shot, for example 'strike'."),
  purpose: z
    .string()
    .trim()
    .min(1)
    .describe("Why the film needs this shot: what it tells or sets up."),
  action: z
    .string()
    .trim()
    .min(1)
    .describe(
      "ONE action as a verb with its object, and what is different after it, for example 'she strikes the red steel and the blade bends'. Never only a walk or a look, unless the walk itself changes something.",
    ),
  place_id: idInput(
    "The cast entry of kind place where the shot happens. Its sheet gives the floor plan.",
  ),
  cast_ids: z
    .array(idInput("A person or a prop of the cast."))
    .describe("Each person and each prop that shows in the shot."),
  camera_size: z.enum(shotSizes).describe("How much the camera shows."),
  camera_angle: z.enum(shotAngles).describe("Where the camera looks from."),
  camera_move: z
    .enum(cameraMoveIds)
    .optional()
    .describe(
      "The camera move of the clip. A video call for the shot uses it when the call gives none.",
    ),
  seconds: z
    .number()
    .min(shotSecondsRange.minimum)
    .max(shotSecondsRange.maximum)
    .describe(
      `The length of the shot in seconds, ${String(shotSecondsRange.minimum)} to ${String(shotSecondsRange.maximum)}. One action fits 3 to 6 seconds.`,
    ),
  start_state: z
    .string()
    .trim()
    .min(1)
    .describe(
      "Where each person and object is at the start: which hand holds what, which doors are open, what is lit.",
    ),
  end_state: z
    .string()
    .trim()
    .min(1)
    .describe("The same facts at the end of the shot."),
  inherits: z
    .string()
    .trim()
    .describe(
      "What the next shot takes from this one, for example 'the bent blade, still glowing, in her right hand'. Empty only for the last shot.",
    ),
});

export const setStoryPlanInput = {
  logline: z
    .string()
    .trim()
    .min(1)
    .describe("The story in one sentence: who wants what, and what happens."),
  want: z.string().trim().min(1).describe("What the main character wants."),
  obstacle: z.string().trim().min(1).describe("What stands against it."),
  change: z.string().trim().min(1).describe("What is different at the end."),
  shots: z
    .array(shotInput)
    .min(1)
    .max(40)
    .describe(
      "The shots in film order. Each shot follows from the one before: cause and effect.",
    ),
};

type SetStoryPlanInput = z.infer<z.ZodObject<typeof setStoryPlanInput>>;

type ShotInput = z.infer<typeof shotInput>;

function shotOf(options: {
  input: ShotInput;
  earlier: Shot | undefined;
}): Shot {
  const { input, earlier } = options;
  return {
    id: input.shot_id,
    purpose: input.purpose,
    action: input.action,
    placeId: input.place_id,
    castIds: input.cast_ids,
    camera: {
      size: input.camera_size,
      angle: input.camera_angle,
      ...(input.camera_move === undefined ? {} : { move: input.camera_move }),
    },
    seconds: input.seconds,
    startState: input.start_state,
    endState: input.end_state,
    inherits: input.inherits,
    ...(earlier?.reviews === undefined ? {} : { reviews: earlier.reviews }),
  };
}

export function storyPlanOf(options: {
  input: SetStoryPlanInput;
  earlier: StoryPlan | undefined;
}): StoryPlan {
  const { input } = options;
  return {
    logline: input.logline,
    want: input.want,
    obstacle: input.obstacle,
    change: input.change,
    shots: input.shots.map((shot) =>
      shotOf({
        input: shot,
        earlier: options.earlier?.shots.find(
          (candidate) => candidate.id === shot.shot_id,
        ),
      }),
    ),
  };
}

export function repeatedShotIdOf(input: SetStoryPlanInput): string | undefined {
  const seen = new Set<string>();
  for (const shot of input.shots) {
    if (seen.has(shot.shot_id)) return shot.shot_id;
    seen.add(shot.shot_id);
  }
  return undefined;
}
