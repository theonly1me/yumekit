import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  chatOf,
  claudeLines,
  requestTextsSent,
  setScenario,
} from "../../testing/chatTesting.js";
import { buildCounterProject } from "../../testing/counterProject.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

const sketch =
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="36"><rect width="64" height="36" fill="#c33"/></svg>';

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildCounterProject(engine);
  await setScenario({
    engine,
    scenario: {
      steps: [
        { print: claudeLines.init },
        { print: claudeLines.whole("I see the sketch.") },
        { print: claudeLines.result("completed") },
      ],
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

async function dropFile(options: {
  page: Page;
  name: string;
  type: string;
  content: string;
}): Promise<void> {
  const { page, ...file } = options;
  const dataTransfer = await page.evaluateHandle((dropped) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File([dropped.content], dropped.name, { type: dropped.type }),
    );
    return transfer;
  }, file);
  const form = page.locator("form.ask-form");
  await form.dispatchEvent("dragover", { dataTransfer });
  await form.dispatchEvent("drop", { dataTransfer });
}

describe("files in the chat", () => {
  it("shows a dropped picture as a chip, adds it to the project on Send, and names it in the request", async () => {
    const editor = await openEditor(runningEngine().url);
    const chips = editor.page.getByRole("list", { name: "Files for the AI" });

    await dropFile({
      page: editor.page,
      name: "sketch.svg",
      type: "image/svg+xml",
      content: sketch,
    });
    await expect.poll(() => chips.locator("li").count()).toBe(1);
    await chatOf(editor.page).ask("Use this for the hero.");

    await expect.poll(() => chips.count()).toBe(0);
    await expect
      .poll(() => chatOf(editor.page).entryTexts(2))
      .toEqual([
        "You\n1 file: sketch.svg\nUse this for the hero.",
        "AI\nI see the sketch.",
      ]);
    expect((await requestTextsSent(runningEngine())).at(-1)).toContain(
      "- sketch.svg: a picture, asset id sketch",
    );
    await editor.close();
  });

  it("shows why a file cannot go on its chip, and sends nothing until the person removes it", async () => {
    const editor = await openEditor(runningEngine().url);
    const chips = editor.page.getByRole("list", { name: "Files for the AI" });
    const sentBefore = (await requestTextsSent(runningEngine())).length;

    await dropFile({
      page: editor.page,
      name: "contract.pdf",
      type: "application/pdf",
      content: "%PDF-1.4",
    });
    await chatOf(editor.page).ask("Read this.");

    await expect
      .poll(() => chips.getByRole("alert").textContent())
      .toBe(
        "yumekit cannot read this kind of file. Add a picture, a video, a sound, a font, or a text file.",
      );
    expect(await chatOf(editor.page).box.inputValue()).toBe("Read this.");
    await chips.getByRole("button", { name: "Remove contract.pdf" }).click();
    await chatOf(editor.page).box.press("Enter");
    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).length)
      .toBe(sentBefore + 1);
    await editor.close();
  });

  it("puts the words of a dropped text file into the box, where the person can read and change them", async () => {
    const editor = await openEditor(runningEngine().url);
    const { box } = chatOf(editor.page);
    await box.fill("My story:");

    await dropFile({
      page: editor.page,
      name: "story.txt",
      type: "text/plain",
      content: "A girl carries a bell to the island.\n",
    });

    await expect
      .poll(() => box.inputValue())
      .toBe(
        "My story:\n\nFrom the file story.txt:\nA girl carries a bell to the island.",
      );
    expect(
      await editor.page.getByRole("list", { name: "Files for the AI" }).count(),
    ).toBe(0);
    await editor.close();
  });
});
