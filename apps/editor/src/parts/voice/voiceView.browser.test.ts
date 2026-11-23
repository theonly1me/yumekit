import type { Route, WebSocketRoute } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  chatOf,
  claudeLines,
  gateFileOf,
  openGate,
  setScenario,
} from "../../testing/chatTesting.js";
import {
  closeBrowser,
  openEditor,
  sharedBrowser,
} from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { buildSoundProject } from "../../testing/soundProject.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withVoiceServer: true });
  await buildSoundProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

const lateAgentName = "The agent of a late view";

const viewSchema = z.looseObject({ agent: z.looseObject({}) });

const lockedText =
  "The AI still works on the video. You can look now. You can change this when the AI finishes, or after you stop it.";

describe("the voice view", () => {
  it("opens from the Voice row, and the Captions row keeps Change", async () => {
    const editor = await openEditor(runningEngine().url);
    const rows = editor.page.getByRole("list", { name: "Sound" });

    await expect
      .poll(() => rows.getByRole("button").allTextContents())
      .toEqual(["Open", "Open", "Add a sound", "Change"]);
    await editor.page.getByRole("button", { name: "Open the voice" }).click();

    await editor.page
      .getByRole("heading", { name: "The voice", exact: true })
      .waitFor();
    await expect
      .poll(() => editor.page.locator(".voice-line").allInnerTexts())
      .toEqual(["Play\nScene 1: First counter\nA short line"]);
    await editor.close();
  });

  it("is locked while a request runs, and opens again when it ends", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: {
        steps: [
          { print: claudeLines.init },
          { waitForFile: gateFileOf(runningEngine()) },
          { print: claudeLines.whole("Done.") },
          { print: claudeLines.result("completed") },
        ],
      },
    });
    const editor = await openEditor(runningEngine().url);
    await chatOf(editor.page).ask("Make the video calmer.");
    await editor.page.getByRole("button", { name: "Open the voice" }).click();
    const removeVoice = editor.page.getByRole("button", {
      name: "Remove the voice",
    });

    await editor.page.getByText(lockedText).waitFor();
    expect(await removeVoice.isDisabled()).toBe(true);
    expect(
      await editor.page
        .getByRole("button", { name: "Download the voice" })
        .isDisabled(),
    ).toBe(false);
    await openGate(runningEngine());

    await expect.poll(() => editor.page.getByText(lockedText).count()).toBe(0);
    await expect.poll(() => removeVoice.isDisabled()).toBe(false);
    await editor.close();
  });

  it("stays locked from the ask on, also when the chat loads again before the engine gets the ask", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: { steps: [{ print: claudeLines.result("completed") }] },
    });
    const context = await (
      await sharedBrowser()
    ).newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const sockets: WebSocketRoute[] = [];
    await page.routeWebSocket(/\/api\/events/, (socket) => {
      socket.connectToServer();
      sockets.push(socket);
    });
    const heldAsks: Route[] = [];
    await page.route("**/api/chat/requests", (route) => {
      heldAsks.push(route);
    });
    await page.route("**/api/chat", async (route) => {
      const response = await route.fetch();
      if (heldAsks.length === 0) return route.fulfill({ response });
      const view = viewSchema.parse(await response.json());
      const agent = { ...view.agent, name: lateAgentName };
      return route.fulfill({ response, json: { ...view, agent } });
    });
    await page.goto(runningEngine().url);
    await page.getByRole("button", { name: /on this computer$/ }).waitFor();

    await chatOf(page).ask("Make the video calmer.");
    await expect.poll(() => heldAsks.length).toBe(1);
    await page.getByRole("button", { name: "Open the voice" }).click();
    await page.getByText(lockedText).waitFor();
    await sockets.at(-1)?.close();
    await page
      .getByRole("button", { name: `${lateAgentName} on this computer` })
      .waitFor();

    const removeVoice = page.getByRole("button", { name: "Remove the voice" });
    expect(await removeVoice.isDisabled()).toBe(true);
    for (const ask of heldAsks) await ask.continue();
    await expect.poll(() => removeVoice.isDisabled()).toBe(false);
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await context.close();
  });
});
