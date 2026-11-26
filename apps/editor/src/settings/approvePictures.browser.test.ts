import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { openMoreSettings } from "../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

const started: RunningEngine[] = [];
const projectSchema = z.looseObject({
  approvePicturesFirst: z.boolean().optional(),
});

afterAll(async () => {
  await closeBrowser();
  await Promise.all(started.map((running) => running.remove()));
});

async function approveFirstInFolder(folder: string) {
  const text = await readFile(join(folder, "project.json"), "utf8");
  return projectSchema.parse(JSON.parse(text)).approvePicturesFirst;
}

describe("Approve pictures before clips in Settings", () => {
  it("is on for a project with no value, sits under More settings, and off saves a quick draft in the project", async () => {
    const engine = await runEngine();
    started.push(engine);
    const editor = await openEditor(engine.url);
    await editor.page
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    const approveSwitch = editor.page
      .getByRole("dialog", { name: "Settings" })
      .getByRole("switch", { name: /^Approve pictures before clips/ });

    expect(await approveSwitch.isVisible()).toBe(false);
    await openMoreSettings(editor.page);
    expect(await approveSwitch.isChecked()).toBe(true);
    await approveSwitch.click();

    await expect
      .poll(() => approveFirstInFolder(engine.projectFolder))
      .toBe(false);
    await expect.poll(() => approveSwitch.isChecked()).toBe(false);
    await editor.close();
  });
});
