import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { buildKitSceneProject } from "../testing/kitSceneProject.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";
import { openMoreSettings } from "../testing/mediaTestTools.js";

const started: RunningEngine[] = [];
const projectSchema = z.looseObject({ look: z.string().optional() });

afterAll(async () => {
  await closeBrowser();
  await Promise.all(started.map((running) => running.remove()));
});

async function lookInFolder(folder: string): Promise<string | undefined> {
  const text = await readFile(join(folder, "project.json"), "utf8");
  return projectSchema.parse(JSON.parse(text)).look;
}

describe("the looks", () => {
  it("changes the look from Settings, and the preview draws the new look at once", async () => {
    const engine = await runEngine();
    started.push(engine);
    await buildKitSceneProject(engine);
    const editor = await openEditor(engine.url);
    const heading = editor.page
      .frameLocator('iframe[title="Preview of the video"]')
      .locator("h1");
    await expect.poll(() => heading.count()).toBe(1);

    await editor.page
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    const settings = editor.page.getByRole("dialog", { name: "Settings" });
    await openMoreSettings(editor.page);
    await settings.getByRole("button", { name: /^Neon/ }).click();

    await expect.poll(() => lookInFolder(engine.projectFolder)).toBe("neon");
    await expect
      .poll(() =>
        heading.evaluate((element) => getComputedStyle(element).color),
      )
      .toBe("rgb(245, 245, 245)");
    expect(
      await settings
        .locator('.look-choice[aria-pressed="true"] .look-name')
        .textContent(),
    ).toBe("Neon");
    await editor.close();
  });
});
