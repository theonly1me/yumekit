import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chatOf, claudeLines, setScenario } from "../../testing/chatTesting.js";
import { closeBrowser, openProject } from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

const leadMakesATake = [
  { print: claudeLines.init },
  {
    callTool: {
      name: "open_take",
      input: { step: "pictures", chapter_id: "film" },
    },
  },
  {
    callTool: {
      name: "generate_asset",
      input: {
        asset_id: "harbor",
        capability: "image",
        server: "sample",
        input: { prompt: "The harbor", width_pixels: 320, height_pixels: 180 },
      },
    },
  },
  {
    callTool: {
      name: "ready_take",
      input: { items: [{ id: "harbor", note: "The harbor wall in fog." }] },
    },
  },
  { print: claudeLines.whole("Take 1 is ready: one picture to check.") },
  { print: claudeLines.result("completed") },
];

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await setScenario({ engine, scenario: { steps: leadMakesATake } });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("one event, one line in the chat", () => {
  it("shows the lead's words and the ready card for a take, with no change line to undo", async () => {
    const { page, close } = await openProject(runningEngine().url);
    const chat = chatOf(page);

    await chat.ask("Make the picture of the harbor.");
    await page.locator(".take-ready").waitFor();

    expect(await chat.history.locator(".entry.change").count()).toBe(0);
    const lines = await chat.history.locator(".entry.ai").allInnerTexts();
    expect(lines.map((line) => line.replace(/\n+/g, "\n"))).toEqual([
      "AI\nTake 1 is ready: one picture to check.",
      "AI\nTake 1 of the pictures is ready for you: 1 to check.\nOpen take 1",
    ]);
    await close();
  });
});
