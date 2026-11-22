import type { Output } from "@yumekit/project";
import { startHarness, type Harness } from "./harnessFixture.js";

export const youtubeOutput: Output = {
  id: "wide",
  label: "Wide 16:9",
  widthPixels: 1920,
  heightPixels: 1080,
  platforms: ["youtube"],
};

export const tiktokOutput: Output = {
  id: "tall",
  label: "Tall 9:16",
  widthPixels: 1080,
  heightPixels: 1920,
  platforms: ["tiktok"],
};

async function putTitle(options: {
  harness: Harness;
  sceneId: string;
}): Promise<void> {
  await options.harness.call({
    name: "put_scene",
    arguments: {
      scene_id: options.sceneId,
      title: options.sceneId,
      kit_component: "title-card",
      props: { heading: options.sceneId },
    },
  });
}

export async function harnessWithYoutubeAndTiktok(): Promise<Harness> {
  const harness = await startHarness({
    outputs: [youtubeOutput, tiktokOutput],
  });
  for (const [outputId, sceneId] of [
    ["wide", "wide-title"],
    ["tall", "tall-title"],
  ] as const) {
    await putTitle({ harness, sceneId });
    await harness.call({
      name: "set_timeline",
      arguments: {
        output_id: outputId,
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              {
                id: sceneId,
                scene_id: sceneId,
                start_frame: 0,
                duration_frames: 6,
              },
            ],
          },
        ],
      },
    });
  }
  return harness;
}

export function outputsOf(harness: Harness) {
  return harness.store.read().project.outputs.map((output) => ({
    id: output.id,
    platforms: output.platforms ?? [],
  }));
}

export function sceneIdsOf(options: { harness: Harness; outputId: string }) {
  return options.harness.store
    .read()
    .timelines.filter((timeline) => timeline.outputId === options.outputId)
    .flatMap((timeline) => timeline.tracks)
    .flatMap((track) => (track.kind === "scene" ? track.clips : []))
    .map((clip) => clip.sceneId);
}
