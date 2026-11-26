import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openProject } from "../../testing/editorPage.js";
import {
  clipCall,
  makeInTake,
  savedDraftOf,
} from "../../testing/reviewTakes.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { readyTake } from "../../testing/takeProject.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

const pictureCall = (assetId: string) => ({
  asset_id: assetId,
  capability: "image",
  server: "sample",
  input: {
    prompt: `The ${assetId} in fog`,
    width_pixels: 320,
    height_pixels: 180,
  },
});

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withChromium: true });
  await makeInTake({
    engine,
    step: "pictures",
    calls: [
      pictureCall("harbor"),
      pictureCall("lantern"),
      clipCall({ assetId: "crossing", prompt: "The ferry crossing" }),
    ],
  });
  await readyTake({
    engine,
    items: [
      { id: "harbor" },
      { id: "lantern" },
      { id: "crossing", what_to_check: "Watch the bow at 1 second." },
    ],
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the review of a take on the page", () => {
  it("drops a numbered pin with its own words on a click of the picture, and opens no view", async () => {
    const { page, close } = await openProject(runningEngine().url);
    const row = page.getByRole("article", { name: "The harbor in fog" });
    const picture = row.locator(".pin-stage");
    await row.getByText("Click the picture to pin a mistake.").waitFor();
    await expect
      .poll(() =>
        row
          .locator("img")
          .evaluate(
            (image) => image instanceof HTMLImageElement && image.complete,
          ),
      )
      .toBe(true);
    await picture.scrollIntoViewIfNeeded();
    const box = await picture.boundingBox();
    if (box === null) throw new Error("The picture has no box.");

    await page.mouse.click(box.x + box.width / 4, box.y + box.height / 2);
    await page.keyboard.type("Make the wall taller.");

    expect(await page.getByRole("dialog").count()).toBe(0);
    expect(await row.locator(".pin").allInnerTexts()).toEqual(["1"]);
    expect(
      await row.getByRole("textbox", { name: "Words for pin 1" }).inputValue(),
    ).toBe("Make the wall taller.");
    expect(
      await row
        .getByRole("button", { name: "Has mistakes" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    await close();
  });

  it("marks a moment of a clip, and a click on its time seeks the clip there", async () => {
    const { page, close } = await openProject(runningEngine().url);
    const row = page.getByRole("article", { name: "The ferry crossing" });
    const time = row.getByRole("slider", {
      name: "Time in The ferry crossing",
    });
    await expect.poll(() => time.getAttribute("max")).toBe("2");

    await time.fill("1.5");
    await row.getByRole("button", { name: "Mark this moment" }).click();
    await page.keyboard.type("The bow jumps here.");
    await time.fill("0");
    await row.getByRole("button", { name: "Go to 0:01.5" }).click();

    await expect
      .poll(async () => Number(await time.inputValue()))
      .toBeCloseTo(1.5, 1);
    expect(
      await row
        .getByRole("textbox", { name: "Words for moment 0:01.5" })
        .inputValue(),
    ).toBe("The bow jumps here.");
    await close();
  });

  it("saves a note as the person types, with no button, and a reload keeps it", async () => {
    const { page, close } = await openProject(runningEngine().url);
    const row = page.getByRole("article", { name: "The lantern in fog" });

    await row.getByRole("textbox", { name: "Your note" }).fill("Too bright.");
    await row.getByText("Saved", { exact: true }).waitFor();
    await page.reload();

    const note = page
      .getByRole("article", { name: "The lantern in fog" })
      .getByRole("textbox", { name: "Your note" });
    await expect.poll(() => note.inputValue()).toBe("Too bright.");
    expect(
      (await savedDraftOf({ engine: runningEngine(), takeId: "take-1" }))[
        "lantern"
      ]?.note,
    ).toBe("Too bright.");
    await close();
  });
});
