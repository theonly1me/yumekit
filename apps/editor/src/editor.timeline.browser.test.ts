import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildCounterProject,
  clipLengthFrames,
  counterCode,
  lastFrame,
} from "./testing/counterProject.js";
import { closeBrowser, openEditor } from "./testing/editorPage.js";
import { runEngine, type RunningEngine } from "./testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine();
  await buildCounterProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the scene cards and the detailed timeline", () => {
  it("moves the playhead to the start of a scene card that the person picks", async () => {
    const editor = await openEditor(runningEngine().url);

    await editor.page.getByRole("button", { name: /Second counter/ }).click();

    expect(await editor.scrubberFrame()).toBe(clipLengthFrames);
    await expect.poll(editor.previewFrame).toBe(clipLengthFrames);
    await editor.page.getByRole("tab", { name: "Scene 2" }).click();
    await expect
      .poll(() =>
        editor.page
          .getByLabel("Name of the scene", { exact: true })
          .inputValue(),
      )
      .toBe("Second counter");
    await editor.close();
  });

  it("moves the playhead to a clip and to a point of the ruler in the timeline", async () => {
    const editor = await openEditor(runningEngine().url);
    await editor.page
      .getByRole("switch", { name: "Detailed timeline" })
      .check();

    await editor.page
      .getByRole("button", { name: "Second counter", exact: true })
      .click();
    const afterClip = await editor.scrubberFrame();
    const ruler = editor.page.getByTestId("ruler");
    const box = await ruler.boundingBox();
    await ruler.click({ position: { x: (box?.width ?? 0) / 4, y: 4 } });
    const afterRuler = await editor.scrubberFrame();

    expect(afterClip).toBe(clipLengthFrames);
    expect(Math.abs(afterRuler - lastFrame / 4)).toBeLessThanOrEqual(1);
    await expect.poll(editor.previewFrame).toBe(afterRuler);
    await editor.close();
  });

  it("shows an edit by another client with no reload", async () => {
    const editor = await openEditor(runningEngine().url);
    await expect
      .poll(() => editor.page.getByText("First counter").count())
      .toBe(1);
    await editor.showStart();
    await editor.page.evaluate(() => {
      document.documentElement.dataset["loadMarker"] = "kept";
    });

    await runningEngine().callTool({
      name: "put_scene",
      input: {
        scene_id: "first",
        title: "Renamed by an agent",
        code: counterCode,
        props: { offset: 100 },
      },
    });

    await expect
      .poll(() => editor.page.getByText("Renamed by an agent").count())
      .toBe(1);
    await expect.poll(editor.previewFrame).toBe(100);
    expect(
      await editor.page.evaluate(
        () => document.documentElement.dataset["loadMarker"],
      ),
    ).toBe("kept");
    await editor.close();
  });

  it("steps one frame with the arrow keys, and plays and pauses with Space", async () => {
    const editor = await openEditor(runningEngine().url);
    await editor.page
      .getByRole("slider", { name: "Position in the video" })
      .fill("10");
    await editor.page.locator("body").click({ position: { x: 5, y: 5 } });

    await editor.page.keyboard.press("ArrowRight");
    await editor.page.keyboard.press("ArrowRight");
    await editor.page.keyboard.press("ArrowLeft");
    const afterArrows = await editor.scrubberFrame();
    await editor.page.keyboard.press("Space");
    await expect
      .poll(() => editor.page.getByRole("button", { name: "Pause" }).count())
      .toBe(1);
    await editor.page.keyboard.press("Space");

    expect(afterArrows).toBe(11);
    await expect
      .poll(() => editor.page.getByRole("button", { name: "Play" }).count())
      .toBe(1);
    await editor.close();
  });
});
