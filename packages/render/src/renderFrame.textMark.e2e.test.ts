import { describe, expect, it } from "vitest";
import { renderFrame } from "./index.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "./testing/renderProject.js";
import { valueOf } from "./testing/valueOf.js";

function headingCode(mark: string): string {
  return `import { defineReactScene } from "@yumekit/scene";

export default defineReactScene(({ props }) => (
  <div style={{ position: "absolute", inset: 0, background: "#eef1f4" }}>
    <h1 ${mark} style={{ margin: 12, fontSize: 28, color: "#18203a" }}>
      {typeof props.title === "string" ? props.title : ""}
    </h1>
  </div>
));
`;
}

async function renderedPng(mark: string): Promise<Buffer> {
  const folder = await createRenderProject({
    edits: [
      moduleScene({
        sceneId: "heading",
        code: headingCode(mark),
        props: { title: "Marked text" },
      }),
      sceneTracks({
        tracks: [
          [
            {
              id: "heading",
              sceneId: "heading",
              startFrame: 0,
              durationFrames: 10,
            },
          ],
        ],
      }),
    ],
  });
  const rendered = valueOf(
    await renderFrame({ folder, outputId: "wide", frame: 5 }),
  );
  return Buffer.from(rendered.png);
}

describe("the mark of a text prop", () => {
  it("adds no pixel to a rendered frame", async () => {
    const withMark = await renderedPng('data-text-prop="title"');
    const withoutMark = await renderedPng("");

    expect(withMark.equals(withoutMark)).toBe(true);
  });
});
