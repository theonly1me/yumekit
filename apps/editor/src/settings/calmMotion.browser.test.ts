import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { buildKitSceneProject } from "../testing/kitSceneProject.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";
import { openMoreSettings } from "../testing/mediaTestTools.js";

const started: RunningEngine[] = [];
const projectSchema = z.looseObject({ calm: z.boolean().optional() });

afterAll(async () => {
  await closeBrowser();
  await Promise.all(started.map((running) => running.remove()));
});

async function calmInFolder(folder: string): Promise<boolean | undefined> {
  const text = await readFile(join(folder, "project.json"), "utf8");
  return projectSchema.parse(JSON.parse(text)).calm;
}

describe("Calm motion in Settings", () => {
  it("is off for a project with no value, and on makes the heading of the preview fade in with no move", async () => {
    const engine = await runEngine();
    started.push(engine);
    await buildKitSceneProject(engine);
    const editor = await openEditor(engine.url);
    await editor.showStart();
    const firstWord = editor.page
      .frameLocator('iframe[title="Preview of the video"]')
      .locator("h1 span")
      .first();
    await expect.poll(() => firstWord.count()).toBe(1);
    const moveOfFirstWord = () =>
      firstWord.evaluate((element) => element.style.transform);
    await expect.poll(moveOfFirstWord).toMatch(/^translateY\([1-9]/);

    await editor.page
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    await openMoreSettings(editor.page);
    const calmSwitch = editor.page
      .getByRole("dialog", { name: "Settings" })
      .getByRole("switch", { name: /^Calm motion/ });
    expect(await calmSwitch.isChecked()).toBe(false);
    await calmSwitch.click();

    await expect.poll(() => calmInFolder(engine.projectFolder)).toBe(true);
    await expect.poll(moveOfFirstWord).toBe("translateY(0px)");
    await expect.poll(() => calmSwitch.isChecked()).toBe(true);
    await editor.close();
  });
});
