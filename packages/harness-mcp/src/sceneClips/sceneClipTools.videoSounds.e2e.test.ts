import type { Timeline } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { startChapteredFilm, trackClipsOf } from "../testing/chapteredFilm.js";
import type { TakeHarness } from "../testing/takeHarness.js";

const oneSecondOfVideo = 30;

function soundsOf(harness: TakeHarness): string[] {
  const timeline: Timeline | undefined = harness.store
    .read()
    .timelines.find((each) => each.outputId === "wide");
  const track = timeline?.tracks.find((each) => each.id === "video-sound");
  return (track?.clips ?? [])
    .toSorted((...[first, second]) => first.startFrame - second.startFrame)
    .map(
      (clip) =>
        `${clip.id}@${String(clip.startFrame)}+${String(clip.durationFrames)}`,
    );
}

describe("the sound of each video in a change of the scenes row", () => {
  it.each([
    {
      name: "a longer scene grows its own sound and moves each later sound with its clip",
      durationFrames: 20,
      sounds: [
        "video-sound-a-clip@0+10",
        "video-sound-b-clip@10+20",
        "video-sound-c-clip@30+12",
        "video-sound-d-clip@42+13",
      ],
    },
    {
      name: "a scene longer than its video grows its own sound only to the end of the file",
      durationFrames: 45,
      sounds: [
        "video-sound-a-clip@0+10",
        `video-sound-b-clip@10+${String(oneSecondOfVideo)}`,
        "video-sound-c-clip@55+12",
        "video-sound-d-clip@67+13",
      ],
    },
    {
      name: "a shorter scene trims its own sound and moves each later sound with its clip",
      durationFrames: 4,
      sounds: [
        "video-sound-a-clip@0+10",
        "video-sound-b-clip@10+4",
        "video-sound-c-clip@14+12",
        "video-sound-d-clip@26+13",
      ],
    },
  ])("resize_scene_clip: $name", async ({ durationFrames, sounds }) => {
    const harness = await startChapteredFilm();

    const resized = await harness.call({
      name: "resize_scene_clip",
      arguments: { clip_id: "video-b-clip", duration_frames: durationFrames },
    });

    expect(resized.isError).toBe(false);
    expect(soundsOf(harness)).toEqual(sounds);
  });

  it("resize_scene_clip leaves the sound of an earlier video where the person put it", async () => {
    const harness = await startChapteredFilm();
    await harness.call({
      name: "update_clip",
      arguments: {
        output_id: "wide",
        clip_id: "video-sound-a-clip",
        start_frame: 2,
        duration_frames: 6,
      },
    });

    await harness.call({
      name: "resize_scene_clip",
      arguments: { clip_id: "video-c-clip", duration_frames: 20 },
    });

    expect(soundsOf(harness)).toEqual([
      "video-sound-a-clip@2+6",
      "video-sound-b-clip@10+11",
      "video-sound-c-clip@21+20",
      "video-sound-d-clip@41+13",
    ]);
  });

  it("remove_scene_clip takes out the sound of the removed video and moves each later sound with its clip", async () => {
    const harness = await startChapteredFilm();

    const removed = await harness.call({
      name: "remove_scene_clip",
      arguments: { clip_id: "video-b-clip" },
    });

    expect(removed.isError).toBe(false);
    expect(trackClipsOf({ harness, trackId: "scenes" })).toEqual([
      "video-a-clip@0",
      "video-c-clip@10",
      "video-d-clip@22",
    ]);
    expect(soundsOf(harness)).toEqual([
      "video-sound-a-clip@0+10",
      "video-sound-c-clip@10+12",
      "video-sound-d-clip@22+13",
    ]);
  });

  it("duplicate_scene_clip keeps the sound of the copied video and moves each later sound with its clip", async () => {
    const harness = await startChapteredFilm();

    const duplicated = await harness.call({
      name: "duplicate_scene_clip",
      arguments: { clip_id: "video-b-clip" },
    });

    expect(duplicated.isError).toBe(false);
    expect(trackClipsOf({ harness, trackId: "scenes" })).toEqual([
      "video-a-clip@0",
      "video-b-clip@10",
      "video-b-clip-copy@21",
      "video-c-clip@32",
      "video-d-clip@44",
    ]);
    expect(soundsOf(harness)).toEqual([
      "video-sound-a-clip@0+10",
      "video-sound-b-clip@10+11",
      "video-sound-c-clip@32+12",
      "video-sound-d-clip@44+13",
    ]);
  });

  it("is one undo step with the sounds", async () => {
    const harness = await startChapteredFilm();
    const before = soundsOf(harness);

    await harness.call({
      name: "remove_scene_clip",
      arguments: { clip_id: "video-a-clip" },
    });
    await harness.call({ name: "undo" });

    expect(soundsOf(harness)).toEqual(before);
  });
});
