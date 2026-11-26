import { describe, expect, it } from "vitest";
import { startChapteredFilm, trackClipsOf } from "../testing/chapteredFilm.js";
import { picture } from "../testing/takeHarness.js";

describe("place_picture", { timeout: 60_000 }, () => {
  it("shows a picture in the place of a scene clip with its start and length, removes the sound of the old video, and one undo brings the clip back", async () => {
    const harness = await startChapteredFilm();

    const placed = await harness.call({
      name: "place_picture",
      arguments: {
        output_id: "wide",
        asset_id: "b-start",
        replace_clip_id: "video-b-clip",
      },
    });

    expect(placed.data).toMatchObject({
      scene_id: "picture-b-start",
      scene_clip_id: "picture-b-start",
      start_frame: 10,
      duration_frames: 11,
    });
    expect(trackClipsOf({ harness, trackId: "scenes" })).toEqual([
      "video-a-clip@0",
      "picture-b-start@10",
      "video-c-clip@21",
      "video-d-clip@33",
    ]);
    expect(trackClipsOf({ harness, trackId: "video-sound" })).not.toContain(
      "video-sound-b-clip@10",
    );
    const scene = harness.store
      .read()
      .scenes.find((each) => each.id === "picture-b-start");
    expect(scene?.source).toEqual({
      kind: "kit",
      component: "image-pan",
      props: { assetId: "b-start" },
    });
    await harness.call({ name: "undo" });
    expect(trackClipsOf({ harness, trackId: "scenes" })).toContain(
      "video-b-clip@10",
    );
  });

  it("refuses a picture that the person dropped in a take, and a video", async () => {
    const harness = await startChapteredFilm();
    await harness.call({
      name: "open_take",
      arguments: { step: "pictures", chapter_id: "one" },
    });
    await harness.call({
      name: "generate_asset",
      arguments: picture("lantern"),
    });
    await harness.call({
      name: "ready_take",
      arguments: { items: [{ id: "lantern", note: "The lantern." }] },
    });
    await harness.sendTake({
      takeId: "take-1",
      notes: [{ item_id: "lantern", text: "", dropped: true }],
    });

    const dropped = await harness.call({
      name: "place_picture",
      arguments: {
        output_id: "wide",
        asset_id: "lantern",
        replace_clip_id: "video-b-clip",
      },
    });
    const video = await harness.call({
      name: "place_picture",
      arguments: {
        output_id: "wide",
        asset_id: "a-clip",
        replace_clip_id: "video-b-clip",
      },
    });

    expect(dropped.data).toMatchObject({ kind: "picture-not-approved" });
    expect(dropped.data["message"]).toBe(
      'The person dropped "lantern" in take 1, so the film does not show it.',
    );
    expect(video.data).toMatchObject({ kind: "asset-not-image" });
    expect(trackClipsOf({ harness, trackId: "scenes" })).toContain(
      "video-b-clip@10",
    );
  });
});
