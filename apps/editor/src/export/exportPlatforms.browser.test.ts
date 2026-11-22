import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { counterCode } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { probeVideo } from "../testing/renderProject.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

const shortClipFrames = 10;

async function buildPlatformProject(running: RunningEngine): Promise<void> {
  await running.callTool({
    name: "remove_output",
    input: { output_id: "tall" },
  });
  for (const platformId of ["tiktok", "instagram-reel"]) {
    await running.callTool({
      name: "add_platform",
      input: { platform_id: platformId },
    });
  }
  await running.callTool({
    name: "put_scene",
    input: { scene_id: "counter", title: "Counter", code: counterCode },
  });
  for (const outputId of ["wide", "tall"]) {
    await running.callTool({
      name: "set_timeline",
      input: {
        output_id: outputId,
        tracks: [
          {
            id: "scenes",
            kind: "scene",
            clips: [
              {
                id: "counter",
                scene_id: "counter",
                start_frame: 0,
                duration_frames: shortClipFrames,
              },
            ],
          },
        ],
      },
    });
  }
}

beforeAll(async () => {
  engine = await runEngine({ withChromium: true });
  await buildPlatformProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("export for each platform", () => {
  it("shows one row for each platform and ends with one file for each, from one export", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const sheet = page.getByRole("dialog");
    const rows = sheet.getByRole("list", { name: "Files to export" });

    expect(
      await rows
        .getByRole("listitem")
        .evaluateAll((items) =>
          items.map((item) => item.querySelector(".export-file")?.textContent),
        ),
    ).toEqual([
      "editor-test-tiktok.mp4",
      "editor-test-instagram-reel.mp4",
      "wide.mp4",
    ]);
    await sheet.getByRole("checkbox", { name: /^Wide/ }).uncheck();
    await sheet.getByRole("button", { name: "Export 2 videos" }).click();

    await expect
      .poll(
        () => sheet.getByRole("button", { name: "Show the file" }).count(),
        { timeout: 90_000 },
      )
      .toBe(2);
    const renders = join(runningEngine().projectFolder, "renders");
    const tiktok = await readFile(join(renders, "editor-test-tiktok.mp4"));
    const reel = await readFile(
      join(renders, "editor-test-instagram-reel.mp4"),
    );
    expect(reel.equals(tiktok)).toBe(true);
    const probe = await probeVideo(join(renders, "editor-test-tiktok.mp4"));
    expect(probe.streams).toContainEqual({
      codec_type: "video",
      width: 1080,
      height: 1920,
    });
    expect(await sheet.getByText("Your videos are ready").count()).toBe(1);
    await editor.close();
  });
});
