import { z } from "zod";
import { counterCode } from "./counterProject.js";
import { engineRequest } from "./mediaTestTools.js";
import type { RunningEngine } from "./runEngine.js";

export const videoFrames = 60;
const outputIds = ["wide", "tall"];

export async function buildSoundProject(engine: RunningEngine): Promise<void> {
  for (const [sceneId, title] of [
    ["first", "First counter"],
    ["second", "Second counter"],
  ] as const) {
    await engine.callTool({
      name: "put_scene",
      input: { scene_id: sceneId, title, code: counterCode, props: {} },
    });
  }
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "voice",
      capability: "speech",
      server: "sample",
      input: { text: "A short line" },
    },
  });
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "tune",
      capability: "music",
      server: "sample",
      input: { prompt: "A calm tune", duration_seconds: 2 },
    },
  });
  for (const outputId of outputIds) {
    await engine.callTool({
      name: "set_timeline",
      input: {
        output_id: outputId,
        tracks: [
          {
            id: "scenes",
            kind: "scene",
            clips: [
              { scene_id: "first", start_frame: 0, duration_frames: 30 },
              { scene_id: "second", start_frame: 30, duration_frames: 30 },
            ],
          },
          { id: "narration", kind: "audio", clips: [] },
          {
            id: "music",
            kind: "audio",
            clips: [
              {
                id: "tune-clip",
                asset_id: "tune",
                start_frame: 0,
                duration_frames: videoFrames,
                gain_decibels: -12,
              },
            ],
          },
        ],
      },
    });
    await engine.callTool({
      name: "place_narration",
      input: {
        output_id: outputId,
        asset_id: "voice",
        start_frame: 0,
        with_captions: true,
      },
    });
  }
}

const soundSchema = z.object({
  assets: z.array(
    z.object({ id: z.string(), file: z.string(), hasWords: z.boolean() }),
  ),
  timelines: z.array(
    z.object({
      outputId: z.string(),
      tracks: z.array(
        z.object({
          id: z.string(),
          off: z.boolean().optional(),
          clips: z.array(
            z.object({
              assetId: z.string().optional(),
              startFrame: z.number(),
              durationFrames: z.number(),
              gainDecibels: z.number().optional(),
            }),
          ),
        }),
      ),
    }),
  ),
});

export async function soundTracksOf(options: {
  engine: RunningEngine;
  trackId: string;
}) {
  const project = soundSchema.parse(
    await engineRequest({ engine: options.engine, path: "/api/project" }),
  );
  return {
    assets: project.assets,
    tracks: project.timelines.map((timeline) => ({
      outputId: timeline.outputId,
      track: timeline.tracks.find((track) => track.id === options.trackId),
    })),
  };
}
