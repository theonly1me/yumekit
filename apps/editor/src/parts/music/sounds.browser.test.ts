import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { requestTextsSent, setScenario } from "../../testing/chatTesting.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import {
  buildSoundProject,
  soundTracksOf,
} from "../../testing/soundProject.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withVoiceServer: true });
  await buildSoundProject(engine);
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "door",
      capability: "sound-effect",
      server: "sample",
      input: { prompt: "A door slams", duration_seconds: 0.5 },
    },
  });
  for (const outputId of ["wide", "tall"]) {
    await engine.callTool({
      name: "place_sound",
      input: { output_id: outputId, asset_id: "door", start_frame: 36 },
    });
  }
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

async function soundClipCounts(): Promise<number[]> {
  const { tracks } = await soundTracksOf({
    engine: runningEngine(),
    trackId: "sounds",
  });
  return tracks.map(({ track }) => track?.clips.length ?? 0);
}

async function openMusic(url: string) {
  const editor = await openEditor(url);
  await editor.page.getByRole("button", { name: "Open the music" }).click();
  await editor.page.getByRole("heading", { name: "The music" }).waitFor();
  return editor;
}

describe("the sounds of the music view", () => {
  it("sends Add a sound as the fixed request with the words of the person", async () => {
    await setScenario({ engine: runningEngine(), scenario: { steps: [] } });
    const editor = await openMusic(runningEngine().url);

    await editor.page
      .getByLabel("Add a sound")
      .fill("a soft whoosh when the logo appears");
    await editor.page.getByRole("button", { name: "Add this sound" }).click();

    await expect
      .poll(() => requestTextsSent(runningEngine()))
      .toContainEqual(
        expect.stringContaining(
          "Add this sound to the video where it fits: a soft whoosh when the logo appears.",
        ),
      );
    await editor.close();
  });

  it("lists the sound once with where it plays, and Remove takes it out of each shape of the video", async () => {
    const editor = await openMusic(runningEngine().url);
    const list = editor.page.getByRole("list", { name: "Sounds of the video" });

    await expect
      .poll(() => list.innerText())
      .toMatch(/A door slams\s+At 0:01, in scene 2/);
    expect(await list.getByRole("listitem").count()).toBe(1);
    expect(await soundClipCounts()).toEqual([1, 1]);

    await list.getByRole("button", { name: "Remove" }).click();

    await expect.poll(() => soundClipCounts()).toEqual([0, 0]);
    await expect
      .poll(() => editor.page.getByText("The video has no sounds yet.").count())
      .toBe(1);
    await editor.close();
  });
});
