import {
  musicIntensityRange,
  type Shot,
  type StateEntry,
  type StoryPlan,
  type Strike,
} from "@yumekit/project";
import { z } from "zod";
import type { HarnessFailure } from "../results.js";
import {
  shotInput,
  type ShotInput,
  type StateEntryInput,
  type StrikeInput,
} from "./shotInput.js";

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
    .describe("The shots in film order, each caused by the one before."),
  music_end_intensity: z
    .int()
    .min(musicIntensityRange.minimum)
    .max(musicIntensityRange.maximum)
    .optional()
    .describe("How strong the music is under the end card, 1 to 5."),
};

type SetStoryPlanInput = z.infer<z.ZodObject<typeof setStoryPlanInput>>;

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
  };
}

export function storyPlanOf(options: {
  input: SetStoryPlanInput;
  earlier: StoryPlan | undefined;
}): StoryPlan {
  const { input, earlier } = options;
  return {
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

function stateIssuesOf(shot: ShotInput): string[] {
  const named = new Set(shot.cast_ids);
  return (["start_state", "end_state"] as const).flatMap((key) => {
    const ids = shot[key].map((entry) => entry.cast_id);
    const missing = shot.cast_ids.filter((id) => !ids.includes(id));
    const extra = ids.filter((id) => !named.has(id));
    const twice = ids.filter((...[id, index]) => ids.indexOf(id) !== index);
    return [
      ...missing.map(
        (id) => `${shot.shot_id}.${key} has no entry for "${id}".`,
      ),
      ...extra.map(
        (id) =>
          `${shot.shot_id}.${key} has "${id}", which cast_ids does not name.`,
      ),
      ...twice.map((id) => `${shot.shot_id}.${key} has "${id}" twice.`),
    ];
  });
}

export function planRefusalOf(
  input: SetStoryPlanInput,
): HarnessFailure | undefined {
  const seen = new Set<string>();
  for (const shot of input.shots) {
    if (seen.has(shot.shot_id)) {
      return {
        kind: "id-in-use",
        message: `The plan has the shot id "${shot.shot_id}" twice.`,
        hint: "Give each shot its own id.",
      };
    }
    if (shot.continues_shot !== undefined && !seen.has(shot.continues_shot)) {
      return {
        kind: "invalid-value",
        message: `Shot "${shot.shot_id}" continues "${shot.continues_shot}", which is not an earlier shot of the plan.`,
        hint: "Give continues_shot the id of an earlier shot whose last frame this shot continues with the same camera. Leave it out for a cut.",
      };
    }
    seen.add(shot.shot_id);
  }
  const issues = input.shots.flatMap(stateIssuesOf);
  if (issues.length === 0) return undefined;
  return {
    kind: "state-incomplete",
    message: `Each start and end state needs one entry for each person and prop of the shot: ${issues.join(" ")}`,
    hint: "Give one entry for each id of cast_ids in start_state and in end_state: where, screen, facing, held_by for a prop in a hand, and state. Name each person once; never join two characters in one entry.",
  };
}
