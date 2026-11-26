import { stat } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { buildRenderProject, probeVideo } from "../../testing/renderProject.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ withChromium: true });
  await buildRenderProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the smaller file in Export", () => {
  it("shows the expected size, refuses a size too small for the length, and exports a file under the size with its real size", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("checkbox", { name: /^Tall/ }).uncheck();
    const exportButton = sheet.getByRole("button", { name: "Export 1 video" });
    const fact = sheet.locator(".size-fact");

    expect(await fact.innerText()).toBe("Up to about 0.09 MB, 180p.");
    await sheet.getByRole("button", { name: "Smaller file" }).click();
    expect(
      await sheet
        .getByRole("button", { name: "Under 10 MB" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(await fact.innerText()).toBe("About 9.4 MB, 180p.");

    const ownSize = sheet.getByRole("textbox", {
      name: "Your own largest size in MB",
    });
    await ownSize.fill("0.05");
    expect(await sheet.getByRole("alert").innerText()).toBe(
      "A file under 0.05 MB cannot hold this video. Pick at least 0.2 MB.",
    );
    expect(await exportButton.isDisabled()).toBe(true);

    await ownSize.fill("0.3");
    expect(
      await sheet.getByText("editor-test-wide-under-0.3mb.mp4").count(),
    ).toBe(1);
    await exportButton.click();

    await expect
      .poll(() => sheet.getByRole("button", { name: "Play" }).count(), {
        timeout: 60_000,
      })
      .toBe(1);
    const file = join(
      runningEngine().projectFolder,
      "exports",
      "editor-test-wide-under-0.3mb.mp4",
    );
    const bytes = (await stat(file)).size;
    expect(bytes).toBeLessThanOrEqual(300_000);
    expect(await sheet.locator(".exported-name span").innerText()).toBe(
      `${String(Math.round(bytes / 10_000) / 100)} MB, 180p`,
    );
    expect((await probeVideo(file)).streams).toContainEqual({
      codec_type: "video",
      width: 320,
      height: 180,
    });
    await close();
  });
});
