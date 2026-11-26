import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openProject } from "../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

beforeAll(async () => {
  engine = await runEngine();
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

function themeOf(page: Page): Promise<string | undefined> {
  return page.evaluate(() => document.documentElement.dataset["theme"]);
}

async function pickTheme(options: { page: Page; name: string }) {
  const { page } = options;
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const settings = page.getByRole("dialog", { name: "Settings" });
  await settings
    .getByRole("group", { name: "Dark or light" })
    .getByRole("button", { name: options.name, exact: true })
    .click();
  await settings.getByRole("button", { name: "Close" }).click();
}

describe("dark or light in Settings", () => {
  it("starts dark, turns the project screen light from Settings, and the editor keeps the choice after a reload", async () => {
    if (engine === undefined) throw new Error("The engine did not start");
    const { page, close } = await openProject(engine.url);
    await page.getByRole("button", { name: "Settings", exact: true }).waitFor();
    const first = await themeOf(page);

    await pickTheme({ page, name: "Light" });
    const picked = await themeOf(page);
    await page.reload();
    await page.getByRole("button", { name: "Edit by hand" }).click();
    await page.getByRole("button", { name: "Use the dark theme" }).waitFor();
    const inTheEditor = await themeOf(page);

    expect([first, picked, inTheEditor]).toEqual(["dark", "light", "light"]);
    await close();
  });
});
