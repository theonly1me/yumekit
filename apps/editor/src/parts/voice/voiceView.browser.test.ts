import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  chatOf,
  claudeLines,
  gateFileOf,
  openGate,
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
  engine = await runEngine({ fakeAgent: true });
  await buildSoundProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

const lockedText =
  "The AI still works on the video. You can look now. You can change this when the AI finishes, or after you stop it.";

describe("the voice view", () => {
  it("opens from the Voice row, and the Captions row keeps Change", async () => {
    const editor = await openEditor(runningEngine().url);
    const rows = editor.page.getByRole("list", { name: "Sound" });

    await expect
      .poll(() => rows.getByRole("button").allTextContents())
      .toEqual(["Open", "Open", "Change"]);
    await editor.page.getByRole("button", { name: "Open the voice" }).click();

    await editor.page
      .getByRole("heading", { name: "The voice", exact: true })
      .waitFor();
    await expect
      .poll(() => editor.page.locator(".voice-line").allInnerTexts())
      .toEqual(["Play\nScene 1: First counter\nA short line"]);
    await editor.close();
  });

  it("is locked while a request runs, and opens again when it ends", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: {
        steps: [
          { print: claudeLines.init },
          { waitForFile: gateFileOf(runningEngine()) },
          { print: claudeLines.whole("Done.") },
          { print: claudeLines.result("completed") },
        ],
      },
    });
    const editor = await openEditor(runningEngine().url);
    await chatOf(editor.page).ask("Make the video calmer.");
    await editor.page.getByRole("button", { name: "Open the voice" }).click();
    const removeVoice = editor.page.getByRole("button", {
      name: "Remove the voice",
    });

    await editor.page.getByText(lockedText).waitFor();
    expect(await removeVoice.isDisabled()).toBe(true);
    expect(
      await editor.page
        .getByRole("button", { name: "Download the voice" })
        .isDisabled(),
    ).toBe(false);
    await openGate(runningEngine());

    await expect.poll(() => editor.page.getByText(lockedText).count()).toBe(0);
    await expect.poll(() => removeVoice.isDisabled()).toBe(false);
    await editor.close();
  });

  it("puts the recording of the person in place of the voice, and asks the AI to fit the captions", async () => {
    await setScenario({
      engine: runningEngine(),
      scenario: { steps: [{ print: claudeLines.result("completed") }] },
    });
    const editor = await openEditor(runningEngine().url);
    await editor.page.getByRole("button", { name: "Open the voice" }).click();

    await editor.page.locator(".file-button input[type=file]").setInputFiles({
      name: "take-1.wav",
      mimeType: "audio/wav",
      buffer: wavBytes(3),
    });

    const ownRecording = [
      { assetId: "take-1", startFrame: 0, durationFrames: 60 },
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
      .toEqual(["Voice", "Music", "Captions"]);
    await editor.close();
  });
});
