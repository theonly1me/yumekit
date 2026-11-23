import { openProject, type Edit } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "../testing/renderProject.js";
import { solidColorCode } from "../testing/sceneCodes.js";
import { frameLayerOf, frameSceneId } from "./frameLayer.js";

const captionScene: Edit = {
  kind: "putScene",
  scene: {
    id: "captions",
    title: "Captions",
    notes: "",
    source: { kind: "kit", component: "caption-words", props: {} },
  },
};

async function snapshotWithFrame(frame: boolean) {
  const folder = await createRenderProject({
    edits: [
      moduleScene({ sceneId: "back", code: solidColorCode }),
      moduleScene({ sceneId: "over", code: solidColorCode }),
      captionScene,
      { kind: "putSharedCode", name: "frame", code: solidColorCode },
      ...(frame ? [{ kind: "setFrame" as const, name: "frame" }] : []),
      sceneTracks({
        tracks: [
          [{ id: "one", sceneId: "back", startFrame: 0, durationFrames: 40 }],
          [{ id: "two", sceneId: "over", startFrame: 10, durationFrames: 10 }],
          [
            {
              id: "cap",
              sceneId: "captions",
              startFrame: 0,
              durationFrames: 40,
            },
          ],
        ],
      }),
    ],
  });
  const opened = await openProject({ folder });
  if (!opened.ok) throw new Error(opened.failure.message);
  const store = opened.value;
  const snapshot = store.read();
  const [timeline] = snapshot.timelines;
  if (timeline === undefined) throw new Error("The project has no timeline");
  return { folder, snapshot, timeline };
}

describe("the layer of the frame", () => {
  it("goes above each scene track and below the first caption track, for the whole video", async () => {
    const project = await snapshotWithFrame(true);

    const layer = frameLayerOf({ ...project, frameCount: 40 });

    expect(
      layer?.sceneTracks.map((clips) => clips.map((clip) => clip.sceneId)),
    ).toEqual([["back"], ["over"], [frameSceneId], ["captions"]]);
    expect(layer?.sceneTracks[2]).toEqual([
      expect.objectContaining({ startFrame: 0, durationFrames: 40 }),
    ]);
    expect(layer?.props).toEqual({
      scenes: [
        {
          index: 0,
          sceneId: "back",
          title: "back",
          startFrame: 0,
          durationFrames: 40,
        },
      ],
    });
  });

  it("adds nothing to a project with no frame", async () => {
    const project = await snapshotWithFrame(false);

    expect(frameLayerOf({ ...project, frameCount: 40 })).toBeUndefined();
  });
});
