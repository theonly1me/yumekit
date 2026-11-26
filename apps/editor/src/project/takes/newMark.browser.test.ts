import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { claudeLines, setScenario } from "../../testing/chatTesting.js";
import { closeBrowser, openProject } from "../../testing/editorPage.js";
import { engineRequest } from "../../testing/mediaTestTools.js";
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

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withChromium: true });
  await setScenario({
    engine,
    scenario: {
      steps: [
        { print: claudeLines.init },
        { print: claudeLines.whole("On to take 2.") },
        { print: claudeLines.result("completed") },
      ],
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

async function sendFirstTake(): Promise<void> {
  await openPicturesTake({
    engine: runningEngine(),
    assetIds: ["harbor", "lantern"],
  });
  await readyTake({
    engine: runningEngine(),
    items: [{ id: "harbor" }, { id: "lantern" }],
  });
  await engineRequest({
    engine: runningEngine(),
    path: "/api/takes/take-1/send",
    method: "POST",
    body: { notes: [] },
  });
  await expect
    .poll(async () => (await takesOf(runningEngine()))[0]?.state)
    .toBe("sent");
}

describe("the New mark of a take", () => {
  it("marks what the lead made in this take and a remake, and not an earlier picture that the lead names again", async () => {
    await sendFirstTake();
    await openPicturesTake({
      engine: runningEngine(),
      assetIds: ["ferry", "harbor-2"],
    });
    await readyTake({
      engine: runningEngine(),
      items: [
        { id: "ferry" },
        { id: "harbor-2", replaces_asset_id: "harbor" },
        { id: "lantern" },
      ],
    });
    const { page, close } = await openProject(runningEngine().url);
    const tileOf = (caption: string) =>
      page.locator(".tile", {
        has: page.getByRole("button", { name: `Open ${caption}` }),
      });

    await tileOf("The ferry in fog").waitFor();
    const newMarks = await Promise.all(
      ["The ferry in fog", "The harbor-2 in fog", "The lantern in fog"].map(
        (caption) => tileOf(caption).locator(".tile-new").count(),
      ),
    );
    await page.getByRole("button", { name: "Open The lantern in fog" }).click();
    const badges = page
      .getByRole("dialog", { name: /^Large view of / })
      .locator(".large-badges");

    expect(newMarks).toEqual([1, 1, 0]);
    await expect.poll(() => badges.innerText()).toBe("Made before this take");
    await close();
  });
});
