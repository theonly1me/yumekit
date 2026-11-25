import { findCameraMove } from "@yumekit/project/camera-moves";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { requestTextsSent, setScenario } from "../testing/chatTesting.js";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { claudeLines, followingLeadScenario } from "../testing/fakeAgent.js";
import {
  engineRequest,
  generateStill,
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

const assetsSchema = z.object({
  assets: z.array(
    z.object({
      id: z.string(),
      source: z.object({ input: z.record(z.string(), z.unknown()).optional() }),
    }),
  ),
});

async function inputOfAsset(assetId: string) {
  const { assets } = assetsSchema.parse(
    await engineRequest({ engine: runningEngine(), path: "/api/project" }),
  );
  return assets.find((asset) => asset.id === assetId)?.source.input;
}

beforeAll(async () => {
  engine = await runEngine({
    fakeAgent: true,
    mediaTools: {
      mcpServers: {
        sample: {},
        keytest: noPictureKeyTestServer,
        ...withoutOtherBundled,
      },
    },
  });
  await buildCounterProject(engine);
  await generateStill(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("camera moves and the last picture in Make a clip", () => {
  it("starts on No camera move, reaches each move in one click, and shows the line of the picked move", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);
    const moves = page.getByRole("group", { name: "Camera" });

    expect(await moves.getByRole("button").allTextContents()).toEqual([
      "No camera move",
      "Push in",
      "Pull out",
      "Pan left",
      "Orbit",
      "Drone rise",
      "Follow",
      "10 more",
    ]);
    expect(
      await moves
        .getByRole("button", { name: "No camera move" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    await moves.getByRole("button", { name: "10 more" }).click();
    expect(await moves.getByRole("button").count()).toBe(17);
    await moves.getByRole("button", { name: "Dolly zoom" }).click();
    expect(await page.locator(".camera-move-line").textContent()).toBe(
      "The subject stays the same size while the background stretches.",
    );
    await editor.close();
  });

  it("sends the picked move and the last picture with the clip", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: followingLeadScenario,
    });
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);
    await page.getByLabel("Test clip").check();
    await page
      .getByRole("group", { name: "Camera" })
      .getByRole("button", { name: "Orbit" })
      .click();
    await page
      .getByRole("group", { name: "Pictures to start on" })
      .getByRole("button", { name: "Start on A red ball" })
      .click();
    await page
      .getByRole("group", { name: "Pictures to end on" })
      .getByRole("button", { name: "End on A red ball" })
      .click();
    await page.getByRole("button", { name: "Make the clip" }).click();

    await expect
      .poll(() => page.getByText("The clip is in the scene").count())
      .toBe(1);
    expect(await inputOfAsset("clip-first")).toMatchObject({
      prompt: `First counter. Natural light.\n\n${findCameraMove("orbit")?.sentence ?? ""}`,
      camera_move: "orbit",
      first_frame_asset_id: "first-still",
      last_frame_asset_id: "first-still",
    });
    expect(await requestTextsSent(runningEngine())).toContainEqual(
      expect.stringContaining(
        'with the camera move Orbit, from the picture "A red ball", to the picture "A red ball".',
      ),
    );
    await editor.close();
  });

  it("hides End on this picture for a model that takes no last picture", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);

    await page.getByLabel("Test clip").check();
    expect(await page.getByText("End on this picture").count()).toBe(1);
    await page.getByLabel("Test video model").check();
    expect(await page.getByText("End on this picture").count()).toBe(0);
    await editor.close();
  });

  it("sends the fixed request of Let the AI write it about the scene, and closes the sheet", async () => {
    await setScenario({ engine: runningEngine(), scenario: { steps: [] } });
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);
    await page.getByLabel("Test clip").check();

    await page.getByRole("button", { name: "Let the AI write it" }).click();

    await expect
      .poll(() => requestTextsSent(runningEngine()))
      .toContainEqual(
        expect.stringContaining(
          "Make a real video clip for this scene. Write the prompt and pick the camera move yourself. Use the model Test clip of Sample (free test server).",
        ),
      );
    expect(
      await page
        .getByRole("dialog", { name: "Make a real video clip" })
        .count(),
    ).toBe(0);
    await editor.close();
  });

  it("shows the answer of the AI in the sheet when it makes no clip", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: {
        steps: [
          { print: claudeLines.init },
          {
            print: claudeLines.whole(
              "This move does not fit a still scene. Should I use Push in?",
            ),
          },
          { print: claudeLines.result("completed") },
        ],
      },
    });
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);
    await page.getByLabel("Test clip").check();
    await page.getByLabel("What happens in the clip").fill("A slow spin");
    await page
      .getByRole("group", { name: "Pictures to start on" })
      .getByRole("button", { name: "Start on A red ball" })
      .click();

    await page.getByRole("button", { name: "Make the clip" }).click();

    await expect
      .poll(() => page.getByRole("alert").allTextContents())
      .toContainEqual(expect.stringContaining("Should I use Push in?"));
    await editor.close();
  });
});
