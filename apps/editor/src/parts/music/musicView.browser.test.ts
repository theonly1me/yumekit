import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
  engine = await runEngine();
  await buildSoundProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

async function musicClips() {
  const { tracks } = await soundTracksOf({
    engine: runningEngine(),
    trackId: "music",
  });
  return tracks.map(({ outputId, track }) => ({
    outputId,
    off: track?.off === true,
    clips: (track?.clips ?? []).map((clip) => ({
      assetId: clip.assetId,
      startFrame: clip.startFrame,
      durationFrames: clip.durationFrames,
      gainDecibels: clip.gainDecibels,
    })),
  }));
}

async function openMusic(url: string) {
  const editor = await openEditor(url);
  await editor.page.getByRole("button", { name: "Open the music" }).click();
  await editor.page.getByRole("heading", { name: "The music" }).waitFor();
  return editor;
}

describe("the music view", () => {
  it("makes a sound file of the person the music of each output, cut or repeated, shows its original name and Your file, and Download the music gives the same bytes", async () => {
    const editor = await openMusic(runningEngine().url);
    const bytes = wavBytes(1.5);

    await editor.page.locator(".file-drop input[type=file]").setInputFiles({
      name: "My tune.wav",
      mimeType: "audio/wav",
      buffer: bytes,
    });

    const repeated = [
      {
        assetId: "mytune",
        startFrame: 0,
        durationFrames: 45,
        gainDecibels: -12,
      },
      {
        assetId: "mytune",
        startFrame: 45,
        durationFrames: 15,
        gainDecibels: -12,
      },
    ];
    await expect
      .poll(() => musicClips())
      .toEqual([
        { outputId: "wide", off: false, clips: repeated },
        { outputId: "tall", off: false, clips: repeated },
      ]);
    await expect
      .poll(() => editor.page.locator(".track-name").textContent())
      .toBe("My tune.wav");
    expect(await editor.page.locator(".made-with").first().textContent()).toBe(
      "Your file.",
    );
    const downloading = editor.page.waitForEvent("download");
    await editor.page
      .getByRole("button", { name: "Download the music" })
      .click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe("My tune.wav");
    const saved = await readFile(await download.path());
    expect(saved.equals(bytes)).toBe(true);
    await editor.close();
  });

  it("changes the gain of the music in each output with the volume", async () => {
    const editor = await openMusic(runningEngine().url);

    await editor.page
      .getByRole("slider", { name: "How loud the music is under the voice" })
      .fill("-20");

    await expect
      .poll(async () =>
        (await musicClips()).flatMap((output) =>
          output.clips.map((clip) => clip.gainDecibels),
        ),
      )
      .toEqual([-20, -20, -20, -20]);
    await editor.close();
  });

  it("removes the music and puts it back", async () => {
    const editor = await openMusic(runningEngine().url);

    await editor.page.getByRole("button", { name: "Remove the music" }).click();
    await expect
      .poll(async () => (await musicClips()).map((output) => output.off))
      .toEqual([true, true]);
    await editor.page
      .getByRole("button", { name: "Put the music back" })
      .click();

    await expect
      .poll(async () => (await musicClips()).map((output) => output.off))
      .toEqual([false, false]);
    await editor.close();
  });
});
