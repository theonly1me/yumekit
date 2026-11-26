import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkDesign, dressStoryProject } from "../testing/designProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { engineRequest } from "../testing/mediaTestTools.js";
import { scenesRowClipsOf } from "../testing/projectFacts.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";
import { buildStoryProject } from "../testing/storyProject.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function approveQuenchClip(engine: RunningEngine): Promise<void> {
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "quench-clip",
      capability: "video",
      shot_id: "quench",
      input: { duration_seconds: 4 },
    },
  });
  await engine.callTool({ name: "open_take", input: { step: "clips" } });
  await engine.callTool({
    name: "ready_take",
    input: {
      items: [
        {
          id: "quench-clip",
          note: "The blade goes into the water.",
          what_to_check: "Her apron from 1 to 3 seconds.",
        },
      ],
    },
  });
  await engineRequest({
    engine,
    path: "/api/takes/take-1/send",
    method: "POST",
    body: { notes: [] },
  });
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withChromium: true });
  await buildStoryProject(engine);
  await dressStoryProject(engine);
  await engine.callTool({
    name: "place_video",
    input: { output_id: "wide", asset_id: "strike-clip", start_frame: 0 },
  });
  await approveQuenchClip(engine);
  await checkDesign({
    engine,
    assetId: "quench-clip",
    shotId: "quench",
    breakFrom: 2,
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("a drop from the tray that the design check refuses", () => {
  it("says in plain words why the clip cannot fill the scene, and changes nothing", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    await page.setViewportSize({ width: 1440, height: 1600 });
    await page.getByRole("switch", { name: "Detailed timeline" }).check();

    await page
      .locator('[data-tray="quench-clip"]')
      .dragTo(page.locator('[data-clip="video-strike-clip"]'));

    await expect
      .poll(() => page.getByRole("alert").allInnerTexts())
      .toContain(
        "A person in it stops looking as designed, so it cannot fill this scene. Make the scene shorter, or ask the lead to make it again.",
      );
    const row = await scenesRowClipsOf({
      engine: runningEngine(),
      outputId: "wide",
    });
    expect(row.map((clip) => clip.id)).toEqual(["video-strike-clip"]);
    await close();
  });
});
