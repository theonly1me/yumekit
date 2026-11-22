import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { buildKitSceneProject } from "../testing/kitSceneProject.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";
import { runHome, type RunningHome } from "../testing/runHome.js";

const lookLabels = ["Midnight", "Studio", "Editorial", "Neon", "Paper"];
const started: (RunningHome | RunningEngine)[] = [];
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
  it("shows each look on the start screen as a title card that the kit draws, and makes the project in the picked look", async () => {
    const home = await runHome({ making: { calls: [], ending: "done" } });
    started.push(home);
    const { page, close } = await openEditor(home.url);
    const looks = page.getByRole("group", { name: "Look" });

    await expect
      .poll(() => looks.locator('.look-picture[data-state="ready"]').count())
      .toBe(5);
    expect(await looks.locator(".look-stage h1").allTextContents()).toEqual(
      lookLabels,
    );
    expect(
      await looks.locator('[aria-pressed="true"] .look-name').textContent(),
    ).toBe("Midnight");
    await looks.getByRole("button", { name: /^Editorial/ }).click();
    await page.getByLabel("What do you want to make?").fill("Tea in the rain");
    await page.getByRole("button", { name: "Make the video" }).click();

    await expect
      .poll(() =>
        lookInFolder(join(home.projectsFolder, "tea-in-the-rain")).catch(
          () => undefined,
        ),
      )
      .toBe("editorial");
    await close();
  });

  it("changes the look from Settings, and the preview draws the new look at once", async () => {
    const engine = await runEngine();
    started.push(engine);
    await buildKitSceneProject(engine);
    const editor = await openEditor(engine.url);
    const heading = editor.page
      .frameLocator('iframe[title="Preview of the video"]')
      .locator("h1");
    await expect.poll(() => heading.count()).toBe(1);

    await editor.page.getByRole("button", { name: "Settings" }).click();
    const settings = editor.page.getByRole("dialog", { name: "Settings" });
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
