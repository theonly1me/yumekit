import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { isTrackOff } from "../testing/projectFacts.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine();
  await buildCounterProject(engine);
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "voice",
      capability: "speech",
      server: "sample",
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
      .poll(() => rows.locator(".sound-name").allTextContents())
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
});
