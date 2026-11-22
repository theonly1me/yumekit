import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  chatOf,
  claudeLines,
  requestTextsSent,
  setScenario,
} from "../testing/chatTesting.js";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { scenesRowClipsOf } from "../testing/projectFacts.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function lengths(): Promise<string> {
  const clips = await scenesRowClipsOf({
    engine: runningEngine(),
    outputId: "wide",
  });
  return clips.map((clip) => clip.durationFrames).join(" ");
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildCounterProject(engine);
  await setScenario({
    engine,
    scenario: {
      steps: [
        { print: claudeLines.init },
        { print: claudeLines.whole("Done.") },
        { print: claudeLines.result("completed") },
      ],
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the changes in the chat", () => {
  it("asks before Undo on an older change also undoes the later ones", async () => {
    for (const durationFrames of [60, 90]) {
      await runningEngine().callTool({
        name: "resize_scene_clip",
        input: { clip_id: "first", duration_frames: durationFrames },
      });
    }
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);
    await expect
      .poll(() => chat.entryTexts(2))
      .toEqual([
        "You changed the length of a scene.\nUndo",
        "You changed the length of a scene.\nUndo",
      ]);
    const older = chat.history.locator(".change").nth(-2);

    await older.getByRole("button", { name: "Undo", exact: true }).click();
    const confirm = older.getByRole("group", { name: "Undo the change" });
    expect(await confirm.innerText()).toContain(
      "This also undoes 1 later change.",
    );
    await confirm.getByRole("button", { name: "Cancel" }).click();
    expect(await confirm.count()).toBe(0);
    expect(await lengths()).toBe("90 30");

    await older.getByRole("button", { name: "Undo", exact: true }).click();
    await confirm.getByRole("button", { name: "Undo them" }).click();

    await expect.poll(() => lengths()).toBe("30 30");
    await expect
      .poll(() => chat.entryTexts(2))
      .toEqual([
        "You changed the length of a scene.\nUndone",
        "You changed the length of a scene.\nUndone",
      ]);
    await editor.close();
  });

  it("sends the picked scene with the scene chip, and sends no scene after the chip is removed", async () => {
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);
    await editor.page.locator(".card", { hasText: "Second counter" }).click();
    const chip = editor.page.locator(".about-chip");
    await expect
      .poll(() => chip.innerText())
      .toContain("About scene 2: Second counter");

    await chat.ask("Make it blue.");

    await expect
      .poll(() => chat.entryTexts(2))
      .toEqual([
        "You\nAbout scene 2: Second counter\nMake it blue.",
        "AI\nDone.",
      ]);
    expect((await requestTextsSent(runningEngine())).at(-1)).toBe(
      'The person picked the scene "Second counter" (scene id second, clip id second).\nMake it blue.',
    );

    await chip
      .getByRole("button", { name: "Ask about the full video" })
      .click();
    expect(await chip.count()).toBe(0);
    await chat.ask("Make it red.");

    await expect
      .poll(() => chat.entryTexts(2))
      .toEqual(["You\nMake it red.", "AI\nDone."]);
    expect((await requestTextsSent(runningEngine())).at(-1)).toBe(
      "Make it red.",
    );
    await editor.close();
  });

  it("keeps the place of the chat when the person opens the Scene tab and comes back", async () => {
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);
    await chat.box.fill("A draft that is not sent");
    await editor.page.locator(".card", { hasText: "First counter" }).click();
    await editor.page.getByRole("tab", { name: /^Scene/ }).click();
    expect(await chat.box.isVisible()).toBe(false);

    await editor.page.getByRole("tab", { name: "Chat" }).click();

    expect(await chat.box.inputValue()).toBe("A draft that is not sent");
    await expect
      .poll(() => chat.entryTexts(2))
      .toEqual(["You\nMake it red.", "AI\nDone."]);
    await editor.close();
  });
});
