import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import {
  noPictureKeyTestServer,
  openMakeClip,
  withoutOtherBundled,
} from "../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({
    mediaTools: {
      mcpServers: {
        sample: {},
        keytest: noPictureKeyTestServer,
        ...withoutOtherBundled,
      },
    },
  });
  await buildCounterProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the inputs that a video model accepts", () => {
  it("shows Start on this picture for a model with no accepts list, and hides it for a model that does not accept a first picture", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);
    const sheet = page.getByRole("dialog", { name: "Make a real video clip" });
    const startPicture = sheet.getByText("Start on this picture");
    await sheet.getByLabel("Test clip").check();

    expect(await startPicture.count()).toBe(1);
    await sheet.getByLabel("Test video model").check();
    await expect.poll(() => startPicture.count()).toBe(0);
    await sheet.getByLabel("Test clip").check();
    await expect.poll(() => startPicture.count()).toBe(1);
    await editor.close();
  });
});
