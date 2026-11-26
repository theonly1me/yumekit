import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chatOf } from "../../testing/chatTesting.js";
import {
  closeBrowser,
  openProject,
  type EditorPage,
} from "../../testing/editorPage.js";
import {
  makeOwnersTakes,
  openMusicTake,
  readyMusic,
} from "../../testing/ownerTakes.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

let engine: RunningEngine | undefined;
let project: EditorPage | undefined;

function running(): { engine: RunningEngine; project: EditorPage } {
  if (engine === undefined || project === undefined) {
    throw new Error("The engine did not start");
  }
  return { engine, project };
}

beforeAll(async () => {
  engine = await runEngine({ withChromium: true });
  await makeOwnersTakes(engine);
  project = await openProject(engine.url);
});

afterAll(async () => {
  await project?.close();
  await closeBrowser();
  await engine?.remove();
});

describe("the newest take, with takes like the owner's", () => {
  it("shows take 6 at work, with one card for it and a quiet line for each replaced take", async () => {
    const { page } = running().project;
    const chat = chatOf(page);

    await page.locator('main[data-view="making"]').waitFor();
    expect(await page.locator(".slate").getAttribute("aria-label")).toBe(
      "Take 6",
    );
    const cards = await chat.history.locator(".take-card").allInnerTexts();
    expect(cards.map((card) => card.replace(/\n+/g, "\n"))).toEqual([
      "AI\nTake 6 of the clips is being made.\nOpen take 6",
    ]);
    expect(
      await chat.history.locator(".take-replaced").allInnerTexts(),
    ).toEqual([
      "Take 2 of the clips was replaced by take 5.",
      "Take 3 of the cut was replaced by take 6 of the clips.",
    ]);
  });

  it("opens a replaced take only to look at, with the way back to take 6", async () => {
    const { page } = running().project;
    const menu = page.getByRole("combobox", { name: "Earlier takes" });

    expect((await menu.locator("option").allInnerTexts()).slice(0, 2)).toEqual([
      "Take 6, clips and music (newest)",
      "Take 5, clips and music",
    ]);
    await menu.selectOption("take-2");

    await page
      .getByText(
        "You are looking at take 2. Take 5 replaced it, so it is only to look at.",
      )
      .waitFor();
    expect(
      await page
        .getByText("Take 5 replaced this take, so it is only to look at.")
        .count(),
    ).toBe(1);
    expect(await page.getByRole("button", { name: /^All good/ }).count()).toBe(
      0,
    );
    expect(
      await page
        .getByRole("button", { name: "Looks right" })
        .evaluateAll((buttons) =>
          buttons.every((button) => button.matches(":disabled")),
        ),
    ).toBe(true);

    await page.getByRole("button", { name: "Go to take 6" }).first().click();
    await expect
      .poll(() => page.locator(".slate").getAttribute("aria-label"))
      .toBe("Take 6");
  });

  it("holds a picked take until the lead opens a newer take", async () => {
    const { page } = running().project;
    const slate = () => page.locator(".slate").getAttribute("aria-label");
    await page
      .getByRole("combobox", { name: "Earlier takes" })
      .selectOption("take-5");
    await expect.poll(slate).toBe("Take 5");

    await readyMusic({ engine: running().engine, assetId: "drums" });
    await page.locator(".take-card.take-ready").waitFor();
    expect(await slate()).toBe("Take 5");

    await openMusicTake({ engine: running().engine, assetId: "cymbals" });
    await expect.poll(slate).toBe("Take 7");
  });
});
