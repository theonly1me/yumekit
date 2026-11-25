import {
  filmForms,
  musicIntensityRange,
  type Shot,
  type StateEntry,
  type StoryPlan,
  type Strike,
} from "@yumekit/project";
import { z } from "zod";
import {
  shotInput,
  type ShotInput,
  type StateEntryInput,
  type StrikeInput,
} from "./shotInput.js";

export const setStoryPlanInput = {
  form: z
    .enum(filmForms)
    .optional()
    .describe(
      "The form of the film, which decides its structure: trailer (moments of a longer story, raises a question and never answers it), short (one complete small story with an end), explainer, music-video, or other. get_story_guide gives the craft of each.",
    ),
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
    .describe("The shots in film order, each caused by the one before."),
  music_end_intensity: z
    .int()
    .min(musicIntensityRange.minimum)
    .max(musicIntensityRange.maximum)
    .optional()
    .describe("How strong the music is under the end card, 1 to 5."),
};

export type SetStoryPlanInput = z.infer<z.ZodObject<typeof setStoryPlanInput>>;

function entryOf(input: StateEntryInput): StateEntry {
  return {
    castId: input.cast_id,
    ...(input.count === undefined ? {} : { count: input.count }),
    where: input.where,
    screen: input.screen,
    facing: input.facing,
    ...(input.held_by === undefined
      ? {}
      : {
          heldBy: { castId: input.held_by.cast_id, hand: input.held_by.hand },
        }),
    state: input.state,
    ...(input.enters_from === undefined
      ? {}
      : { entersFrom: input.enters_from }),
  };
}

function strikeOf(input: StrikeInput): Strike {
  return {
    by: input.by,
    target: input.target,
    contact: input.contact,
    reaction: input.reaction,
    ...(input.effect === undefined ? {} : { effect: input.effect }),
  };
}

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
      lens: input.camera_lens,
      ...(input.camera_move === undefined ? {} : { move: input.camera_move }),
    },
    seconds: input.seconds,
    startState: input.start_state.map(entryOf),
    endState: input.end_state.map(entryOf),
    inherits: input.inherits,
    ...(input.continues_shot === undefined
      ? {}
      : { continuesShotId: input.continues_shot }),
    ...(input.strikes === undefined
      ? {}
      : { strikes: input.strikes.map(strikeOf) }),
    musicIntensity: input.music_intensity,
    ...(input.music_hits === undefined ? {} : { musicHits: input.music_hits }),
    startPicturePrompt: input.start_picture_prompt,
    videoPrompt: input.video_prompt,
    ...(earlier?.reviews === undefined ? {} : { reviews: earlier.reviews }),
    ...(earlier?.planNotes === undefined
      ? {}
      : { planNotes: earlier.planNotes }),
    ...(input.story_fact === undefined ? {} : { storyFact: input.story_fact }),
  };
}

export function storyPlanOf(options: {
  input: SetStoryPlanInput;
  earlier: StoryPlan | undefined;
}): StoryPlan {
  const { input, earlier } = options;
  return {
    ...(input.form === undefined ? {} : { form: input.form }),
    logline: input.logline,
    want: input.want,
    obstacle: input.obstacle,
    change: input.change,
    shots: input.shots.map((shot) =>
      shotOf({
        input: shot,
        earlier: earlier?.shots.find(
          (candidate) => candidate.id === shot.shot_id,
        ),
      }),
    ),
    ...(input.music_end_intensity === undefined
      ? {}
      : { musicEndIntensity: input.music_end_intensity }),
    ...(earlier?.musicChecks === undefined
      ? {}
      : { musicChecks: earlier.musicChecks }),
    ...(earlier?.review === undefined ? {} : { review: earlier.review }),
    ...(earlier?.lessons === undefined ? {} : { lessons: earlier.lessons }),
    ...(earlier?.failedPlanChecks === undefined
      ? {}
      : { failedPlanChecks: earlier.failedPlanChecks }),
    ...(earlier?.planNotes === undefined
      ? {}
      : { planNotes: earlier.planNotes }),
  };
}
