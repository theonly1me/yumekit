import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { engineRequest, openTools } from "../../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { buildSoundProject } from "../../testing/soundProject.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ withVoiceServer: true, withChromium: true });
  await buildSoundProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

const musicSchema = z.object({
  assets: z.array(
    z.object({
      id: z.string(),
      source: z.object({
        server: z.string().optional(),
        input: z.record(z.string(), z.unknown()).optional(),
      }),
    }),
  ),
  timelines: z.array(
    z.object({
      tracks: z.array(
        z.object({
          id: z.string(),
          clips: z.array(
            z.object({
              assetId: z.string().optional(),
              durationFrames: z.number(),
            }),
          ),
        }),
      ),
    }),
  ),
});

async function musicInUse() {
  const project = musicSchema.parse(
    await engineRequest({ engine: runningEngine(), path: "/api/project" }),
  );
  const clips = project.timelines.flatMap(
    (timeline) =>
      timeline.tracks.find((track) => track.id === "music")?.clips ?? [],
  );
  const asset = project.assets.find((each) => each.id === clips[0]?.assetId);
  return {
    clips: clips.map((clip) => [clip.assetId, clip.durationFrames]),
    server: asset?.source.server,
    style: asset?.source.input?.["style"],
    seed: asset?.source.input?.["seed"],
  };
}

describe("music from this computer", () => {
  it("shows each style with its line and Not approved yet, makes the music of a style for the whole video, and Try another makes a new version", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await page.getByRole("button", { name: "Open the music" }).click();
    const styles = page.getByRole("list", { name: "Styles of music" });
    await styles.waitFor();

    expect(await styles.getByRole("listitem").count()).toBe(5);
    expect(await styles.getByText("Not approved yet").count()).toBe(5);
    await page.getByRole("button", { name: "Try another" }).first().waitFor();
    expect(
      await page.getByRole("button", { name: "Try another" }).isDisabled(),
    ).toBe(true);

    await styles
      .getByRole("listitem")
      .filter({ hasText: "Warm" })
      .getByRole("button", { name: "Use this" })
      .click();
    await expect.poll(musicInUse, { timeout: 20_000 }).toEqual({
      clips: [
        ["music-warm", 60],
        ["music-warm", 60],
      ],
      server: "local-music",
      style: "warm",
      seed: 1,
    });
    await expect
      .poll(() => page.getByRole("status").allTextContents())
      .toContain("The video now has Warm music.");

    await page.getByRole("button", { name: "Try another" }).click();
    await expect
      .poll(async () => (await musicInUse()).clips, { timeout: 20_000 })
      .toEqual([
        ["music-warm-2", 60],
        ["music-warm-2", 60],
      ]);
    const tried = await musicInUse();
    expect(tried.style).toBe("warm");
    expect(tried.seed).not.toBe(1);
    await editor.close();
  });

  it("is the music with no pick and no key, and the picker says that it is free and runs on this computer", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openTools(page);

    const musicRow = page
      .getByRole("list", { name: "Services" })
      .getByRole("listitem")
      .filter({ hasText: "Music" })
      .first();
    await expect
      .poll(() => musicRow.textContent())
      .toContain("Music from this computer");
    await page.getByRole("button", { name: "Change Music" }).click();
    const service = page
      .getByRole("group", { name: "Models for Music" })
      .locator(".model-service")
      .filter({ hasText: "Music from this computer" });
    await expect
      .poll(() => service.textContent())
      .toContain("Free. It runs on your computer.");
    await editor.close();
  });
});
