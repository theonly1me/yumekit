import { describe, expect, it } from "vitest";
import { openProject } from "../index.js";
import {
  createTestProject,
  kitScene,
  readProjectFile,
} from "../testing/projectFixtures.js";

const timelineWithOffTrack = {
  outputId: "wide",
  tracks: [
    {
      id: "main",
      kind: "scene" as const,
      off: true,
      clips: [
        {
          id: "open",
          sceneId: "intro",
          startFrame: 0,
          durationFrames: 30,
          sceneStartFrame: 0,
        },
      ],
    },
  ],
};

describe("the field off on a track", () => {
  it("setTimeline stores off, and the project opens again with it", async () => {
    const store = await createTestProject();
    await store.applyEdits([
      kitScene("intro"),
      { kind: "setTimeline", timeline: timelineWithOffTrack },
    ]);

    const file: unknown = JSON.parse(
      await readProjectFile({ store, file: "timelines/wide.json" }),
    );
    const reopened = await openProject({ folder: store.folder });

    expect(file).toEqual(timelineWithOffTrack);
    expect(reopened.ok && reopened.value.read().timelines).toEqual([
      timelineWithOffTrack,
    ]);
  });
});
