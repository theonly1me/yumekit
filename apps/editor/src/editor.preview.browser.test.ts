import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject, lastFrame } from "./testing/counterProject.js";
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

describe("the editor preview", () => {
  it("removes the token from the address bar after the first load", async () => {
    const editor = await openEditor(runningEngine().url);
    await expect
      .poll(() => editor.page.getByText("Editor test").count())
      .toBe(1);

    expect(editor.page.url()).toBe(`${runningEngine().origin}/`);
    await editor.close();
  });

  it("shows the frame of the scrubber in the preview", async () => {
    const editor = await openEditor(runningEngine().url);
    const scrubber = editor.page.getByRole("slider", { name: "Frame" });

    await scrubber.fill("45");

    await expect.poll(editor.previewFrame).toBe(45);
    await scrubber.fill("12");
    await expect.poll(editor.previewFrame).toBe(12);
    await editor.close();
  });

  it("plays from the scrubber frame, moves the frame, and stops at the last frame", async () => {
    const editor = await openEditor(runningEngine().url);
    await editor.page.getByRole("slider", { name: "Frame" }).fill("20");
    await expect.poll(editor.previewFrame).toBe(20);

    await editor.page.getByRole("button", { name: "Play" }).click();

    await expect.poll(editor.previewFrame).toBeGreaterThan(20);
    await expect
      .poll(() => editor.page.getByRole("button", { name: "Play" }).count())
      .toBe(1);
    expect(await editor.scrubberFrame()).toBe(lastFrame);
    await expect.poll(editor.previewFrame).toBe(lastFrame);
    await editor.close();
  });

  it("changes the shape of the preview when the output switch changes", async () => {
    const editor = await openEditor(runningEngine().url);
    const preview = editor.page.locator(".preview");
    await expect.poll(() => preview.getAttribute("data-output")).toBe("wide");
    const wide = await preview.boundingBox();

    await editor.page.getByRole("button", { name: "Tall" }).click();

    await expect.poll(() => preview.getAttribute("data-output")).toBe("tall");
    const tall = await preview.boundingBox();
    expect((wide?.width ?? 0) / (wide?.height ?? 1)).toBeCloseTo(16 / 9, 1);
    expect((tall?.width ?? 0) / (tall?.height ?? 1)).toBeCloseTo(9 / 16, 1);
    await expect
      .poll(() =>
        editor.page
          .locator('iframe[title="Preview of the current frame"]')
          .getAttribute("src"),
      )
      .toContain("output=tall");
    await expect.poll(editor.previewFrame).toBe(0);
    await editor.close();
  });
});
