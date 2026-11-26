import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  claudeLines,
  requestTextsSent,
  setScenario,
} from "../../testing/chatTesting.js";
import { closeBrowser, openProject } from "../../testing/editorPage.js";
import {
  moneyLimitOf,
  pricedEngineOptions,
} from "../../testing/pricedMedia.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import {
  openPicturesTake,
  readyTake,
  takesOf,
} from "../../testing/takeProject.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function readyPictures(options: {
  assetId: string;
  estimateUsd: number;
}): Promise<void> {
  await openPicturesTake({
    engine: runningEngine(),
    assetIds: [options.assetId],
  });
  await readyTake({
    engine: runningEngine(),
    items: [{ id: options.assetId }],
    nextStepEstimateUsd: options.estimateUsd,
  });
}

beforeAll(async () => {
  engine = await runEngine(pricedEngineOptions);
  await setScenario({
    engine,
    scenario: {
      steps: [
        { print: claudeLines.init },
        { print: claudeLines.whole("I go on.") },
        { print: claudeLines.result("completed") },
      ],
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the warning about money before the send of a take", () => {
  it("takes the place of All good, and Raise writes the limit before the lead goes on", async () => {
    await readyPictures({ assetId: "harbor", estimateUsd: 3.2 });
    const { page, close } = await openProject(runningEngine().url);
    const foot = page.locator(".work-foot");

    await expect
      .poll(() => foot.locator("p").first().innerText())
      .toBe(
        "The clips cost about $3.20 and $3.00 is left. Nothing is spent until you pick.",
      );
    expect(await foot.getByRole("button").allInnerTexts()).toEqual([
      "Raise this project to $5",
      "Make fewer clips",
      "Stop here",
    ]);
    await foot
      .getByRole("button", { name: "Raise this project to $5" })
      .click();

    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain("Take 1 of the pictures: all good. Go on.");
    expect(await moneyLimitOf(runningEngine())).toBe(5);
    await close();
  });

  it("asks the lead for fewer clips, or stops with the pictures approved and no turn", async () => {
    await readyPictures({ assetId: "ferry", estimateUsd: 9 });
    const { page, close } = await openProject(runningEngine().url);
    const foot = page.locator(".work-foot");

    await foot.getByRole("button", { name: "Make fewer clips" }).click();
    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain("Make fewer clips.");
    await readyPictures({ assetId: "lantern", estimateUsd: 9 });
    const runs = (await requestTextsSent(runningEngine())).length;
    await foot.getByRole("button", { name: "Stop here" }).click();

    await expect
      .poll(async () => (await takesOf(runningEngine())).at(-1)?.state)
      .toBe("sent");
    expect((await requestTextsSent(runningEngine())).length).toBe(runs);
    await expect
      .poll(() => foot.locator("p").first().innerText())
      .toBe("You approved this take.");
    expect(await moneyLimitOf(runningEngine())).toBe(5);
    await close();
  });
});
