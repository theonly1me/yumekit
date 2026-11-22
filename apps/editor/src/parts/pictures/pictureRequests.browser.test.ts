import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  chatOf,
  openGate,
  requestTextsSent,
} from "../../testing/chatTesting.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { buildKitSceneProject } from "../../testing/kitSceneProject.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { answerAfterGate, openStepSheet } from "../../testing/stepViews.js";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64",
);

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function openSceneTwo() {
  await answerAfterGate(runningEngine());
  const editor = await openEditor(runningEngine().url);
  await openStepSheet({ page: editor.page, name: "Pictures" });
  await editor.page
    .getByRole("dialog")
    .getByRole("button", { name: /2\. Points/ })
    .click();
  return editor;
}

function lastRequestSent(): Promise<string | undefined> {
  return requestTextsSent(runningEngine()).then((texts) => texts.at(-1));
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildKitSceneProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the requests of the Pictures view", () => {
  it("sends Change the picture as a request about the scene, and locks the view while it runs", async () => {
    const { page, close } = await openSceneTwo();
    const request = "Change the picture of this scene: a night sky";

    await page
      .getByLabel("Describe a change to this picture")
      .fill("a night sky");
    await page.getByRole("button", { name: "Change the picture" }).click();

    await expect
      .poll(() => chatOf(page).entryTexts(2))
      .toContainEqual(expect.stringContaining(request));
    await expect.poll(lastRequestSent).toContain(request);
    expect(await lastRequestSent()).toContain("points");
    const describeField = page.getByLabel("Describe a change to this picture");
    await expect.poll(() => describeField.isDisabled()).toBe(true);
    expect(await page.getByLabel("Use my own picture").isDisabled()).toBe(true);
    expect(
      await page
        .getByRole("button", { name: "Download the picture" })
        .isDisabled(),
    ).toBe(false);
    await openGate(runningEngine());
    await expect.poll(() => describeField.isDisabled()).toBe(false);
    await close();
  });

  it("adds my own picture to the project, then asks the AI to use it", async () => {
    const { page, close } = await openSceneTwo();

    await page.getByLabel("Use my own picture").setInputFiles({
      name: "sky.png",
      mimeType: "image/png",
      buffer: onePixelPng,
    });

    await expect
      .poll(lastRequestSent)
      .toContain("Use my picture sky.png as the picture of this scene.");
    const project = await fetch(`${runningEngine().origin}/api/project`, {
      headers: { authorization: `Bearer ${runningEngine().token}` },
    }).then((response) => response.text());
    expect(project).toContain('"originalName":"sky.png"');
    await openGate(runningEngine());
    await close();
  });

  it("asks nothing when the upload fails, and says why", async () => {
    const { page, close } = await openSceneTwo();
    const requestsBefore = (await requestTextsSent(runningEngine())).length;
    await page.route("**/api/uploads?*", (route) =>
      route.fulfill({
        status: 413,
        json: { kind: "upload-too-large", message: "The file is too large." },
      }),
    );

    await page.getByLabel("Use my own picture").setInputFiles({
      name: "huge.png",
      mimeType: "image/png",
      buffer: Buffer.from("made-up"),
    });

    await expect
      .poll(() => page.getByText("larger than 500 megabytes").count())
      .toBe(1);
    expect((await requestTextsSent(runningEngine())).length).toBe(
      requestsBefore,
    );
    await close();
  });
});
