import { z } from "zod";
import { engineRequest } from "./mediaTestTools.js";
import { scenesRowClipsOf } from "./projectFacts.js";
import type { RunningEngine } from "./runEngine.js";

export const filmChapters = [
  { chapter_id: "harbor", title: "The harbor", shot_ids: ["a", "b"] },
  { chapter_id: "fog", title: "Into the fog", shot_ids: ["c", "d"] },
  { chapter_id: "island", title: "The island", shot_ids: ["e", "f"] },
];

const shotIds = filmChapters.flatMap((chapter) => chapter.shot_ids);

function shotOf(shotId: string) {
  return {
    shot_id: shotId,
    purpose: `Show ${shotId}.`,
    action: `The ferry moves in shot ${shotId}`,
    place_id: "strait",
    cast_ids: [],
    camera_size: "wide",
    camera_angle: "eye-level",
    camera_lens: "normal",
    music_intensity: 2,
    seconds: 2,
    start_state: [],
    end_state: [],
    inherits: "",
    start_picture_prompt: `Shot ${shotId}`,
    video_prompt: `Shot ${shotId}`,
  };
}

async function makeShot(options: { engine: RunningEngine; shotId: string }) {
  const { engine, shotId } = options;
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: `${shotId}-start`,
      capability: "image",
      shot_id: shotId,
      input: { prompt: `Shot ${shotId}`, width_pixels: 64, height_pixels: 36 },
    },
  });
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: `${shotId}-clip`,
      capability: "video",
      shot_id: shotId,
      first_frame_asset_id: `${shotId}-start`,
      person_chose_this_picture: "I chose this picture.",
      input: { prompt: `Shot ${shotId}`, duration_seconds: 2 },
    },
  });
  await engine.callTool({
    name: "place_video",
    input: {
      output_id: "wide",
      asset_id: `${shotId}-clip`,
      start_frame: shotIds.indexOf(shotId) * 60,
      duration_frames: 60,
      sound_gain_decibels: "off",
    },
  });
}

export async function buildChapterFilm(engine: RunningEngine): Promise<void> {
  await engine.callTool({
    name: "set_video_style",
    input: { video_style: "ai-video" },
  });
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "strait-sheet",
      capability: "image",
      input: { prompt: "The strait", width_pixels: 64, height_pixels: 36 },
    },
  });
  await engine.callTool({
    name: "put_cast_member",
    input: {
      cast_id: "strait",
      kind: "place",
      name: "The strait",
      description: "A cold strait",
      facts: ["The harbor is on the left"],
      reference_asset_ids: ["strait-sheet"],
    },
  });
  await engine.callTool({
    name: "set_story_plan",
    input: {
      logline: "A girl carries a bell across the strait.",
      want: "To ring the bell",
      obstacle: "The fog",
      change: "She rings it herself",
      shots: shotIds.map(shotOf),
      chapters: filmChapters,
    },
  });
  for (const shotId of shotIds) await makeShot({ engine, shotId });
}

const planSchema = z.object({
  bible: z.object({
    storyPlan: z.object({
      chapters: z
        .array(
          z.object({
            id: z.string(),
            title: z.string(),
            shotIds: z.array(z.string()),
          }),
        )
        .optional(),
    }),
  }),
});

export async function chaptersText(engine: RunningEngine): Promise<string> {
  const { bible } = planSchema.parse(
    await engineRequest({ engine, path: "/api/project" }),
  );
  return (bible.storyPlan.chapters ?? [])
    .map((chapter) => `${chapter.title}: ${chapter.shotIds.join(" ")}`)
    .join(" | ");
}

export async function rowText(engine: RunningEngine): Promise<string> {
  const clips = await scenesRowClipsOf({ engine, outputId: "wide" });
  return clips
    .map((clip) => clip.id.replace(/^video-/, "").replace(/-clip$/, ""))
    .join(" ");
}

export const firstChapters =
  "The harbor: a b | Into the fog: c d | The island: e f";
