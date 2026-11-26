import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { withoutOtherBundled } from "../../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

const started: RunningEngine[] = [];
const fileSchema = z.object({ limits: z.unknown() }).partial();
const sampleOnly = { mcpServers: { sample: {}, ...withoutOtherBundled } };

afterAll(async () => {
  await closeBrowser();
  await Promise.all(started.map((running) => running.remove()));
});

async function startWith(mediaTools: object) {
  const engine = await runEngine({ mediaTools });
  started.push(engine);
  const editor = await openEditor(engine.url);
  await editor.page
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  const settings = editor.page.getByRole("dialog", { name: "Settings" });
  const limitsFile = (folder: string) => async () => {
    const text = await readFile(join(folder, "media-tools.json"), "utf8").catch(
      () => "{}",
    );
    const parsed: unknown = JSON.parse(text);
    return fileSchema.parse(parsed).limits ?? null;
  };
  return {
    engine,
    editor,
    settings,
    userLimits: limitsFile(
      engine.environment["YUMEKIT_CONFIG_DIRECTORY"] ?? "",
    ),
    projectLimits: limitsFile(engine.projectFolder),
    spendLine: () => settings.locator(".spend-line").innerText(),
  };
}

describe("the limits in Settings", () => {
  it("are set once for every project in the user file, and other limits for this project go to the project file and back", async () => {
    const { editor, settings, userLimits, projectLimits, spendLine } =
      await startWith(sampleOnly);
    const everyMoney = settings.getByRole("textbox", {
      name: "Money for every project",
    });

    await expect.poll(() => everyMoney.inputValue()).toBe("5");
    await settings.getByRole("button", { name: "5 dollars more" }).click();
    await expect.poll(userLimits).toEqual({ spendingUsd: 10 });
    await expect.poll(spendLine).toContain("Spent $0.00 of $10.00");
    expect(await projectLimits()).toBeNull();

    await settings
      .getByRole("checkbox", { name: /^Use other limits for this project/ })
      .check();
    const ownMoney = settings.getByRole("textbox", {
      name: "Money for this project",
    });
    await expect.poll(() => ownMoney.inputValue()).toBe("10");
    await ownMoney.fill("2.5");
    await ownMoney.press("Enter");
    await expect
      .poll(projectLimits)
      .toEqual({ spendingUsd: 2.5, generatedVideoSeconds: 60 });
    await expect.poll(spendLine).toContain("Spent $0.00 of $2.50");

    await settings
      .getByRole("checkbox", { name: /^Use other limits for this project/ })
      .uncheck();
    await expect.poll(projectLimits).toBeNull();
    await expect.poll(spendLine).toContain("Spent $0.00 of $10.00");
    expect(await ownMoney.count()).toBe(0);
    await editor.close();
  });

  it("show that a project with its own limits keeps them", async () => {
    const { editor, settings } = await startWith({
      ...sampleOnly,
      limits: { spendingUsd: 12, generatedVideoSeconds: 90 },
    });
    const own = settings.getByRole("checkbox", {
      name: /^Use other limits for this project/,
    });

    await expect.poll(() => own.isChecked()).toBe(true);
    expect(await own.locator("xpath=..").innerText()).toContain(
      "This project keeps its own limits.",
    );
    expect(
      await settings
        .getByRole("textbox", {
          name: "Seconds of real video for this project",
        })
        .inputValue(),
    ).toBe("90");
    expect(
      await settings
        .getByRole("textbox", { name: "Money for every project" })
        .inputValue(),
    ).toBe("5");
    await editor.close();
  });
});
