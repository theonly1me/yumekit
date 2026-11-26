import type { Timeline } from "@yumekit/project";
import { makeSheet, setPlan } from "./storyFixture.js";
import { startTakeHarness, type TakeHarness } from "./takeHarness.js";

export const filmShotIds = ["a", "b", "c", "d"];

export function chapter(options: { id: string; shotIds: string[] }) {
  return {
    chapter_id: options.id,
    title: `Chapter ${options.id}`,
    shot_ids: options.shotIds,
  };
}

export async function startChapteredFilm(): Promise<TakeHarness> {
  const harness = await startTakeHarness({
    videoStyle: "ai-video",
    approvePicturesFirst: false,
  });
  await makeSheet({
    harness,
    castId: "forge",
    kind: "place",
    facts: ["The door is on the right wall"],
  });
  await setPlan({
    harness,
    shots: filmShotIds.map((shotId) => ({ shot_id: shotId, cast_ids: [] })),
    chapters: [
      chapter({ id: "one", shotIds: ["a", "b"] }),
      chapter({ id: "two", shotIds: ["c", "d"] }),
    ],
  });
  let startFrame = 0;
  for (const shotId of filmShotIds) {
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: `${shotId}-start`,
        capability: "image",
        shot_id: shotId,
        input: { prompt: shotId, width_pixels: 32, height_pixels: 18 },
      },
    });
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: `${shotId}-clip`,
        capability: "video",
        shot_id: shotId,
        first_frame_asset_id: `${shotId}-start`,
        input: { prompt: shotId, duration_seconds: 1 },
      },
    });
    await harness.call({
      name: "place_video",
      arguments: {
        output_id: "wide",
        asset_id: `${shotId}-clip`,
        start_frame: startFrame,
        duration_frames: 10 + filmShotIds.indexOf(shotId),
      },
    });
    startFrame += 10 + filmShotIds.indexOf(shotId);
  }
  return harness;
}

export function trackClipsOf(options: {
  harness: TakeHarness;
  trackId: string;
}): string[] {
  const timeline: Timeline | undefined = options.harness.store
    .read()
    .timelines.find((each) => each.outputId === "wide");
  const track = timeline?.tracks.find((each) => each.id === options.trackId);
  return (track?.clips ?? [])
    .toSorted((...[first, second]) => first.startFrame - second.startFrame)
    .map((clip) => `${clip.id}@${String(clip.startFrame)}`);
}
