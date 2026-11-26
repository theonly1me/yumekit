import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readSettings } from "../testing/chatTesting.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the AI part of Settings and the empty chat", () => {
  it("opens the AI part from the line under the box, and Use this saves the agent", async () => {
    const editor = await openEditor(runningEngine().url);
    const line = editor.page.locator(".agent-line");
    await expect
      .poll(() => line.innerText())
      .toBe("Claude Code on this computer");

    await line.click();
    const settings = editor.page.getByRole("dialog", { name: "Settings" });
    const rows = settings.getByRole("list", { name: "AI apps" });
    await expect
      .poll(() => rows.getByRole("listitem").allInnerTexts())
      .toEqual([
        "Claude Code\nFound on this computer. Signed in. Uses the plan you already pay for.\nIn use",
        "Codex\nFound on this computer. Uses the plan you already pay for.\nUse this",
        "Cursor\nInstall it, then open Settings again.\nNot found on this computer",
      ]);

    await rows.getByRole("button", { name: "Use Codex" }).click();

    await expect
      .poll(() => readSettings(runningEngine()))
      .toMatchObject({ agent: "codex" });
    expect(await readSettings(runningEngine())).toHaveProperty("agentPrograms");
    await expect
      .poll(() => rows.getByRole("listitem").nth(1).innerText())
      .toContain("In use");
    await settings.getByRole("button", { name: "Close" }).click();
    await expect.poll(() => line.innerText()).toBe("Codex on this computer");
    await editor.close();
  });
});
