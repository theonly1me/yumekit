import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { requestTextsSent, setScenario } from "../../testing/chatTesting.js";
import { buildCounterProject } from "../../testing/counterProject.js";
import {
  closeBrowser,
  openEditor,
  openSceneTab,
} from "../../testing/editorPage.js";
import {
  engineRequest,
  sceneClipsOf,
  withoutOtherBundled,
} from "../../testing/mediaTestTools.js";
import { followingLeadScenario } from "../../testing/fakeAgent.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

const voiceSchema = z.object({
  timelines: z.array(
    z.object({
      outputId: z.string(),
      tracks: z.array(
        z.object({
          id: z.string(),
          clips: z.array(
            z.object({
              startFrame: z.number(),
              durationFrames: z.number(),
              gainDecibels: z.number().optional(),
            }),
          ),
        }),
      ),
    }),
  ),
});

async function voiceClipsOf(outputId: string) {
  const { timelines } = voiceSchema.parse(
    await engineRequest({ engine: runningEngine(), path: "/api/project" }),
  );
  return timelines
    .filter((timeline) => timeline.outputId === outputId)
    .flatMap((timeline) => timeline.tracks)
    .filter((track) => track.id === "narration")
    .flatMap((track) => track.clips);
}

beforeAll(async () => {
  engine = await runEngine({
    fakeAgent: true,
    mediaTools: { mcpServers: { sample: {}, ...withoutOtherBundled } },
  });
  const running = engine;
  await buildCounterProject(running);
  await running.callTool({
    name: "generate_asset",
    input: {
      asset_id: "mia-face",
      capability: "image",
      input: { prompt: "Mia", width_pixels: 320, height_pixels: 320 },
    },
  });
  await running.callTool({
    name: "put_cast_member",
    input: {
      cast_id: "mia",
      kind: "person",
      name: "Mia",
      description: "Short black hair",
      reference_asset_ids: ["mia-face"],
    },
  });
  await running.callTool({
    name: "generate_asset",
    input: {
      asset_id: "voice",
      capability: "speech",
      input: { text: "one two three four five six" },
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("Make this person talk", () => {
  it("says that a scene has no voice yet and sends the fixed request to record one", async () => {
    await setScenario({ engine: runningEngine(), scenario: { steps: [] } });
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openSceneTab({ page, title: "Second counter" });
    await page.getByRole("button", { name: "Make this person talk" }).click();
    const sheet = page.getByRole("dialog", { name: "Make a real video clip" });

    await sheet.getByText("This scene has no voice yet.").waitFor();
    await sheet
      .getByRole("button", { name: "Record a voice line for this scene" })
      .click();

    await expect
      .poll(() => requestTextsSent(runningEngine()))
      .toContainEqual(
        expect.stringContaining("Record a voice line for this scene."),
      );
    expect(await sheet.count()).toBe(0);
    await editor.close();
  });
  it("makes the cast person speak the voice of the scene, puts the clip in the scene, and turns the voice down there", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: followingLeadScenario,
    });
    for (const outputId of ["wide", "tall"]) {
      await runningEngine().callTool({
        name: "place_narration",
        input: {
          output_id: outputId,
          asset_id: "voice",
          start_frame: 0,
          partial: true,
        },
      });
    }
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openSceneTab({ page, title: "First counter" });
    await page.getByRole("button", { name: "Make this person talk" }).click();
    const sheet = page.getByRole("dialog", { name: "Make a real video clip" });
    await sheet.waitFor();

    expect(
      await sheet
        .getByRole("button", { name: "Mia" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    await expect
      .poll(() =>
        sheet.getByRole("button", { name: /Play the voice/ }).isEnabled(),
      )
      .toBe(true);
    await expect
      .poll(() => sheet.getByText(/“one two three four”/).count())
      .toBe(1);
    await sheet.getByLabel("Your picture or video with the voice").check();
    await expect
      .poll(() => sheet.locator(".clip-price").textContent())
      .toBe("Free");
    await sheet.getByRole("button", { name: "Make the clip" }).click();

    await expect
      .poll(() => sheet.getByText("The clip is in the scene").count())
      .toBe(1);
    for (const outputId of ["wide", "tall"]) {
      const clips = await sceneClipsOf({ engine: runningEngine(), outputId });
      expect(clips.map(({ sceneId }) => sceneId)).toContain(
        "video-talking-first",
      );
      expect(await voiceClipsOf(outputId)).toEqual([
        { startFrame: 0, durationFrames: 30, gainDecibels: -90 },
        { startFrame: 30, durationFrames: 24, gainDecibels: 0 },
      ]);
    }
    await editor.close();
  });
});
