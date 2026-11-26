import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { counterCode } from "../../testing/counterProject.js";
import { closeBrowser, openProject } from "../../testing/editorPage.js";
import { engineRequest } from "../../testing/mediaTestTools.js";
import { musicCall } from "../../testing/reviewTakes.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { openPicturesTake, readyTake } from "../../testing/takeProject.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function putStringsInTheFilm(running: RunningEngine): Promise<void> {
  await running.callTool({
    name: "put_scene",
    input: { scene_id: "counter", title: "Counter", code: counterCode },
  });
  await running.callTool({
    name: "set_timeline",
    input: {
      output_id: "wide",
      tracks: [
        {
          id: "scenes",
          kind: "scene",
          clips: [{ scene_id: "counter", start_frame: 0, duration_frames: 30 }],
        },
        {
          id: "music",
          kind: "audio",
          clips: [{ asset_id: "strings", start_frame: 0, duration_frames: 30 }],
        },
      ],
    },
  });
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withChromium: true });
  await openPicturesTake({ engine, assetIds: ["harbor", "lantern"] });
  await readyTake({ engine, items: [{ id: "harbor" }, { id: "lantern" }] });
  await engineRequest({
    engine,
    path: "/api/takes/take-1/send",
    method: "POST",
    body: {
      notes: [{ item_id: "lantern", text: "Make it dimmer." }],
      next: "stop",
    },
  });
  await openPicturesTake({ engine, assetIds: ["ferry", "lantern-2"] });
  await engine.callTool({
    name: "generate_asset",
    input: musicCall({ assetId: "strings", prompt: "Low strings" }),
  });
  await readyTake({
    engine,
    items: [
      { id: "ferry" },
      { id: "lantern-2", replaces_asset_id: "lantern" },
      { id: "strings", what_to_check: "The swell at 2 seconds." },
    ],
  });
  await putStringsInTheFilm(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

function rowNames(page: Page): Promise<(string | null)[]> {
  return page
    .getByRole("article")
    .evaluateAll((rows) => rows.map((row) => row.getAttribute("aria-label")));
}

async function pick(options: { page: Page; filter: string }): Promise<void> {
  await options.page
    .getByRole("group", { name: "Show" })
    .getByRole("button", { name: new RegExp(`^${options.filter} \\d+$`) })
    .click();
}

describe("the filters of a take", () => {
  it("show all, what is not reviewed, what has mistakes, what is in use, and what is new", async () => {
    const { page, close } = await openProject(runningEngine().url);
    const chips = page.getByRole("group", { name: "Show" });
    await page.getByRole("article", { name: "The ferry in fog" }).waitFor();
    const before = await chips.innerText();

    await page
      .getByRole("article", { name: "The ferry in fog" })
      .getByRole("button", { name: "Bad hands" })
      .click();
    await pick({ page, filter: "Has mistakes" });
    const mistakes = await rowNames(page);
    await pick({ page, filter: "Not reviewed" });
    const open = await rowNames(page);
    await page
      .getByRole("article", { name: "The lantern-2 in fog" })
      .getByRole("button", { name: "Looks right" })
      .click();
    const keptWhileReviewing = await rowNames(page);
    await pick({ page, filter: "Not reviewed" });
    const openAgain = await rowNames(page);
    await pick({ page, filter: "In use" });
    const inUse = await rowNames(page);
    await pick({ page, filter: "New in this take" });
    const fresh = await rowNames(page);

    expect(before.replace(/\s+/g, " ")).toBe(
      "All 4 Not reviewed 4 Has mistakes 0 In use 4 New in this take 3",
    );
    expect(mistakes).toEqual(["The ferry in fog"]);
    expect(open).toEqual([
      "Low strings",
      "The lantern-2 in fog",
      "The harbor in fog",
    ]);
    expect(keptWhileReviewing).toEqual(open);
    expect(openAgain).toEqual(["Low strings", "The harbor in fog"]);
    expect(inUse).toEqual([
      "Low strings",
      "The lantern-2 in fog",
      "The harbor in fog",
    ]);
    expect(fresh).toEqual([
      "Low strings",
      "The ferry in fog",
      "The lantern-2 in fog",
    ]);
    await close();
  });
});
