import { describe, expect, it } from "vitest";
import {
  createTestProject,
  kitScene,
  readProjectFile,
  sceneTrack,
  tallOutput,
} from "../testing/projectFixtures.js";

describe("timeline edits", () => {
  it("setTimeline replaces the timeline file of the output", async () => {
    const store = await createTestProject();
    const track = sceneTrack({
      trackId: "main",
      clips: [
        { id: "open", sceneId: "intro", startFrame: 0, durationFrames: 30 },
      ],
    });
    await store.applyEdits([kitScene("intro"), track]);
    const expected = track.timeline;
    expect(store.read().timelines).toEqual([expected]);
    expect(
      JSON.parse(await readProjectFile({ store, file: "timelines/wide.json" })),
    ).toEqual(expected);
  });

  it("setTimeline refuses an output that does not exist", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      { kind: "setTimeline", timeline: { outputId: "square", tracks: [] } },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });

  it("setTimeline refuses a clip of a scene that does not exist", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      sceneTrack({
        trackId: "main",
        clips: [
          { id: "open", sceneId: "intro", startFrame: 0, durationFrames: 30 },
        ],
      }),
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });

  it("setTimeline refuses two clips that overlap by one frame", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      kitScene("intro"),
      sceneTrack({
        trackId: "main",
        clips: [
          { id: "first", sceneId: "intro", startFrame: 0, durationFrames: 30 },
          {
            id: "second",
            sceneId: "intro",
            startFrame: 29,
            durationFrames: 30,
          },
        ],
      }),
    ]);
    expect(result.ok || result.failure).toMatchObject({
      kind: "clips-overlap",
      editIndex: 1,
    });
  });

  it("setTimeline accepts a clip that starts on the end frame of the previous clip", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      kitScene("intro"),
      sceneTrack({
        trackId: "main",
        clips: [
          { id: "first", sceneId: "intro", startFrame: 0, durationFrames: 30 },
          {
            id: "second",
            sceneId: "intro",
            startFrame: 30,
            durationFrames: 30,
          },
        ],
      }),
    ]);
    expect(result.ok).toBe(true);
  });

  it.each([
    { startFrame: -1, durationFrames: 30 },
    { startFrame: 0, durationFrames: 0 },
    { startFrame: 0.5, durationFrames: 30 },
  ])(
    "setTimeline refuses the clip timing $startFrame, $durationFrames",
    async (timing) => {
      const store = await createTestProject();
      const result = await store.applyEdits([
        kitScene("intro"),
        sceneTrack({
          trackId: "main",
          clips: [{ id: "open", sceneId: "intro", ...timing }],
        }),
      ]);
      expect(result.ok || result.failure.kind).toBe("invalid-value");
    },
  );

  it("setTimeline refuses two clips with the same id", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      kitScene("intro"),
      sceneTrack({
        trackId: "main",
        clips: [
          { id: "open", sceneId: "intro", startFrame: 0, durationFrames: 30 },
          { id: "open", sceneId: "intro", startFrame: 30, durationFrames: 30 },
        ],
      }),
    ]);
    expect(result.ok || result.failure.kind).toBe("id-in-use");
  });

  it("copyTimeline replaces the target timeline with a copy of the source", async () => {
    const store = await createTestProject();
    await store.applyEdits([
      { kind: "addOutput", output: tallOutput },
      kitScene("intro"),
      sceneTrack({
        trackId: "main",
        clips: [
          { id: "open", sceneId: "intro", startFrame: 0, durationFrames: 30 },
        ],
      }),
      { kind: "copyTimeline", fromOutputId: "wide", toOutputId: "tall" },
    ]);
    const [wide, tall] = store.read().timelines;
    expect(tall).toEqual({ outputId: "tall", tracks: wide?.tracks });
  });

  it("copyTimeline refuses an output that does not exist", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      { kind: "copyTimeline", fromOutputId: "wide", toOutputId: "tall" },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });
});
