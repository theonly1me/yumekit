import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  claudeLines,
  requestTextsSent,
  setScenario,
} from "../../testing/chatTesting.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import {
  buildSoundProject,
  soundTracksOf,
} from "../../testing/soundProject.js";
import { wavBytes } from "../../testing/wavFile.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withVoiceServer: true });
  await buildSoundProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the own recording of the voice view", () => {
  it("puts the recording of the person in place of the voice under its original name, says Your file on the voice row and in the view, and asks the AI to fit the captions", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: { steps: [{ print: claudeLines.result("completed") }] },
    });
    const editor = await openEditor(runningEngine().url);
    await editor.page.getByRole("button", { name: "Open the voice" }).click();

    await editor.page.locator(".file-button input[type=file]").setInputFiles({
      name: "take 1.wav",
      mimeType: "audio/wav",
      buffer: wavBytes(3),
    });

    const ownRecording = [
      { assetId: "take1", startFrame: 0, durationFrames: 60 },
    ];
    await expect
      .poll(async () => {
        const { tracks } = await soundTracksOf({
          engine: runningEngine(),
          trackId: "narration",
        });
        return tracks.map(({ track }) =>
          (track?.clips ?? []).map((clip) => ({
            assetId: clip.assetId,
            startFrame: clip.startFrame,
            durationFrames: clip.durationFrames,
          })),
        );
      })
      .toEqual([ownRecording, ownRecording]);
    await expect
      .poll(() => editor.page.locator(".voice-words").allTextContents())
      .toEqual(["Your recording take 1.wav"]);
    expect(await editor.page.locator(".made-with").first().textContent()).toBe(
      "Your file.",
    );
    await editor.page
      .getByRole("button", { name: "Make the captions match my recording" })
      .click();

    await expect
      .poll(async () => (await requestTextsSent(runningEngine())).at(-1))
      .toContain("Make the captions match my recording.");
    await editor.page.getByRole("button", { name: "Close" }).click();
    await expect
      .poll(() =>
        editor.page
          .getByRole("list", { name: "Sound" })
          .locator(".sound-name")
          .allTextContents(),
      )
      .toEqual(["Voice", "Music", "Sounds", "Captions"]);
    expect(
      await editor.page
        .getByRole("list", { name: "Sound" })
        .locator(".sound-choice")
        .first()
        .textContent(),
    ).toBe("take 1.wav");
    await editor.close();
  });
});
