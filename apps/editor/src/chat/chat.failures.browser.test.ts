import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  chatOf,
  claudeLines,
  setScenario,
  writeFakeAgentSettings,
  writeSettings,
} from "../testing/chatTesting.js";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

const answersDone = {
  steps: [
    { print: claudeLines.init },
    { print: claudeLines.whole("Done.") },
    { print: claudeLines.result("completed") },
  ],
};

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildCounterProject(engine);
});

afterEach(async () => {
  await writeFakeAgentSettings(runningEngine());
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the failures in the chat", () => {
  it("says when no AI program can run, and a button opens the AI part of Settings", async () => {
    await writeSettings({
      engine: runningEngine(),
      settings: { agent: "cursor" },
    });
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);

    await chat.ask("Make it shorter.");

    await expect
      .poll(() => chat.entryTexts(1))
      .toEqual([
        "No AI program is on this computer. Install Claude Code, Codex, or Cursor, start it once in a terminal, and sign in.\nOpen Settings",
      ]);
    expect(await chat.box.inputValue()).toBe("Make it shorter.");
    expect(
      await editor.page
        .getByRole("button", { name: "No AI is set up yet. Open Settings." })
        .count(),
    ).toBe(1);
    await chat.history.getByRole("button", { name: "Open Settings" }).click();
    const settings = editor.page.getByRole("dialog", { name: "Settings" });
    expect(
      await settings
        .getByRole("heading", { name: "AI", exact: true })
        .isVisible(),
    ).toBe(true);
    await editor.close();
  });

  it("tells the person to sign in, and Try again sends the request after the sign-in", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: { ...answersDone, signedIn: false },
    });
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);

    await chat.ask("Make it shorter.");

    await expect
      .poll(() => chat.entryTexts(1))
      .toEqual([
        "Claude Code is not signed in. Open a terminal, run claude once, and sign in. Then try again.\nTry again",
      ]);
    await setScenario({ engine: runningEngine(), scenario: answersDone });
    await chat.history.getByRole("button", { name: "Try again" }).click();

    await expect
      .poll(() => chat.entryTexts(2))
      .toEqual(["You\nMake it shorter.", "AI\nDone."]);
    await editor.close();
  });

  it("shows a failed request in plain words, and Try again sends the same request again", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: {
        steps: [
          { print: claudeLines.init },
          { print: claudeLines.failedResult("The model is busy.") },
        ],
        exitCode: 1,
      },
    });
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);

    await chat.ask("Add a title.");

    await expect
      .poll(() => chat.entryTexts(2))
      .toEqual([
        "You\nAdd a title.",
        "The AI stopped with a problem: The model is busy.\nTry again",
      ]);
    await setScenario({ engine: runningEngine(), scenario: answersDone });
    await chat.history.getByRole("button", { name: "Try again" }).click();

    await expect
      .poll(() => chat.entryTexts(2))
      .toEqual(["You\nAdd a title.", "AI\nDone."]);
    expect(
      await chat.history.getByRole("button", { name: "Try again" }).count(),
    ).toBe(0);
    await editor.close();
  });

  it("says when the settings file is not valid", async () => {
    await writeSettings({ engine: runningEngine(), settings: "{ not json" });
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);

    await chat.ask("Make it shorter.");

    await expect
      .poll(() => chat.entryTexts(1))
      .toEqual([
        expect.stringMatching(
          /^The settings file .*settings\.json is not valid\. Correct it or remove it\.$/,
        ),
      ]);
    await editor.close();
  });
});
