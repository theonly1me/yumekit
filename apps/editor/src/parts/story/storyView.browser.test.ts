import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { openStepSheet } from "../../testing/stepViews.js";
import { buildStoryProject } from "../../testing/storyProject.js";
import { noPlanText } from "./StoryView.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withChromium: true });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the story view", () => {
  it("says what a plan is when the video has none", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    await openStepSheet({ page, name: "Story" });

    await expect
      .poll(() => page.getByRole("dialog").innerText())
      .toContain(noPlanText);
    await close();
  });

  it("shows the plan, and each shot with its pictures and its check in plain words", async () => {
    await buildStoryProject(runningEngine());
    const { page, close } = await openEditor(runningEngine().url);
    await openStepSheet({ page, name: "Story" });
    const sheet = page.getByRole("dialog", { name: "The story" });

    await expect
      .poll(() => sheet.locator(".story-logline").innerText())
      .toBe("A young smith forges a blade that will not break.");
    expect(await sheet.locator(".story-arc").innerText()).toContain(
      "The steel cracks when it cools",
    );
    const rows = await sheet.locator(".shot-row .shot-text").allInnerTexts();
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain(
      "1. She strikes the red steel and the blade bends",
    );
    expect(rows[0]).toContain(
      "The forge · Medium shot from low, Push in · 4 seconds",
    );
    expect(rows[0]).toContain("Checked and kept from 0 to 0.5 seconds.");
    expect(rows[0]).toContain("The hammer changes hands at 0.8 seconds");
    expect(rows[1]).toContain("No clip yet.");
    await expect
      .poll(() =>
        sheet.getByRole("img", { name: "The start picture of shot 1" }).count(),
      )
      .toBe(1);
    expect(
      await sheet
        .getByRole("button", { name: "Play the clip of shot 1" })
        .count(),
    ).toBe(1);
    await close();
  });
});
