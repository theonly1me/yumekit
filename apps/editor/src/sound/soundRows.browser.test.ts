import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { isTrackOff } from "../testing/projectFacts.js";
import { voiceTestServer } from "../testing/mediaTestTools.js";
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
        voice: voiceTestServer,
        "local-music": { disabled: true },
      },
    },
  });
  await buildCounterProject(engine);
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "voice",
      capability: "speech",
      server: "voice",
      input: { text: "A short line" },
    },
  });
  await engine.callTool({
    name: "place_narration",
    input: {
      output_id: "wide",
      asset_id: "voice",
      start_frame: 0,
      with_captions: true,
      partial: true,
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the sound rows", () => {
  it("shows a row for the voice and the captions, and a switch turns the voice off", async () => {
    const editor = await openEditor(runningEngine().url);
    const rows = editor.page.getByRole("list", { name: "Sound" });
    await expect
      .poll(() =>
        rows
          .locator(".sound-row:not(.sound-note) .sound-name")
          .allTextContents(),
      )
      .toEqual(["Voice", "Captions"]);

    await editor.page.getByRole("switch", { name: "Voice on" }).click();

    const voiceRow = rows.locator(".sound-row").first();
    await expect.poll(() => voiceRow.getAttribute("data-on")).toBe("false");
    expect(await voiceRow.locator(".sound-choice").textContent()).toBe("Off");
    await expect
      .poll(() =>
        isTrackOff({
          engine: runningEngine(),
          outputId: "wide",
          trackId: "narration",
        }),
      )
      .toBe(true);
    await editor.close();
  });

  it("says that the voice may not match after a scene gets longer", async () => {
    const editor = await openEditor(runningEngine().url);
    await editor.page.locator(".card").first().click();

    await editor.page
      .getByRole("group", { name: /^Actions for scene/ })
      .getByRole("button", { name: "One second longer" })
      .click();

    await expect
      .poll(() =>
        editor.page
          .getByText("The voice may not match the scenes now.")
          .count(),
      )
      .toBe(1);
    await editor.close();
  });

  it("says why the video has no music, with Add a key and Use my own music, which open the Music view", async () => {
    const editor = await openEditor(runningEngine().url);
    const note = editor.page.locator(".sound-note[data-part='music']");

    await expect
      .poll(() => note.locator(".sound-note-text").textContent())
      .toBe("No music yet. Music needs a key, or your own file.");
    expect(await note.getByRole("button").allTextContents()).toEqual([
      "Add a key",
      "Use my own music",
    ]);
    await note.getByRole("button", { name: "Use my own music" }).click();

    await expect
      .poll(() => editor.page.getByText("Use my own music").count())
      .toBeGreaterThan(1);
    await editor.close();
  });

  it("says that the voice says an older text after a change of its line, and an undo clears it", async () => {
    await runningEngine().callTool({
      name: "set_script",
      input: { script: "A short line" },
    });
    const editor = await openEditor(runningEngine().url);
    const oldNote = editor.page.locator(".sound-note[data-part='voice']");
    await expect.poll(() => oldNote.count()).toBe(0);

    await runningEngine().callTool({
      name: "set_script",
      input: { script: "A longer line" },
    });
    await expect
      .poll(() => oldNote.locator(".sound-note-text").textContent())
      .toBe("The voice says an older text.");
    expect(await oldNote.getByRole("button").allTextContents()).toEqual([
      "Record the voice again",
    ]);
    await runningEngine().callTool({ name: "undo", input: {} });

    await expect.poll(() => oldNote.count()).toBe(0);
    await editor.close();
  });
});
