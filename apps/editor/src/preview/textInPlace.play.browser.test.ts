import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { buildKitSceneProject } from "../testing/kitSceneProject.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

const playClipFrames = 600;

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function openAt(options: { frame: number }) {
  const editor = await openEditor(runningEngine().url);
  await editor.page
    .getByRole("slider", { name: "Position in the video" })
    .fill(String(options.frame));
  const preview = editor.page.frameLocator(
    'iframe[title="Preview of the video"]',
  );
  return { ...editor, preview };
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildKitSceneProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("a click on a text while the video plays", () => {
  it("stops the play when the person clicks a text", async () => {
    await runningEngine().callTool({
      name: "resize_scene_clip",
      input: { clip_id: "opening", duration_frames: playClipFrames },
    });
    const editor = await openAt({ frame: 0 });
    await editor.page.getByRole("button", { name: "Play" }).click();
    await expect
      .poll(() => editor.page.getByRole("button", { name: "Pause" }).count())
      .toBe(1);

    await editor.page.evaluate(() => {
      window.addEventListener("message", (event: MessageEvent<unknown>) => {
        const { data } = event;
        if (
          typeof data === "object" &&
          data !== null &&
          "type" in data &&
          data.type === "text-editing" &&
          "frame" in data
        ) {
          document.body.dataset["clickedFrame"] = String(data.frame);
        }
      });
    });

    await editor.preview.getByText("First heading").click({ force: true });

    await expect
      .poll(() => editor.page.getByRole("button", { name: "Play" }).count())
      .toBe(1);
    const clickedFrame = await editor.page.evaluate(() =>
      Number(document.body.dataset["clickedFrame"]),
    );
    await expect.poll(() => editor.scrubberFrame()).toBe(clickedFrame);
    expect(clickedFrame).toBeLessThan(playClipFrames);
    await editor.page.keyboard.press("Escape");
    await expect.poll(() => editor.scrubberFrame()).toBe(clickedFrame);
    expect(
      await editor.page.getByRole("button", { name: "Play" }).count(),
    ).toBe(1);
    await editor.close();
  });
});
