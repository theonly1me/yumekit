import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { openStepSheet } from "../../testing/stepViews.js";
import {
  buildStoryProject,
  lengthenStoryPlan,
} from "../../testing/storyProject.js";
import { forgeStory, writeForgeStory } from "../../testing/wholeStory.js";
import { noPlanText } from "./storyViewTexts.js";

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
      "The forge · Medium shot from low, normal lens, Push in · 4 seconds · Music: rising",
    );
    expect(rows[0]).toContain(
      "Aiko: the straight blade glows on the anvil, at the anvil, in the middle, faces us.",
    );
    expect(rows[0]).toContain("The critic kept 0 to 0.5 seconds.");
    expect(rows[0]).toContain("The hammer changes hands at 0.8 seconds");
    expect(rows[0]).toContain("2 hammers, not 1 at 0.8s");
    expect(await sheet.locator(".sheet-checks").innerText()).toContain(
      "The critic passed it.",
    );
    expect(rows[0]).toContain("Difficulty 2 of 5");
    expect(rows[0]).toContain("The critic passed the start picture.");
    expect(rows[0]).toContain("Note: 0.3s: the sparks are a little orange");
    expect(rows[1]).toContain(
      "Note: Frame the barrel large, so the blade meets the water",
    );
    const check = await sheet.locator(".plan-check").innerText();
    expect(check).toContain("passed it");
    expect(check).toContain("Right on the first try");
    expect(check).toContain("1 of 2 shots");
    expect(check).toContain(
      "Keep the hammer in her right hand in every prompt",
    );
    const sheets = await sheet.locator(".sheet-checks").innerText();
    expect(sheets).toContain(
      "Used with a limit: Never show both of her hands close up",
    );
    expect(sheets).toContain(
      "From your brief, kept as is: She swings the hammer with her right hand",
    );
    expect(sheets).toContain(
      "Note: The apron is a shade lighter than the facts",
    );
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

  it("warns in Before the money when the plan and one retry pass the video limit", async () => {
    await lengthenStoryPlan(runningEngine());
    const { page, close } = await openEditor(runningEngine().url);
    await openStepSheet({ page, name: "Story" });
    const sheet = page.getByRole("dialog", { name: "The story" });

    await expect
      .poll(() => sheet.locator(".budget-warnings").innerText())
      .toContain(
        "The 2 shots of the plan have 20 seconds of video. With one retry of the two longest shots (20 seconds more), the film needs about 40 seconds, and the limit of the project is 30 seconds of generated video. Only the person can raise a limit, in Settings. The AI cannot.",
      );
    await close();
  });

  it("shows the whole story first, above the form, the logline, and the shots", async () => {
    await writeForgeStory(runningEngine());
    const { page, close } = await openEditor(runningEngine().url);
    await openStepSheet({ page, name: "Story" });
    const sheet = page.getByRole("dialog", { name: "The story" });
    const story = sheet.locator(".whole-story");

    await expect.poll(() => story.count()).toBe(1);
    const text = await story.innerText();
    expect(text).toContain(forgeStory.premise);
    expect(text).toContain("A blade that breaks in its first winter");
    expect(text).toContain("Does not know");
    expect(text).toContain("her father's last blade did not break");
    expect(text).toContain("It tests every blade, and it does not care whose.");
    expect(text).toContain("Drawn from the sheet of Aiko");
    expect(text).toContain(
      "The AI asks you to say yes to this story, or what to change, before it spends money.",
    );
    expect(
      await sheet
        .getByRole("list", { name: "The arc of the story" })
        .getByRole("listitem")
        .allInnerTexts(),
    ).toEqual(forgeStory.arc.map((step) => step.step));
    const storyTop = (await story.boundingBox())?.y ?? Infinity;
    const loglineTop =
      (await sheet.locator(".story-logline").boundingBox())?.y ?? 0;
    expect(storyTop).toBeLessThan(loglineTop);
    expect(await sheet.locator(".story-form").textContent()).toBe("A trailer");
    expect(await sheet.locator(".shot-row .shot-text").innerText()).toContain(
      "From the story: step 1 of the arc",
    );
    await close();
  });

  it("shows the form of the story once, with the story, over the form of the plan", async () => {
    await writeForgeStory(runningEngine());
    await runningEngine().callTool({
      name: "set_story",
      input: { ...forgeStory, form: "short" },
    });
    const { page, close } = await openEditor(runningEngine().url);
    await openStepSheet({ page, name: "Story" });
    const sheet = page.getByRole("dialog", { name: "The story" });

    await expect
      .poll(() => sheet.locator(".story-form").allTextContents())
      .toEqual(["A short film"]);
    expect(await sheet.locator(".whole-story .story-form").textContent()).toBe(
      "A short film",
    );
    await close();
  });
});
