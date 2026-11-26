import { describe, expect, it } from "vitest";
import {
  chapter,
  startChapteredFilm,
  trackClipsOf,
} from "../testing/chapteredFilm.js";
import { startTakeHarness } from "../testing/takeHarness.js";

function chaptersOf(harness: Awaited<ReturnType<typeof startChapteredFilm>>) {
  return harness.store
    .read()
    .bible.storyPlan?.chapters?.map(
      (each) => `${each.id}: ${each.shotIds.join(" ")}`,
    );
}

describe("set_chapters", { timeout: 60_000 }, () => {
  it("moves the line between two chapters with no change to the scenes, and one undo brings the old line back", async () => {
    const harness = await startChapteredFilm();
    const scenesBefore = trackClipsOf({ harness, trackId: "scenes" });

    const moved = await harness.call({
      name: "set_chapters",
      arguments: {
        chapters: [
          chapter({ id: "one", shotIds: ["a"] }),
          chapter({ id: "two", shotIds: ["b", "c", "d"] }),
        ],
      },
    });

    expect(moved.data).toMatchObject({ order_changed: false, output_ids: [] });
    expect(chaptersOf(harness)).toEqual(["one: a", "two: b c d"]);
    expect(trackClipsOf({ harness, trackId: "scenes" })).toEqual(scenesBefore);
    await harness.call({ name: "undo" });
    expect(chaptersOf(harness)).toEqual(["one: a b", "two: c d"]);
  });

  it("moves a chapter to the front: the shots of the plan, the scenes, and the sound of each video follow in one undo step", async () => {
    const harness = await startChapteredFilm();

    const moved = await harness.call({
      name: "set_chapters",
      arguments: {
        chapters: [
          chapter({ id: "two", shotIds: ["c", "d"] }),
          chapter({ id: "one", shotIds: ["a", "b"] }),
        ],
      },
    });

    expect(moved.data).toMatchObject({
      order_changed: true,
      output_ids: ["wide"],
    });
    expect(
      harness.store.read().bible.storyPlan?.shots.map((shot) => shot.id),
    ).toEqual(["c", "d", "a", "b"]);
    expect(trackClipsOf({ harness, trackId: "scenes" })).toEqual([
      "video-c-clip@0",
      "video-d-clip@12",
      "video-a-clip@25",
      "video-b-clip@35",
    ]);
    expect(trackClipsOf({ harness, trackId: "video-sound" })).toEqual([
      "video-sound-c-clip@0",
      "video-sound-d-clip@12",
      "video-sound-a-clip@25",
      "video-sound-b-clip@35",
    ]);
    await harness.call({ name: "undo" });
    expect(trackClipsOf({ harness, trackId: "scenes" })).toEqual([
      "video-a-clip@0",
      "video-b-clip@10",
      "video-c-clip@21",
      "video-d-clip@33",
    ]);
    expect(chaptersOf(harness)).toEqual(["one: a b", "two: c d"]);
  });

  it("moves one shot into the next chapter, and a scene with no shot stays after the scene before it", async () => {
    const harness = await startChapteredFilm();
    await harness.call({
      name: "put_scene",
      arguments: {
        scene_id: "title",
        title: "Title",
        kit_component: "title-card",
        props: { heading: "The forge" },
      },
    });
    await harness.call({
      name: "add_clip",
      arguments: {
        output_id: "wide",
        track_id: "scenes",
        clip_id: "title",
        scene_id: "title",
        start_frame: 46,
        duration_frames: 5,
      },
    });
    await harness.call({
      name: "move_scene_clip",
      arguments: { clip_id: "title", to_index: 1 },
    });

    const moved = await harness.call({
      name: "set_chapters",
      arguments: {
        chapters: [
          chapter({ id: "one", shotIds: ["b"] }),
          chapter({ id: "two", shotIds: ["c", "a", "d"] }),
        ],
      },
    });

    expect(moved.isError).toBe(false);
    expect(chaptersOf(harness)).toEqual(["one: b", "two: c a d"]);
    expect(trackClipsOf({ harness, trackId: "scenes" })).toEqual([
      "video-b-clip@0",
      "video-c-clip@11",
      "video-a-clip@23",
      "title@33",
      "video-d-clip@38",
    ]);
  });

  it.each([
    {
      kind: "chapter-misses-shot",
      chapters: [chapter({ id: "one", shotIds: ["a", "b", "c"] })],
    },
    {
      kind: "shot-in-two-chapters",
      chapters: [
        chapter({ id: "one", shotIds: ["a", "b"] }),
        chapter({ id: "two", shotIds: ["b", "c", "d"] }),
      ],
    },
  ])(
    "refuses chapters with $kind and changes nothing",
    async ({ kind, chapters }) => {
      const harness = await startChapteredFilm();

      const refused = await harness.call({
        name: "set_chapters",
        arguments: { chapters },
      });

      expect(refused.data).toMatchObject({ kind });
      expect(chaptersOf(harness)).toEqual(["one: a b", "two: c d"]);
    },
  );

  it("refuses chapters for a project with no story plan", async () => {
    const harness = await startTakeHarness();

    const refused = await harness.call({
      name: "set_chapters",
      arguments: { chapters: [chapter({ id: "one", shotIds: ["a"] })] },
    });

    expect(refused.data).toMatchObject({ kind: "no-story-plan" });
  });
});
