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
  limits: z.object({ spendingUsd: z.number() }),
});

afterAll(async () => {
  await closeBrowser();
  await Promise.all(started.map((running) => running.remove()));
});

async function projectSpendingLimitOf(engine: RunningEngine): Promise<number> {
  const text = await readFile(
    join(engine.projectFolder, "media-tools.json"),
    "utf8",
  );
  return projectFileSchema.parse(JSON.parse(text)).limits.spendingUsd;
}

describe("the spending limit in Settings", () => {
  it("shows the money spent and the limit, and saves a new limit in the project file", async () => {
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
      name: /^Money for paid services in this project/,
    });

    await expect.poll(() => field.inputValue()).toBe("5");
    expect(
      await settings
        .getByText("About $0.00 of $5.00 spent in this project. $5.00 left.")
        .count(),
    ).toBe(1);
    await field.fill("-1");
    expect(await settings.getByRole("alert").textContent()).toBe(
      "Use 0 to 10000 US dollars.",
    );
    await field.fill("1.5");
    await settings.getByRole("button", { name: "Save" }).click();

    await expect
      .poll(() => projectSpendingLimitOf(engine).catch(() => 0))
      .toBe(1.5);
    await expect
      .poll(() =>
        settings
          .getByText("About $0.00 of $1.50 spent in this project. $1.50 left.")
          .count(),
      )
      .toBe(1);
    await editor.close();
  });
});
