import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { withoutOtherBundled } from "../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

const started: RunningEngine[] = [];
const projectFileSchema = z.looseObject({
  limits: z.object({ generatedVideoSeconds: z.number() }),
});

afterAll(async () => {
  await closeBrowser();
  await Promise.all(started.map((running) => running.remove()));
});

async function projectLimitOf(engine: RunningEngine): Promise<number> {
  const text = await readFile(
    join(engine.projectFolder, "media-tools.json"),
    "utf8",
  );
  return projectFileSchema.parse(JSON.parse(text)).limits.generatedVideoSeconds;
}

describe("the limit of real video in Settings", () => {
  it("shows the limit and the used seconds, and saves a new limit in the project file with no restart", async () => {
    const engine = await runEngine({
      mediaTools: { mcpServers: { sample: {}, ...withoutOtherBundled } },
    });
    started.push(engine);
    await buildCounterProject(engine);
    const editor = await openEditor(engine.url);
    await editor.page
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    const settings = editor.page.getByRole("dialog", { name: "Settings" });
    const field = settings.getByRole("spinbutton", {
      name: /^AI video in this project/,
    });

    await expect.poll(() => field.inputValue()).toBe("60");
    expect(
      await settings.getByText("0 of 60 seconds used in this project.").count(),
    ).toBe(1);
    await field.fill("2.5");
    expect(await settings.getByRole("alert").textContent()).toBe(
      "Write a whole number of seconds.",
    );
    await field.fill("45");
    await settings.getByRole("button", { name: "Save" }).click();

    await expect.poll(() => projectLimitOf(engine).catch(() => 0)).toBe(45);
    await expect
      .poll(() =>
        settings.getByText("0 of 45 seconds used in this project.").count(),
      )
      .toBe(1);
    expect(await settings.getByRole("button", { name: "Save" }).count()).toBe(
      0,
    );
    await editor.close();
  });
});
