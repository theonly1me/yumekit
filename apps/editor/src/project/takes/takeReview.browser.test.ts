import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  claudeLines,
  requestTextsSent,
  setScenario,
} from "../../testing/chatTesting.js";
import { closeBrowser, openProject } from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import {
  openPicturesTake,
  readyTake,
  takesOf,
} from "../../testing/takeProject.js";

const pinSchema = z.object({
  pin: z.object({ x: z.number(), y: z.number() }),
});

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
        { print: claudeLines.whole("I make them again.") },
        { print: claudeLines.result("completed") },
      ],
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the review of a take", () => {
  it("sends a pin on a picture, a moment in the music, and a dropped picture as notes", async () => {
    await openPicturesTake({
      engine: runningEngine(),
      assetIds: ["harbor", "lantern"],
    });
    await runningEngine().callTool({
      name: "generate_asset",
      input: {
        asset_id: "strings",
        capability: "music",
        server: "sample",
        input: { prompt: "Low strings", duration_seconds: 4 },
      },
    });
    await readyTake({
      engine: runningEngine(),
      items: [
        { id: "harbor" },
        { id: "lantern" },
        { id: "strings", what_to_check: "Listen for the swell at 2 seconds." },
      ],
    });
    const { page, close } = await openProject(runningEngine().url);
    const large = page.getByRole("dialog", { name: /^Large view of / });
    const leaveTheBox = () => large.locator(".large-keys").click();

    const position = large.locator(".large-top p");

    await page.getByRole("button", { name: "Open Low strings" }).click();
    expect(await position.innerText()).toBe("1 of 3");
    const time = large.getByRole("slider", { name: "Time in Low strings" });
    await expect.poll(() => time.getAttribute("max")).toBe("4");
    await time.fill("1.5");
    await large.getByRole("button", { name: "Mark this moment" }).click();
    await page.keyboard.type("The swell comes late.");
    await leaveTheBox();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => position.innerText()).toBe("2 of 3");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Open The harbor in fog" }).click();
    const box = await large.locator(".stage-box").boundingBox();
    if (box === null) throw new Error("The picture has no box.");
    await page.mouse.click(box.x + box.width / 4, box.y + box.height / 2);
    await page.keyboard.type("Make the wall taller.");
    await leaveTheBox();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Open The lantern in fog" }).click();
    await large.getByRole("button", { name: "Don't use this one" }).click();
    await page.keyboard.press("Escape");

    expect(await large.count()).toBe(0);
    expect(
      (
        await page
          .locator('.tile[data-marked="true"] .tile-notes')
          .allInnerTexts()
      ).toSorted(),
    ).toEqual(["1 note", "1 note", "Not used"]);
    await page
      .getByRole("button", { name: "Send 3 notes to the lead" })
      .click();
    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain("3 notes for the lead");
    const [sent] = await takesOf(runningEngine());
    const [moment, pinned, dropped] = sent?.notes ?? [];
    const { pin } = pinSchema.parse(pinned);
    expect(moment).toEqual({
      itemId: "strings",
      text: "The swell comes late.",
      seconds: 1.5,
    });
    expect(pinned).toMatchObject({
      itemId: "harbor",
      text: "Make the wall taller.",
    });
    expect(pin.x).toBeCloseTo(0.25, 2);
    expect(pin.y).toBeCloseTo(0.5, 2);
    expect(dropped).toEqual({ itemId: "lantern", text: "", dropped: true });
    await close();
  });

  it("sends a take with no notes as all good", async () => {
    await openPicturesTake({ engine: runningEngine(), assetIds: ["harbor-2"] });
    await readyTake({
      engine: runningEngine(),
      items: [{ id: "harbor-2", replaces_asset_id: "harbor" }],
    });
    const { page, close } = await openProject(runningEngine().url);

    await page.getByRole("button", { name: /^All good/ }).click();

    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain("all good. Go on.");
    expect((await takesOf(runningEngine())).at(-1)).toMatchObject({
      state: "sent",
      notes: [],
    });
    await close();
  });
});
