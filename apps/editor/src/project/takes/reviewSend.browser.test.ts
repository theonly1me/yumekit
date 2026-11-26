import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  claudeLines,
  requestTextsSent,
  setScenario,
} from "../../testing/chatTesting.js";
import { closeBrowser, openProject } from "../../testing/editorPage.js";
import { musicCall, takeById } from "../../testing/reviewTakes.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { openPicturesTake, readyTake } from "../../testing/takeProject.js";

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
  await openPicturesTake({
    engine,
    assetIds: ["harbor", "lantern", "ferry", "pier"],
  });
  await engine.callTool({
    name: "generate_asset",
    input: musicCall({ assetId: "strings", prompt: "Low strings" }),
  });
  await readyTake({
    engine,
    items: ["harbor", "lantern", "ferry", "pier", "strings"].map((id) => ({
      id,
      ...(id === "strings" ? { what_to_check: "The swell at 2 seconds." } : {}),
    })),
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

async function pinAt(options: { page: Page; caption: string }) {
  const row = options.page.getByRole("article", { name: options.caption });
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
  await row.locator(".pin-stage").scrollIntoViewIfNeeded();
  const box = await row.locator(".pin-stage").boundingBox();
  if (box === null) throw new Error("The picture has no box.");
  await options.page.mouse.click(box.x + box.width / 2, box.y + box.height / 4);
  return row;
}

describe("the send of a review", () => {
  it("gives the lead each verdict, tag, note, pin, and moment, a drop, and a question", async () => {
    const { page, close } = await openProject(runningEngine().url);
    const harbor = await pinAt({ page, caption: "The harbor in fog" });
    await page.keyboard.type("Make the wall taller.");
    await harbor.getByRole("button", { name: "Wrong place" }).click();
    await harbor
      .getByRole("textbox", { name: "Your note" })
      .fill("The wall is too low.");
    await page
      .getByRole("article", { name: "The lantern in fog" })
      .getByRole("button", { name: "Don't use this one" })
      .click();
    const ferry = page.getByRole("article", { name: "The ferry in fog" });
    await ferry.getByRole("button", { name: "Not sure" }).click();
    await ferry
      .getByRole("textbox", { name: "Your note" })
      .fill("Is the fog too thick?");
    await page
      .getByRole("article", { name: "The pier in fog" })
      .getByRole("button", { name: "Looks right" })
      .click();
    const strings = page.getByRole("article", { name: "Low strings" });
    const time = strings.getByRole("slider", { name: "Time in Low strings" });
    await expect.poll(() => time.getAttribute("max")).toBe("4");
    await time.fill("1.5");
    await strings.getByRole("button", { name: "Mark this moment" }).click();
    await page.keyboard.type("The swell comes late.");

    await page
      .getByText(
        "2 to change, 1 to leave out, and 1 question. Everything else counts as approved.",
      )
      .waitFor();
    await page
      .getByRole("button", { name: "Send the review to the lead" })
      .click();

    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain(
        "Take 1 of the pictures: 2 to change, 1 to leave out, and 1 question.",
      );
    const request = (await requestTextsSent(runningEngine())).at(-1) ?? "";
    expect(request).toContain(
      '2. The picture "harbor": has mistakes. Tags: Wrong place. "The wall is too low."',
    );
    expect(request).toContain(
      '   Pin 1 at 50% from the left and 25% from the top: "Make the wall taller."',
    );
    expect(request).toContain(
      '4. The picture "ferry": the person is not sure.',
    );
    const sent = await takeById({ engine: runningEngine(), takeId: "take-1" });
    expect(sent?.state).toBe("sent");
    const notes = sent?.notes ?? [];
    const [general, pinned] = notes.filter((note) => note.itemId === "harbor");
    const { pin } = pinSchema.parse(pinned);
    expect(general).toEqual({
      itemId: "harbor",
      text: "The wall is too low.",
      tags: ["Wrong place"],
    });
    expect(pinned).toMatchObject({
      itemId: "harbor",
      text: "Make the wall taller.",
    });
    expect(pin.x).toBeCloseTo(0.5, 2);
    expect(pin.y).toBeCloseTo(0.25, 2);
    expect(notes.filter((note) => note.itemId !== "harbor")).toEqual([
      { itemId: "strings", text: "The swell comes late.", seconds: 1.5 },
      { itemId: "lantern", text: "", dropped: true },
      { itemId: "ferry", text: "Is the fog too thick?", question: true },
    ]);
    expect(
      sent?.items.map((item) => [item.id, item["approved"] ?? false]),
    ).toEqual([
      ["harbor", false],
      ["lantern", false],
      ["ferry", false],
      ["pier", true],
      ["strings", false],
    ]);
    await close();
  });
});
