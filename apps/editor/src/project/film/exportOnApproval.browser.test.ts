import { readFile, realpath } from "node:fs/promises";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { claudeLines, chatOf, setScenario } from "../../testing/chatTesting.js";
import {
  closeBrowser,
  openProject,
  type EditorPage,
} from "../../testing/editorPage.js";
import { probeVideo } from "../../testing/renderProject.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { readyCutTake } from "../../testing/takeProject.js";
import { callsFileOf } from "../../testing/testPrograms.js";

const revealPrograms: Partial<Record<NodeJS.Platform, string>> = {
  darwin: "open",
  linux: "xdg-open",
};
const revealProgram = revealPrograms[process.platform];

let engine: RunningEngine | undefined;
let project: EditorPage | undefined;

function running(): { engine: RunningEngine; project: EditorPage } {
  if (engine === undefined || project === undefined) {
    throw new Error("The engine did not start");
  }
  return { engine, project };
}

async function revealCalls(): Promise<string> {
  if (revealProgram === undefined) return "";
  const root = dirname(running().engine.projectFolder);
  try {
    return await readFile(
      callsFileOf({ root, program: revealProgram }),
      "utf8",
    );
  } catch {
    return "";
  }
}

beforeAll(async () => {
  engine = await runEngine({
    fakeAgent: true,
    withChromium: true,
    recordingPrograms: revealProgram === undefined ? [] : [revealProgram],
  });
  await setScenario({
    engine,
    scenario: {
      steps: [
        { print: claudeLines.init },
        { print: claudeLines.whole("The film is done.") },
        { print: claudeLines.result("completed") },
      ],
    },
  });
  await readyCutTake(engine);
  project = await openProject(engine.url);
});

afterAll(async () => {
  await project?.close();
  await closeBrowser();
  await engine?.remove();
});

describe("the export when the person approves the cut", () => {
  it("exports the film by itself, and shows its path in the film view and in the chat", async () => {
    const { page } = running().project;
    const exported = join(
      running().engine.projectFolder,
      "exports",
      "editor-test-wide.mp4",
    );

    await page.getByRole("button", { name: "Approve the cut" }).click();

    const filmPath = page.locator(".film-export .exported-path code");
    await expect.poll(() => filmPath.count(), { timeout: 60_000 }).toBe(1);
    const chatPath = chatOf(page).history.locator(
      ".export-line .exported-path code",
    );
    expect(await filmPath.innerText()).toMatch(
      /[\\/]exports[\\/]editor-test-wide\.mp4$/,
    );
    expect(await chatPath.innerText()).toBe(await filmPath.innerText());
    expect((await probeVideo(exported)).streams).toContainEqual({
      codec_type: "video",
      width: 320,
      height: 180,
    });
    expect(
      await page
        .locator(".film-export")
        .getByText("You approved the film, so yumekit exported it.", {
          exact: false,
        })
        .count(),
    ).toBe(1);
  });

  it.skipIf(revealProgram === undefined)(
    "asks the file manager of the computer to show the file",
    async () => {
      const { page } = running().project;
      const isMac = process.platform === "darwin";
      const file = await realpath(
        join(running().engine.projectFolder, "exports", "editor-test-wide.mp4"),
      );

      await page
        .locator(".film-export")
        .getByRole("button", {
          name: isMac ? "Show in Finder" : "Open the folder",
        })
        .click();

      await expect.poll(revealCalls).not.toBe("");
      expect((await revealCalls()).trim().split("\n")).toEqual(
        isMac ? ["-R", file] : [dirname(file)],
      );
    },
  );
});
