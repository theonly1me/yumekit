import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  chatOf,
  claudeLines,
  readSettings,
  setScenario,
} from "../../testing/chatTesting.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

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

const pageSteps = [
  { print: claudeLines.init },
  {
    callTool: {
      name: "ask_permission",
      input: {
        tool_name: "WebFetch",
        input: { url: "https://example.com/", prompt: "Describe it." },
      },
    },
  },
  { print: claudeLines.whole("The page shows the words Example Domain.") },
  { print: claudeLines.result("completed") },
];

async function leadAccessOf(engine: RunningEngine) {
  const saved = z
    .object({ leadAccess: z.string().optional() })
    .safeParse(await readSettings(engine));
  return saved.success ? saved.data.leadAccess : undefined;
}

describe("the permission card and what the lead may do", () => {
  it("shows the card above the box with the exact page, and folds the answer into one line", async () => {
    const editor = await openEditor(runningEngine().url);
    await setScenario({
      engine: runningEngine(),
      scenario: { steps: pageSteps },
    });
    const chat = chatOf(editor.page);

    await chat.ask("Open example.com and describe it.");
    const card = editor.page.getByRole("region", {
      name: "The AI wants to open a web page.",
    });
    await expect.poll(() => card.isVisible()).toBe(true);
    const detail = await card.locator(".permission-detail").textContent();
    await card.getByRole("button", { name: "Allow once" }).click();

    await expect.poll(() => card.count()).toBe(0);
    expect(detail).toBe("https://example.com/");
    await expect
      .poll(async () => (await chat.entryTexts(2)).join("\n"))
      .toContain("You allowed the AI once to open a web page.");
    await expect
      .poll(async () => (await chat.entryTexts(1)).join("\n"))
      .toContain("Example Domain");
  });

  it("saves what the lead may do, and adds and removes a folder that it may read", async () => {
    const { projectFolder } = runningEngine();
    const movies = join(dirname(projectFolder), "home", "Movies");
    await mkdir(movies, { recursive: true });
    const editor = await openEditor(runningEngine().url);
    const page = editor.page;
    await page.locator(".agent-line").click();
    const settings = page.getByRole("dialog", { name: "Settings" });
    const choices = settings.getByRole("group", {
      name: "What the lead may do",
    });
    const folders = settings.getByRole("list", {
      name: "Folders the lead may read",
    });

    await choices.getByRole("button", { name: "Only yumekit's tools" }).click();
    await expect.poll(() => leadAccessOf(runningEngine())).toBe("yumekit-only");
    await expect
      .poll(() => settings.getByLabel("Add a folder").count())
      .toBe(0);
    await choices
      .getByRole("button", { name: "Ask me when it needs to" })
      .click();
    await expect.poll(() => leadAccessOf(runningEngine())).toBe("ask-me");
    await settings.getByLabel("Add a folder").fill("~/No such folder");
    await settings.getByRole("button", { name: "Add", exact: true }).click();
    await expect
      .poll(() => settings.getByRole("alert").textContent())
      .toContain("There is no folder at");
    await settings
      .getByRole("group", { name: "Pick a folder" })
      .getByRole("button", { name: "Movies" })
      .click();
    await expect.poll(() => folders.innerText()).toContain("Movies");
    await folders.getByRole("button", { name: /^Remove / }).click();

    await expect.poll(() => folders.count()).toBe(0);
    await expect
      .poll(() => settings.locator(".lead-empty").textContent())
      .toBe("No folders yet.");
  });
});
