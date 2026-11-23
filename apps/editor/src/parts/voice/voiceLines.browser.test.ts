import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { counterCode } from "../../testing/counterProject.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

const spokenText = "Wired then crashed. Meet Hoshi calm green tea.";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ withVoiceServer: true });
  for (const [sceneId, title] of [
    ["first", "Problem"],
    ["second", "Answer"],
  ] as const) {
    await engine.callTool({
      name: "put_scene",
      input: { scene_id: sceneId, title, code: counterCode, props: {} },
    });
  }
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "voice",
      capability: "speech",
      server: "voice",
      input: { text: spokenText },
    },
  });
  await engine.callTool({
    name: "set_timeline",
    input: {
      output_id: "wide",
      tracks: [
        {
          id: "scenes",
          kind: "scene",
          clips: [
            { scene_id: "first", start_frame: 0, duration_frames: 40 },
            { scene_id: "second", start_frame: 40, duration_frames: 40 },
          ],
        },
      ],
    },
  });
  await engine.callTool({
    name: "place_narration",
    input: {
      output_id: "wide",
      asset_id: "voice",
      start_frame: 0,
      with_captions: false,
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("a video with one voice over two scenes", () => {
  it("shows in the Voice view only the words of each scene", async () => {
    const editor = await openEditor(runningEngine().url);
    await editor.page.getByRole("button", { name: "Open the voice" }).click();

    const words = editor.page.locator(".voice-line .voice-words");
    await expect.poll(() => words.count()).toBe(2);
    await expect
      .poll(async () => (await words.allTextContents()).join(" "))
      .toBe(spokenText);
    const [first = "", second = ""] = await words.allTextContents();
    expect(first.startsWith("Wired")).toBe(true);
    expect(second.endsWith("tea.")).toBe(true);
    await editor.close();
  });

  it("always shows the four sound rows, with the empty ones and their actions", async () => {
    const editor = await openEditor(runningEngine().url);
    const rows = editor.page.getByRole("list", { name: "Sound" });

    await expect
      .poll(() => rows.locator(".sound-name").allTextContents())
      .toEqual(["Voice", "Music", "Sounds", "Captions"]);
    const sounds = rows.locator(".sound-note[data-part='sounds']");
    expect(await sounds.locator(".sound-note-text").textContent()).toBe(
      "No sounds yet.",
    );
    expect(await sounds.getByRole("button").allTextContents()).toEqual([
      "Add a sound",
    ]);
    const captions = rows.locator(".sound-note[data-part='captions']");
    expect(await captions.locator(".sound-note-text").textContent()).toBe(
      "No captions.",
    );
    expect(await captions.getByRole("button").allTextContents()).toEqual([
      "Add captions",
    ]);
    await editor.close();
  });
});
