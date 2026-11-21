import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import {
  generateStill,
  openMakeClip,
  videoAssetCount,
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
      mcpServers: { sample: {} },
      limits: { generatedVideoSeconds: 3 },
    },
  });
  await buildCounterProject(engine);
  await generateStill(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the limit of generated video in Make a clip", () => {
  it("shows the limit message and no button to make the clip for a length past the limit", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);
    const price = page.locator(".clip-price");
    await expect.poll(() => price.textContent()).toBe("Free");

    await page.getByLabel(/Length in seconds/).fill("4");

    await expect
      .poll(() => price.textContent())
      .toBe("Over the limit of this project");
    expect(
      await page.getByText("This project has used 0 of 3 seconds").count(),
    ).toBe(1);
    expect(
      await page.getByRole("button", { name: "Make the clip" }).count(),
    ).toBe(0);
    await editor.close();
  });

  it("shows the limit message from the engine when another client used the seconds, and makes no clip", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);
    await page.getByLabel("What happens in the clip").fill("A slow pan");
    await page.getByLabel(/Length in seconds/).fill("2");
    await runningEngine().callTool({
      name: "generate_asset",
      input: {
        asset_id: "other-clip",
        capability: "video",
        server: "sample",
        input: { prompt: "Another client", duration_seconds: 2 },
      },
    });

    await page.getByRole("button", { name: "Make the clip" }).click();

    await expect
      .poll(() => page.locator(".clip-price").textContent())
      .toBe("Over the limit of this project");
    expect(
      await page.getByText("This project has used 2 of 3 seconds").count(),
    ).toBe(1);
    expect(await videoAssetCount(runningEngine())).toBe(1);
    await editor.close();
  });
});
