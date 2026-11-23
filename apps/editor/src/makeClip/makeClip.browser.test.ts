import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import {
  engineRequest,
  keyTestServer,
  openMakeClip,
  sceneClipsOf,
  testKeyVariable,
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
        keytest: keyTestServer,
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

describe("Make a clip", () => {
  it("lists each video model under its server, with the price of each model for the picked settings", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);

    const groups = page.locator(".model-group");
    await expect.poll(() => groups.count()).toBe(2);
    const listed = await groups.evaluateAll((elements) =>
      elements.map((group) => ({
        server: group.querySelector(".model-server")?.textContent,
        models: [...group.querySelectorAll(".model")].map(
          (model) => model.textContent,
        ),
      })),
    );
    expect(listed).toEqual([
      {
        server: "Sample (free test server)",
        models: ["Test clipFree"],
      },
      {
        server: "Key test server",
        models: [
          "Test video modelNot tested with yumekit yetAbout $0.20Needs a key",
        ],
      },
    ]);
    await editor.close();
  });

  it("shows the price of the selected settings from the prices of the model", async () => {
    await engineRequest({
      engine: runningEngine(),
      path: `/api/keys/${testKeyVariable}`,
      method: "PUT",
      body: { value: "made-up-price-test-key" },
    });
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);
    await page.getByLabel("Test video model").check();
    const price = page.locator(".clip-price");

    const listedPrice = page
      .locator(".model", { hasText: "Test video model" })
      .locator(".model-price");

    await expect.poll(() => price.textContent()).toBe("About $0.20");
    await page.getByRole("button", { name: "720p" }).click();
    await expect.poll(() => price.textContent()).toBe("About $0.50");
    expect(await listedPrice.textContent()).toBe("About $0.50");
    await page.getByLabel(/^Length,/).fill("6");
    await expect.poll(() => price.textContent()).toBe("About $1.50");
    expect(await listedPrice.textContent()).toBe("About $1.50");
    await page.getByRole("button", { name: "480p" }).click();
    await expect.poll(() => price.textContent()).toBe("About $0.60");
    await page.getByLabel("Test clip").check();
    await expect.poll(() => price.textContent()).toBe("Free");
    await editor.close();
  });

  it("starts on the video model that the person picked in Settings", async () => {
    await engineRequest({
      engine: runningEngine(),
      path: "/api/media/defaults",
      method: "PUT",
      body: { capability: "video", server: "keytest", model: "test-video" },
    });
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);

    await expect
      .poll(() => page.getByLabel("Test video model").isChecked())
      .toBe(true);
    await editor.close();
  });

  it("makes a clip from the prompt of the scene, puts it in place of the scene on each platform, and the preview shows it", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);
    await page.getByLabel("Test clip").check();

    expect(await page.getByLabel("What happens in the clip").inputValue()).toBe(
      "First counter. Natural light.",
    );
    await page.getByRole("button", { name: "Make a new picture" }).click();
    await page.getByLabel("What the still shows").fill("A red ball");
    await page.getByRole("button", { name: "Make the still" }).click();
    await expect
      .poll(() =>
        page.getByText("The clip starts from the picture").textContent(),
      )
      .toContain("A red ball");
    await page.getByRole("button", { name: "Make the clip" }).click();

    await expect
      .poll(() => page.getByText("The clip is in the scene").count())
      .toBe(1);
    for (const outputId of ["wide", "tall"]) {
      const clips = await sceneClipsOf({ engine: runningEngine(), outputId });
      expect(
        clips.map(({ id, sceneId, startFrame }) => ({
          id,
          sceneId,
          startFrame,
        })),
      ).toEqual([
        { id: "video-clip-first", sceneId: "video-clip-first", startFrame: 0 },
        { id: "second", sceneId: "second", startFrame: 30 },
      ]);
    }
    await page.getByRole("button", { name: "Back to the editor" }).click();
    const picture = page
      .frameLocator('iframe[title="Preview of the video"]')
      .locator('img[src*="clip-first"]');
    await expect
      .poll(() =>
        picture.evaluate((image) =>
          image instanceof HTMLImageElement ? image.naturalWidth : 0,
        ),
      )
      .toBeGreaterThan(0);
    await editor.close();
  });
});
