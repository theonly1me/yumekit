import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import {
  buildKitSceneProject,
  storedPropsOf,
} from "../testing/kitSceneProject.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine();
  await buildKitSceneProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("a text of the preview that the scene does not accept", () => {
  it("says why in plain words and shows the stored text again", async () => {
    const editor = await openEditor(runningEngine().url);
    await editor.page
      .getByRole("slider", { name: "Position in the video" })
      .fill("88");
    const preview = editor.page.frameLocator(
      'iframe[title="Preview of the video"]',
    );
    await preview.getByText("Rent").click();

    await editor.page.keyboard.type("x".repeat(61));
    await editor.page.keyboard.press("Enter");

    await expect
      .poll(() => editor.page.locator(".preview-failure").innerText())
      .toBe("The text did not change. Use at most 60 characters.");
    await expect.poll(() => preview.getByText("Rent").count()).toBe(1);
    expect(
      await storedPropsOf({ engine: runningEngine(), sceneId: "chart" }),
    ).toEqual({ heading: "Costs", bars: [{ label: "Rent", value: 40 }] });
    await editor.close();
  });
});
