import type { Locator } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  claudeLines,
  requestTextsSent,
  setScenario,
} from "../../testing/chatTesting.js";
import { closeBrowser, openProject } from "../../testing/editorPage.js";
import { engineRequest } from "../../testing/mediaTestTools.js";
import { takeById } from "../../testing/reviewTakes.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { openPicturesTake, readyTake } from "../../testing/takeProject.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withChromium: true });
  await setScenario({
    engine,
    scenario: {
      steps: [
        { print: claudeLines.init },
        { print: claudeLines.whole("I use the first harbor.") },
        { print: claudeLines.result("completed") },
      ],
    },
  });
  await openPicturesTake({ engine, assetIds: ["harbor", "lantern"] });
  await readyTake({ engine, items: [{ id: "harbor" }, { id: "lantern" }] });
  await engineRequest({
    engine,
    path: "/api/takes/take-1/send",
    method: "POST",
    body: {
      notes: [{ item_id: "harbor", text: "Make the wall taller." }],
      next: "stop",
    },
  });
  await openPicturesTake({ engine, assetIds: ["harbor-2"] });
  await readyTake({
    engine,
    items: [{ id: "harbor-2", replaces_asset_id: "harbor" }],
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

function pressedOf(button: Locator): Promise<string | null> {
  return button.getAttribute("aria-pressed");
}

describe("Use this", () => {
  it("picks an older version for the film, moves In use, and the send names the pick", async () => {
    const { page, close } = await openProject(runningEngine().url);
    const row = page.getByRole("article", { name: "The harbor-2 in fog" });
    const compare = page.getByRole("dialog", {
      name: "Compare The harbor-2 in fog",
    });
    const older = compare.locator("figure", { hasText: "Take 1" });
    const newer = compare.locator("figure", { hasText: "Take 2, new" });
    await row.getByText("Saves as you type.").waitFor();

    await row.getByRole("button", { name: "Compare with take 1" }).click();
    await older.getByRole("button", { name: "Use this", exact: true }).click();
    const olderInUse = await older.getByText("In use").count();
    await page.keyboard.press("Escape");
    await row.getByRole("button", { name: "Use this", exact: true }).click();
    await row.getByRole("button", { name: "Compare with take 1" }).click();
    const afterNewerPick = [
      await pressedOf(
        older.getByRole("button", { name: "Use this", exact: true }),
      ),
      await newer.getByText("In use").count(),
    ];
    await older.getByRole("button", { name: "Use this", exact: true }).click();
    await page.keyboard.press("Escape");

    expect(olderInUse).toBe(1);
    expect(afterNewerPick).toEqual(["false", 1]);
    expect(
      await pressedOf(
        row.getByRole("button", { name: "Use this", exact: true }),
      ),
    ).toBe("false");
    await page
      .getByText("1 to use. Everything else counts as approved.")
      .waitFor();
    await page.getByRole("button", { name: /^All good/ }).click();
    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain('Use the picture "harbor" over its other versions');
    expect(
      (await takeById({ engine: runningEngine(), takeId: "take-2" }))?.notes,
    ).toEqual([{ itemId: "harbor", text: "", approved: true, use: true }]);
    await close();
  });
});
