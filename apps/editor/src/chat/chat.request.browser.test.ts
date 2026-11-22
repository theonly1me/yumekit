import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  chatOf,
  claudeLines,
  gateFileOf,
  openGate,
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
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("a request in the chat", () => {
  it("shows the answer, the steps, and the change while they happen, and the preview follows", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: {
        steps: [
          { print: claudeLines.init },
          {
            print: claudeLines.toolUse({
              callId: "1",
              tool: "resize_scene_clip",
            }),
          },
          {
            callTool: {
              name: "resize_scene_clip",
              input: { clip_id: "second", duration_frames: 60 },
            },
          },
          { print: claudeLines.toolResult("1") },
          { print: claudeLines.part("I made scene 2") },
          { waitForFile: gateFileOf(runningEngine()) },
          { print: claudeLines.whole("I made scene 2 one second longer.") },
          { print: claudeLines.result("completed") },
        ],
      },
    });
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);

    await chat.ask("Make scene 2 one second longer.");

    await expect.poll(() => chat.stopButton.count()).toBe(1);
    await expect.poll(() => chat.box.inputValue()).toBe("");
    await expect
      .poll(() => chat.entryTexts(3))
      .toEqual([
        "You\nMake scene 2 one second longer.",
        "AI\nI made scene 2\nChanging the length of a scene",
        "The AI is changing the project.\nUndo",
      ]);
    await expect.poll(() => lengths()).toBe("30 60");
    await expect
      .poll(() =>
        editor.page.locator(".card", { hasText: "Second counter" }).innerText(),
      )
      .toContain("2 seconds");
    expect(
      await editor.page
        .getByRole("button", { name: "Undo", exact: true })
        .last()
        .isDisabled(),
    ).toBe(true);

    await openGate(runningEngine());

    await expect.poll(() => chat.sendButton.count()).toBe(1);
    await expect
      .poll(() => chat.entryTexts(3))
      .toEqual([
        "You\nMake scene 2 one second longer.",
        "AI\nI made scene 2 one second longer.",
        "I made scene 2 one second longer.\nUndo",
      ]);
    expect(
      await editor.page.locator("[aria-live='polite']").last().textContent(),
    ).toBe("I made scene 2 one second longer.");
    await editor.close();
  });

  it("keeps the history after a reload, and Undo on the last change restores the project", async () => {
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);
    await expect
      .poll(() => chat.entryTexts(3))
      .toEqual([
        "You\nMake scene 2 one second longer.",
        "AI\nI made scene 2 one second longer.",
        "I made scene 2 one second longer.\nUndo",
      ]);

    await editor.page
      .getByRole("button", { name: "Undo", exact: true })
      .last()
      .click();

    await expect.poll(() => lengths()).toBe("30 30");
    await expect
      .poll(() => chat.entryTexts(1))
      .toEqual(["I made scene 2 one second longer.\nUndone"]);
    expect(
      await chat.history.locator(".change").last().getAttribute("data-undone"),
    ).toBe("true");
    await editor.close();
  });

  it("stops a running request, and Send comes back", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: {
        steps: [
          { print: claudeLines.init },
          { print: claudeLines.part("Working") },
          { waitForStop: { print: [claudeLines.result("aborted_streaming")] } },
        ],
      },
    });
    const editor = await openEditor(runningEngine().url);
    const chat = chatOf(editor.page);

    await chat.ask("Make a long video.");
    await expect.poll(() => chat.entryTexts(1)).toEqual(["AI\nWorking"]);
    await chat.stopButton.click();

    await expect
      .poll(() => chat.entryTexts(1))
      .toEqual(["AI\nWorking\nStopped"]);
    await expect.poll(() => chat.sendButton.count()).toBe(1);
    await editor.close();
  });
});
