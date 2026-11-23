import { describe, expect, it } from "vitest";
import {
  callAs,
  projectWithPersonWork,
  scenesRowOfAgent,
} from "../testing/personWorkFixture.js";

const rewrittenRow = {
  id: "main",
  kind: "scene",
  clips: [
    { id: "intro", scene_id: "a", start_frame: 0, duration_frames: 30 },
    { id: "middle", scene_id: "b", start_frame: 30, duration_frames: 30 },
    { id: "end", scene_id: "c", start_frame: 60, duration_frames: 30 },
  ],
};

const narration = { id: "narration", kind: "audio", clips: [] };

function timelineOf(store: { read: () => { timelines: unknown[] } }) {
  return JSON.stringify(store.read().timelines);
}

describe("what a person made", () => {
  it("marks the music, the clip, and each transition of the person", async () => {
    const { store } = await projectWithPersonWork();

    const [timeline] = store.read().timelines;
    const [row, music] = timeline?.tracks ?? [];
    expect(
      row?.clips.map((clip) => [
        clip.id,
        clip.madeBy,
        "sceneId" in clip ? clip.transition?.madeBy : undefined,
      ]),
    ).toEqual([
      ["first", "ai", undefined],
      ["video-waves", "person", "person"],
      ["third", "ai", "person"],
    ]);
    expect(music?.clips[0]?.madeBy).toBe("person");
  });

  it("refuses an agent timeline that leaves them out, and names each one", async () => {
    const { harness, store } = await projectWithPersonWork();
    const before = timelineOf(store);

    const result = await callAs({
      harness,
      by: "ai",
      name: "set_timeline",
      input: { output_id: "wide", tracks: [rewrittenRow, narration] },
    });

    expect(result.isError).toBe(true);
    expect(result.data).toMatchObject({
      kind: "would-remove-the-work-of-the-person",
      removed: [
        "the video clip of scene 2",
        "the music Calm pad",
        "2 transitions",
      ],
    });
    expect(result.text).toContain("remove_person_work");
    expect(timelineOf(store)).toBe(before);
  });

  it("removes them when the agent call says remove_person_work", async () => {
    const { harness, store } = await projectWithPersonWork();

    const result = await callAs({
      harness,
      by: "ai",
      name: "set_timeline",
      input: {
        output_id: "wide",
        tracks: [rewrittenRow, narration],
        remove_person_work: true,
      },
    });

    expect(result.isError).toBe(false);
    expect(store.read().timelines[0]?.tracks.map((track) => track.id)).toEqual([
      "main",
      "narration",
    ]);
  });

  it("never refuses the same call by the person", async () => {
    const { harness } = await projectWithPersonWork();

    const result = await callAs({
      harness,
      by: "person",
      name: "set_timeline",
      input: { output_id: "wide", tracks: [rewrittenRow, narration] },
    });

    expect(result.isError).toBe(false);
  });

  it("lets an agent timeline that keeps the work of the person through", async () => {
    const { harness, store } = await projectWithPersonWork();
    const row = {
      ...scenesRowOfAgent,
      clips: scenesRowOfAgent.clips.map((clip) =>
        clip.id === "second"
          ? { ...clip, id: "video-waves", scene_id: "video-waves" }
          : clip,
      ),
    };

    const result = await callAs({
      harness,
      by: "ai",
      name: "set_timeline",
      input: {
        output_id: "wide",
        tracks: [
          row,
          {
            id: "music",
            kind: "audio",
            clips: [
              {
                id: "music-1",
                asset_id: "calm-pad",
                start_frame: 0,
                duration_frames: 90,
              },
            ],
          },
        ],
      },
    });

    expect(result.isError).toBe(false);
    const [timeline] = store.read().timelines;
    expect(timeline?.tracks[1]?.clips[0]?.madeBy).toBe("person");
  });

  it("refuses an agent remove_clip of a clip of the person", async () => {
    const { harness } = await projectWithPersonWork();

    const result = await callAs({
      harness,
      by: "ai",
      name: "remove_clip",
      input: { output_id: "wide", clip_id: "music-1" },
    });

    expect(result.data).toMatchObject({ removed: ["the music Calm pad"] });
  });
});
