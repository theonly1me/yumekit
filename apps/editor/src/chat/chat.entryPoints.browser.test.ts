import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  chatOf,
  claudeLines,
  requestTextsSent,
  setScenario,
} from "../testing/chatTesting.js";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildCounterProject(engine);
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "voice",
      capability: "speech",
      server: "sample",
      input: { text: "A short line" },
    },
  });
  await engine.callTool({
    name: "place_narration",
    input: {
      output_id: "wide",
      asset_id: "voice",
      start_frame: 0,
      with_captions: true,
    },
  });
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

async function lastRequestText(): Promise<string | undefined> {
  return (await requestTextsSent(runningEngine())).at(-1);
}

describe("the other places that talk to the chat", () => {
  it("sends a new scene from the plus between two cards, and names the two neighbor scenes", async () => {
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);

    await editor.page
      .getByRole("button", { name: "Add a scene after scene 1" })
      .click();
    const field = editor.page.getByRole("textbox", {
      name: "Describe the new scene after scene 1",
    });
    await field.fill("A dog runs on a beach");
    await field.press("Enter");

    const expected =
      'Add a new scene between scene 1 "First counter" and scene 2 "Second counter". The new scene: A dog runs on a beach';
    await expect.poll(() => lastRequestText()).toBe(expected);
    await expect
      .poll(() => chat.entryTexts(2))
      .toEqual([`You\n${expected}`, "AI\nDone."]);
    expect(await field.count()).toBe(0);
    await editor.close();
  });

  it("puts the start of a request in the box from Change on the captions row", async () => {
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);

    const sound = editor.page.getByRole("list", { name: "Sound" });
    await sound.getByRole("button", { name: "Change the captions" }).click();

    expect(await chat.box.inputValue()).toBe("Change the captions to ");
    expect(
      await chat.box.evaluate((element) => element === document.activeElement),
    ).toBe(true);
    await chat.box.pressSequentially("large words");
    expect(await chat.box.inputValue()).toBe(
      "Change the captions to large words",
    );
    await editor.close();
  });

  it("asks the AI to fit the voice after a scene gets longer", async () => {
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);
    await editor.page.locator(".card", { hasText: "First counter" }).click();
    await editor.page
      .getByRole("button", { name: "One second longer" })
      .click();

    await editor.page
      .getByRole("button", { name: "Ask the AI to fit the voice" })
      .click();

    const expected =
      "The voice may not match the scenes now. Fit the voice to the scenes.";
    await expect.poll(() => lastRequestText()).toBe(expected);
    await expect
      .poll(() => chat.entryTexts(2))
      .toEqual([`You\n${expected}`, "AI\nDone."]);
    await editor.close();
  });

  it("sends a suggestion with a click", async () => {
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);
    const suggestions = editor.page.getByRole("group", { name: "Suggestions" });
    await expect
      .poll(() => suggestions.getByRole("button").allInnerTexts())
      .toEqual([
        "Make it shorter",
        "Change the voice",
        "Add a scene about price",
        "Make the opening stronger",
      ]);

    await suggestions.getByRole("button", { name: "Make it shorter" }).click();

    await expect.poll(() => lastRequestText()).toBe("Make it shorter");
    await expect
      .poll(() => chat.entryTexts(2))
      .toEqual(["You\nMake it shorter", "AI\nDone."]);
    await editor.close();
  });
});
