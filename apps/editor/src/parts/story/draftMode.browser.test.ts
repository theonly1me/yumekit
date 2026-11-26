import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { claudeLines, setScenario } from "../../testing/chatTesting.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { openStepSheet } from "../../testing/stepViews.js";
import {
  buildStoryProject,
  forgeShot,
  storyArc,
} from "../../testing/storyProject.js";
import { openMoreSettings } from "../../testing/mediaTestTools.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function callAsAi(call: { name: string; input: object }) {
  const { origin, token } = runningEngine();
  const response = await fetch(`${origin}/api/tools/${call.name}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-yumekit-client": "agent",
    },
    body: JSON.stringify({ input: call.input }),
  });
  expect(response.ok).toBe(true);
}

async function checksOfProject(): Promise<unknown> {
  const text = await readFile(
    join(runningEngine().projectFolder, "project.json"),
    "utf8",
  );
  return z
    .looseObject({ checks: z.string().optional() })
    .parse(JSON.parse(text)).checks;
}

async function chatText(): Promise<string> {
  const { origin, token } = runningEngine();
  const response = await fetch(`${origin}/api/chat`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.text();
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withChromium: true });
  await buildStoryProject(runningEngine());
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("a film in draft mode in the editor", () => {
  it("picks how the AI checks the film in Settings, with the fast draft first", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await openMoreSettings(page);
    const choices = page
      .getByRole("dialog", { name: "Settings" })
      .getByRole("group", { name: "How the AI checks the film" });
    const draft = choices.getByRole("button", { name: /^Fast draft/ });
    const careful = choices.getByRole("button", { name: /^Careful/ });

    expect(await draft.getAttribute("aria-pressed")).toBe("true");
    await careful.click();

    await expect.poll(checksOfProject).toBe("critic");
    await expect.poll(() => careful.getAttribute("aria-pressed")).toBe("true");
    await close();
  });

  it("shows the time of each stage of the AI and the time left of the target", async () => {
    await callAsAi({
      name: "set_story_plan",
      input: { ...storyArc, shots: [forgeShot] },
    });
    await callAsAi({
      name: "generate_asset",
      input: {
        asset_id: "strike-start-2",
        capability: "image",
        shot_id: forgeShot.shot_id,
        input: { prompt: "strike", width_pixels: 32, height_pixels: 18 },
      },
    });
    const { page, close } = await openEditor(runningEngine().url);
    await openStepSheet({ page, name: "Story" });
    const clock = page
      .getByRole("dialog", { name: "The story" })
      .locator(".film-clock");

    await expect.poll(() => clock.innerText()).toContain("of 10 min");
    const stages = await clock
      .getByRole("list", { name: "Time of each stage" })
      .getByRole("listitem")
      .allInnerTexts();
    expect(stages.map((stage) => stage.split("\n")[0])).toEqual([
      "Plan",
      "First pictures",
    ]);
    expect(await clock.innerText()).toContain("left of the target.");
    await close();
  });

  it("asks the AI for a second look at a shot through the chat", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: {
        steps: [
          { print: claudeLines.init },
          { print: claudeLines.whole("The critic looked at shot 1.") },
          { print: claudeLines.result("completed") },
        ],
      },
    });
    const { page, close } = await openEditor(runningEngine().url);
    await openStepSheet({ page, name: "Story" });
    const sheet = page.getByRole("dialog", { name: "The story" });

    await sheet
      .getByRole("button", { name: "Ask for a second look at shot 1" })
      .click();

    await expect
      .poll(() => sheet.getByRole("status").allInnerTexts())
      .toContain("Asked. The answer comes in the chat.");
    await expect.poll(chatText).toContain("Please give shot 1 a second look.");
    await close();
  });
});
