import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderVideo } from "./index.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
  temporaryFolder,
} from "./testing/renderProject.js";

const paperFontHeadingCode = `import { defineReactScene } from "@yumekit/scene";

export default defineReactScene(() => (
  <div style={{ position: "absolute", inset: 0, background: "#eef1f4" }}>
    <h1 style={{ margin: 0, padding: 20, fontFamily: "Zen Maru Gothic", fontWeight: 700, fontSize: 64, color: "#18203a" }}>
      A custom heading
    </h1>
  </div>
));
`;

describe("renderVideo with the paper fonts", () => {
  it("renders a custom scene that names Zen Maru Gothic before a kit scene, with no scene-not-repeatable", async () => {
    const folder = await createRenderProject({
      edits: [
        moduleScene({ sceneId: "custom", code: paperFontHeadingCode }),
        {
          kind: "putScene",
          scene: {
            id: "title",
            title: "Title",
            notes: "",
            source: {
              kind: "kit",
              component: "title-card",
              props: { heading: "Kit title" },
            },
          },
        },
        sceneTracks({
          tracks: [
            [
              {
                id: "first",
                sceneId: "custom",
                startFrame: 0,
                durationFrames: 30,
              },
              {
                id: "second",
                sceneId: "title",
                startFrame: 30,
                durationFrames: 30,
              },
            ],
          ],
        }),
      ],
    });
    const destination = join(await temporaryFolder(), "fonts.mp4");

    const rendered = await renderVideo({
      folder,
      outputId: "wide",
      destination,
      scale: 0.5,
    });

    expect(rendered.ok ? "rendered" : rendered.failure.kind).toBe("rendered");
  });
});
