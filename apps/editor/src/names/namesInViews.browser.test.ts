import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { buildNamedProject, namedIds } from "../testing/namedProject.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildNamedProject(engine);
}, 120_000);

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

const projectIds = [
  ...namedIds.scenes,
  ...namedIds.assets,
  "video-vid-w5",
  "captions-aud-v9",
];

function shownTextOf(page: Page): Promise<string> {
  return page.evaluate(() => {
    const labels = [...document.querySelectorAll("[aria-label], [title]")].map(
      (element) =>
        `${element.getAttribute("aria-label") ?? ""} ${element.getAttribute("title") ?? ""}`,
    );
    return [document.body.innerText, ...labels].join("\n");
  });
}

async function idsShownIn(page: Page): Promise<string[]> {
  const text = await shownTextOf(page);
  return projectIds.filter((id) => text.includes(id));
}

async function closeSheet(page: Page): Promise<void> {
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await page.getByRole("dialog").waitFor({ state: "detached" });
}

async function openSheet(options: { page: Page; button: string }) {
  await options.page
    .getByRole("button", { name: options.button, exact: true })
    .first()
    .click();
  await options.page.getByRole("dialog").waitFor();
  await options.page.waitForTimeout(500);
}

describe("the names in each view", () => {
  it("shows the titles and the labels of the project, and no scene id or asset id", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    await page.locator(".card", { hasText: "2. Harbor view" }).waitFor();
    await page.getByLabel("Detailed timeline").check();
    await expect.poll(() => idsShownIn(page)).toEqual([]);
    await expect
      .poll(() => shownTextOf(page))
      .toContain("You added a video clip to scene 2.");

    for (const button of ["Script", "Pictures", "Files", "Export"]) {
      await openSheet({ page, button });
      expect({ button, ids: await idsShownIn(page) }).toEqual({
        button,
        ids: [],
      });
      await closeSheet(page);
    }
    for (const button of ["Open the voice", "Open the music"]) {
      await openSheet({ page, button });
      expect({ button, ids: await idsShownIn(page) }).toEqual({
        button,
        ids: [],
      });
      await closeSheet(page);
    }

    await page.locator(".card", { hasText: "2. Harbor view" }).click();
    await openSheet({ page, button: "Make a real video clip" });
    await page.getByText("For scene 2: Harbor view.").waitFor();
    expect(await idsShownIn(page)).toEqual([]);
    await close();
  });

  it("shows no card for the captions in the Pictures view", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    await openSheet({ page, button: "Pictures" });
    await expect
      .poll(() =>
        page.locator(".picture-card > span:last-child").allInnerTexts(),
      )
      .toEqual(
        expect.arrayContaining([
          "1. Morning walk",
          "2. Harbor view",
          "3. Closing words",
        ]),
      );
    const titles = await page
      .locator(".picture-card > span:last-child")
      .allInnerTexts();
    expect(titles.filter((title) => title.includes("Captions"))).toEqual([]);
    await close();
  });
});
