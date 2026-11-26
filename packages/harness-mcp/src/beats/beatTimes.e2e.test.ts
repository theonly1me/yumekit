import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";

async function projectWithTwoScenes(options: {
  tempo?: number;
}): Promise<Harness> {
  const harness = await startHarness();
  for (const sceneId of ["intro", "outro"]) {
    await harness.call({
      name: "put_scene",
      arguments: {
        scene_id: sceneId,
        title: sceneId,
        kit_component: "title-card",
        props: { heading: sceneId },
      },
    });
  }
  if (options.tempo !== undefined) {
    await harness.call({
      name: "set_tempo",
      arguments: { tempo: options.tempo },
    });
  }
  return harness;
}

function clipsOf(harness: Harness) {
  return (harness.store.read().timelines[0]?.tracks ?? []).flatMap((track) =>
    track.kind === "scene" ? track.clips : [],
  );
}

describe("times in beats", () => {
  it("places a clip at beat 8 with tempo 120 at 30 frames each second on frame 120", async () => {
    const harness = await projectWithTwoScenes({ tempo: 120 });
    await harness.call({
      name: "set_timeline",
      arguments: {
        output_id: "wide",
        tracks: [{ id: "main", kind: "scene", clips: [] }],
      },
    });

    const added = await harness.call({
      name: "add_clip",
      arguments: {
        output_id: "wide",
        track_id: "main",
        clip_id: "late",
        scene_id: "intro",
        start_beat: 8,
        duration_beats: 4,
      },
    });

    expect(added.isError).toBe(false);
    expect(clipsOf(harness)).toMatchObject([
      { id: "late", startFrame: 120, durationFrames: 60 },
    ]);
  });

  it("turns beats into frames inside each clip of set_timeline, and get_timeline gives both", async () => {
    const harness = await projectWithTwoScenes({ tempo: 128 });

    await harness.call({
      name: "set_timeline",
      arguments: {
        output_id: "wide",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              {
                id: "a",
                scene_id: "intro",
                start_beat: 0,
                duration_beats: 2.5,
              },
              {
                id: "b",
                scene_id: "outro",
                start_beat: 2.5,
                duration_beats: 4,
                transition: { kind: "fade", duration_beats: 0.5 },
              },
            ],
          },
        ],
      },
    });
    const timeline = await harness.call({
      name: "get_timeline",
      arguments: { output_id: "wide" },
    });

    expect(clipsOf(harness)).toMatchObject([
      { id: "a", startFrame: 0, durationFrames: 35 },
      {
        id: "b",
        startFrame: 35,
        durationFrames: 56,
        transition: { durationFrames: 7 },
      },
    ]);
    expect(timeline.data).toMatchObject({
      length_frames: 91,
      length_beats: 6.47,
      tracks: [
        {
          clips: [
            { start_frame: 0, start_beat: 0, duration_beats: 2.49 },
            { start_frame: 35, start_beat: 2.49, duration_beats: 3.98 },
          ],
        },
      ],
    });
  });

  it("refuses a call that gives a time in frames and in beats", async () => {
    const harness = await projectWithTwoScenes({ tempo: 120 });

    const placed = await harness.call({
      name: "set_timeline",
      arguments: {
        output_id: "wide",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              {
                scene_id: "intro",
                start_frame: 0,
                start_beat: 0,
                duration_beats: 2,
              },
            ],
          },
        ],
      },
    });

    expect(placed.data).toMatchObject({
      kind: "frames-and-beats",
    });
    expect(String(placed.data["message"])).toContain("tracks[0].clips[0]");
    expect(clipsOf(harness)).toEqual([]);
  });

  it("asks for a tempo when a call gives beats and the project has none", async () => {
    const harness = await projectWithTwoScenes({});

    const resized = await harness.call({
      name: "set_transitions",
      arguments: { kind: "fade", duration_beats: 1 },
    });

    expect(resized.data).toMatchObject({
      kind: "no-tempo",
    });
    expect(String(resized.data["hint"])).toContain("set_tempo");
  });

  it("gives tempo and frames_per_beat in get_project, and nothing for a project with no tempo", async () => {
    const withTempo = await projectWithTwoScenes({ tempo: 90 });
    const withoutTempo = await projectWithTwoScenes({});

    const [first, second] = await Promise.all(
      [withTempo, withoutTempo].map((harness) =>
        harness.call({ name: "get_project" }),
      ),
    );

    expect(first?.data).toMatchObject({ tempo: 90, frames_per_beat: 20 });
    expect(second?.data).toMatchObject({ tempo: null, frames_per_beat: null });
  });

  it("lists a beat twin for each frame input, so a call can leave out the frames", async () => {
    const harness = await startHarness();

    const { tools } = await harness.client.listTools();
    const addClip = tools.find((tool) => tool.name === "add_clip");

    expect(Object.keys(addClip?.inputSchema.properties ?? {})).toEqual(
      expect.arrayContaining([
        "start_frame",
        "start_beat",
        "duration_frames",
        "duration_beats",
      ]),
    );
    expect(addClip?.inputSchema.required ?? []).not.toContain("start_frame");
  });
});
