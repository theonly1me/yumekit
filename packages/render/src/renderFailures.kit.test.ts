import { describe, expect, it } from "vitest";
import { renderFrame } from "./index.js";
import { createRenderProject, sceneTracks } from "./testing/renderProject.js";
import { failureOf } from "./testing/valueOf.js";

describe("render failures of kit scenes", () => {
  it("returns kit-scene-not-found when the kit has no scene with that component name", async () => {
    const folder = await createRenderProject({
      edits: [
        {
          kind: "putScene",
          scene: {
            id: "intro",
            title: "Intro",
            notes: "",
            source: { kind: "kit", component: "no-such-scene", props: {} },
          },
        },
        sceneTracks({
          tracks: [
            [
              {
                id: "open",
                sceneId: "intro",
                startFrame: 0,
                durationFrames: 5,
              },
            ],
          ],
        }),
      ],
    });
    const failure = failureOf(
      await renderFrame({ folder, outputId: "wide", frame: 1 }),
    );
    expect(failure).toMatchObject({
      kind: "kit-scene-not-found",
      component: "no-such-scene",
      sceneId: "intro",
    });
    expect(failure.message).toContain('no scene component "no-such-scene"');
  });
});
