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
  it("opens the key guide in Tools for a model whose server needs a key", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);

    await page.getByLabel("Test video model").check();
    expect(await page.getByText("Key test server needs a key").count()).toBe(1);
    await page.getByRole("button", { name: "Add the Test key" }).click();

    expect(await page.getByRole("dialog").count()).toBe(0);
    const row = page.getByRole("button", { name: /Key test server/ });
    expect(await row.getAttribute("aria-expanded")).toBe("true");
    expect(await page.getByText("Open the key page and sign in.").count()).toBe(
      1,
    );
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

    await expect.poll(() => price.textContent()).toBe("About $0.20");
    await page.getByRole("button", { name: "720p" }).click();
    await expect.poll(() => price.textContent()).toBe("About $0.50");
    await page.getByLabel(/Length in seconds/).fill("6");
    await expect.poll(() => price.textContent()).toBe("About $1.50");
    await page.getByRole("button", { name: "480p" }).click();
    await expect.poll(() => price.textContent()).toBe("About $0.60");
    await page.getByLabel("Plain color with a frame counter").check();
    await expect.poll(() => price.textContent()).toBe("Free");
    await editor.close();
  });

  it("makes a still and a clip with the sample server, places the clip at the scene, and the preview shows it", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);
    await page.getByLabel("Plain color with a frame counter").check();

    await page.getByLabel("What happens in the clip").fill("A slow pan");
    await page.getByLabel("What the still shows").fill("A red ball");
    await page.getByRole("button", { name: "Make the still" }).click();
    await expect
      .poll(() =>
        page.getByText("The clip starts from the image").textContent(),
      )
      .toContain("still-first");
    await page.getByRole("button", { name: "Make the clip" }).click();

    await expect
      .poll(() => page.getByText("The clip is in the scene").count())
      .toBe(1);
    const clips = await sceneClipsOf({
      engine: runningEngine(),
      outputId: "wide",
    });
    expect(
      clips.map(({ id, sceneId, startFrame }) => ({ id, sceneId, startFrame })),
    ).toEqual([
      { id: "second", sceneId: "second", startFrame: 30 },
      { id: "video-clip-first", sceneId: "video-clip-first", startFrame: 0 },
    ]);
    await page.getByRole("button", { name: "Back to the editor" }).click();
    const picture = page
      .frameLocator('iframe[title="Preview of the current frame"]')
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
