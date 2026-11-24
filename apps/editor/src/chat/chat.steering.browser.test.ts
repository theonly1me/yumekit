import { writeFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  chatOf,
  claudeLines,
  gateFileOf,
  openGate,
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

const direction = "Stop adding scenes. Make the title say Hello.";

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildCounterProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("a message to the AI while it works", () => {
  it("keeps the box open, shows the message at once as waiting, and then as read by the AI after its next step", async () => {
    const secondGate = `${gateFileOf(runningEngine())}.second`;
    await setScenario({
      engine: runningEngine(),
      scenario: {
        steps: [
          { print: claudeLines.init },
          { print: claudeLines.part("Adding scenes") },
          { waitForFile: gateFileOf(runningEngine()) },
          { print: claudeLines.toolUse({ callId: "1", tool: "get_project" }) },
          { callTool: { name: "get_project", input: {} } },
          { print: claudeLines.toolResult("1") },
          { waitForFile: secondGate },
          { print: claudeLines.whole("The title now says Hello.") },
          { print: claudeLines.result("completed") },
        ],
      },
    });
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);

    await chat.ask("Make three more scenes.");
    await expect.poll(() => chat.stopButton.count()).toBe(1);
    expect(await chat.box.isEnabled()).toBe(true);
    expect(await chat.box.getAttribute("placeholder")).toBe(
      "Tell the AI something while it works",
    );

    await chat.ask(direction);

    await expect
      .poll(() => chat.entryTexts(1))
      .toEqual([`You\n${direction}\nWaiting for the AI's next step`]);
    await expect.poll(() => chat.box.inputValue()).toBe("");
    expect(await chat.stopButton.count()).toBe(1);

    await openGate(runningEngine());

    await expect
      .poll(async () => (await chat.entryTexts(2))[0])
      .toBe(`You\n${direction}\nRead by the AI`);
    expect(await chat.stopButton.count()).toBe(1);

    await writeFile(secondGate, "open");

    await expect.poll(() => chat.stopButton.count()).toBe(0);
    await expect
      .poll(() => chat.entryTexts(2))
      .toEqual([
        `You\n${direction}\nRead by the AI`,
        "AI\nThe title now says Hello.",
      ]);
    expect(await requestTextsSent(runningEngine())).toEqual([
      "Make three more scenes.",
    ]);
    await editor.close();
  });
});
