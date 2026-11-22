import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { startPreviewEdit } from "../testing/previewText.js";
import { storedPropsOf } from "../testing/kitSceneProject.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

const markedSceneCode = `import { defineReactScene } from "@yumekit/scene";

export default defineReactScene(({ props }) => {
  const title = typeof props.title === "string" ? props.title : "";
  const count = typeof props.count === "number" ? props.count : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#202020", color: "#ffffff" }}>
      <h1 data-text-prop="title" style={{ fontSize: 24, margin: 10 }}>{title}</h1>
      <p style={{ fontSize: 16, margin: 10 }}>A plain line</p>
      <p data-text-prop="count" style={{ fontSize: 16, margin: 10 }}>{count} days</p>
    </div>
  );
});
`;

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

const storedProps = () =>
  storedPropsOf({ engine: runningEngine(), sceneId: "marked" });

beforeAll(async () => {
  engine = await runEngine();
  await engine.callTool({
    name: "put_scene",
    input: {
      scene_id: "marked",
      title: "Marked",
      code: markedSceneCode,
      props: { title: "Own title", count: 3 },
    },
  });
  await engine.callTool({
    name: "set_timeline",
    input: {
      output_id: "wide",
      tracks: [
        {
          id: "scenes",
          kind: "scene",
          clips: [
            {
              id: "marked",
              scene_id: "marked",
              start_frame: 0,
              duration_frames: 30,
            },
          ],
        },
      ],
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("a text in a custom scene", () => {
  it("changes a text that carries the mark of its prop, and keeps each other text as it is", async () => {
    const editor = await openEditor(runningEngine().url);
    const preview = editor.page.frameLocator(
      'iframe[title="Preview of the video"]',
    );
    await startPreviewEdit({
      page: editor.page,
      text: preview.getByText("Own title"),
    });
    await editor.page.keyboard.type("Changed title");
    await editor.page.keyboard.press("Enter");
    await expect
      .poll(storedProps)
      .toEqual({ title: "Changed title", count: 3 });
    await expect.poll(() => preview.getByText("Changed title").count()).toBe(1);

    for (const text of ["A plain line", "3 days"]) {
      const line = preview.getByText(text);
      await line.click({ force: true });
      await editor.page.keyboard.type("Typed");
      await editor.page.keyboard.press("Enter");
      expect(await line.getAttribute("contenteditable")).toBeNull();
    }

    expect(await preview.getByText("Typed").count()).toBe(0);
    expect(await storedProps()).toEqual({ title: "Changed title", count: 3 });
    await editor.close();
  });
});
