import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  claudeLines,
  gateFileOf,
  openGate,
  requestTextsSent,
  setScenario,
} from "../../testing/chatTesting.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { buildFilesProject } from "../../testing/filesProject.js";
import { engineRequest } from "../../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { openStepSheet } from "../../testing/stepViews.js";
import { wavBytes } from "../../testing/wavFile.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withVoiceServer: true });
  await buildFilesProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

const assetIdsSchema = z.object({
  assets: z.array(z.object({ id: z.string() })),
});

async function assetIds(): Promise<string[]> {
  const project = assetIdsSchema.parse(
    await engineRequest({ engine: runningEngine(), path: "/api/project" }),
  );
  return project.assets.map((asset) => asset.id);
}

async function openFiles() {
  const editor = await openEditor(runningEngine().url);
  await openStepSheet({ page: editor.page, name: "Files" });
  await editor.page.getByRole("heading", { name: "The files" }).waitFor();
  return editor;
}

function groupTexts(options: { page: Page; group: string }) {
  return options.page
    .getByRole("list", { name: options.group, exact: true })
    .locator(".file-text")
    .allInnerTexts();
}

function removeButton(options: { page: Page; name: string }) {
  return options.page.getByRole("button", { name: `Remove ${options.name}` });
}

describe("the files view", () => {
  it("lists each file in its group with where the video uses it, and Remove is off for a file in use", async () => {
    const { page, close } = await openFiles();

    await expect
      .poll(() => groupTexts({ page, group: "Pictures" }))
      .toEqual([
        expect.stringMatching(
          /^A quiet lake\n64 x 36 · Made with .+\nIn the video: Scene 2$/,
        ),
        expect.stringMatching(
          /^A spare sky\n64 x 36 · Made with .+\nNot in the video$/,
        ),
      ]);
    expect(await groupTexts({ page, group: "Voice" })).toEqual([
      expect.stringMatching(
        /^A short line\n0:01 · .+\nIn the video: Captions, Voice$/,
      ),
    ]);
    expect(await groupTexts({ page, group: "Music" })).toEqual([
      expect.stringMatching(/^A calm tune\n0:02 · .+\nIn the video: Music$/),
    ]);
    const usedRemove = removeButton({ page, name: "A quiet lake" });
    expect(await usedRemove.isDisabled()).toBe(true);
    expect(await usedRemove.getAttribute("title")).toBe(
      "The video uses this file in Scene 2.",
    );
    expect(await removeButton({ page, name: "A spare sky" }).isDisabled()).toBe(
      false,
    );
    await close();
  });

  it("removes a file that nothing uses, as one change that undo brings back", async () => {
    const { page, close } = await openFiles();

    await removeButton({ page, name: "A spare sky" }).click();

    await expect.poll(assetIds).not.toContain("spare");
    await expect
      .poll(() => groupTexts({ page, group: "Pictures" }))
      .toHaveLength(1);
    await runningEngine().callTool({ name: "undo", input: {} });
    await expect.poll(assetIds).toContain("spare");
    await close();
  });

  it("adds a dropped file under its original name, asks the AI to use it, and stays locked while the AI works", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: {
        steps: [
          { print: claudeLines.init },
          { waitForFile: gateFileOf(runningEngine()) },
          { print: claudeLines.result("completed") },
        ],
      },
    });
    const { page, close } = await openFiles();

    await page.locator(".file-drop input[type=file]").setInputFiles({
      name: "Morning guitar.wav",
      mimeType: "audio/wav",
      buffer: wavBytes(1),
    });
    await expect
      .poll(() => groupTexts({ page, group: "Sounds" }))
      .toEqual(["Morning guitar.wav\n0:01 · Your file\nNot in the video"]);
    await page
      .getByRole("button", { name: "Use Morning guitar.wav in the video" })
      .click();

    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain(
        "Use my file Morning guitar.wav in the video where it fits best.",
      );
    const spareRemove = removeButton({ page, name: "A spare sky" });
    await expect.poll(() => spareRemove.isDisabled()).toBe(true);
    expect(await page.locator(".file-drop input").isDisabled()).toBe(true);
    const download = page.getByRole("button", { name: "Download A spare sky" });
    expect(await download.isDisabled()).toBe(false);
    expect(
      await page
        .getByRole("button", { name: "Play Morning guitar.wav" })
        .isDisabled(),
    ).toBe(false);
    await openGate(runningEngine());
    await expect.poll(() => spareRemove.isDisabled()).toBe(false);
    await close();
  });
});
