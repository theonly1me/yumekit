import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import {
  buildRenderProject,
  probeVideo,
  renderClipFrames,
} from "../testing/renderProject.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function openRenderSheet(outputLabel: "Wide" | "Tall") {
  const editor = await openEditor(runningEngine().url);
  const { page } = editor;
  await page.getByRole("button", { name: "Render", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Render" });
  const other = outputLabel === "Wide" ? "Tall" : "Wide";
  await sheet
    .getByRole("checkbox", { name: new RegExp(`^${other}`) })
    .uncheck();
  await sheet
    .getByRole("checkbox", { name: new RegExp(`^${outputLabel}`) })
    .check();
  return { ...editor, sheet };
}

beforeAll(async () => {
  engine = await runEngine();
  await buildRenderProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("render from the editor", () => {
  it("shows the progress of a render and ends with a file that ffprobe reads", async () => {
    const { page, sheet, close } = await openRenderSheet("Wide");
    await page.evaluate(() => {
      const seen = new Set<string>();
      new MutationObserver(() => {
        for (const match of document.body.innerText.matchAll(
          /\d+ of \d+ frames/g,
        )) {
          seen.add(match[0]);
        }
        document.body.dataset["seenProgress"] = [...seen].join("|");
      }).observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    });

    await sheet.getByRole("button", { name: "Render 1 file" }).click();

    await expect
      .poll(() => sheet.getByText(/^Done, 4\.0 seconds$/).count(), {
        timeout: 60_000,
      })
      .toBe(1);
    const seenProgress = await page.evaluate(
      () => document.body.dataset["seenProgress"] ?? "",
    );
    expect(seenProgress).toMatch(
      new RegExp(`of ${String(renderClipFrames)} frames`),
    );
    const file = join(runningEngine().projectFolder, "renders", "wide.mp4");
    expect(await sheet.getByText(file, { exact: true }).count()).toBe(1);
    const probe = await probeVideo(file);
    expect(probe.format.duration).toBeCloseTo(4, 1);
    expect(probe.streams).toContainEqual({
      codec_type: "video",
      width: 320,
      height: 180,
    });

    const [video] = await Promise.all([
      page.waitForEvent("popup"),
      sheet.getByRole("button", { name: "Open the video" }).click(),
    ]);
    await video.waitForURL(/^blob:/);
    await close();
  });

  it("shows a failed render in plain words and opens the scene at the failed frame", async () => {
    const { page, sheet, scrubberFrame, close } = await openRenderSheet("Tall");

    await sheet.getByRole("button", { name: "Render 1 file" }).click();

    const failure = sheet.getByRole("alert");
    await expect.poll(() => failure.count(), { timeout: 60_000 }).toBe(1);
    const message = (await failure.textContent()) ?? "";
    expect(message).toContain("This scene breaks on purpose.");
    expect(await sheet.getByText("Did not render").count()).toBe(1);
    expect(
      await sheet
        .getByText(
          "Ask your agent to correct the scene Broken, or change it in the Scene panel.",
        )
        .count(),
    ).toBe(1);
    expect(await sheet.getByText(/get_scene|put_scene/).count()).toBe(0);
    const failedFrame = Number(/at frame (\d+)/.exec(message)?.[1]);

    await sheet.getByRole("button", { name: "Open this scene" }).click();

    expect(await page.getByRole("dialog", { name: "Render" }).count()).toBe(0);
    await expect
      .poll(() => page.getByRole("heading", { level: 2 }).textContent())
      .toBe("Broken");
    expect(
      await page
        .getByRole("button", { name: "Tall", exact: true })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(await scrubberFrame()).toBe(failedFrame);
    await close();
  });

  it("keeps a render running after the sheet closes, and shows it again when the sheet opens", async () => {
    const { page, sheet, close } = await openRenderSheet("Wide");
    await sheet.getByRole("button", { name: "Render 1 file" }).click();

    await page.getByRole("button", { name: "Close" }).click();

    const topButton = page.getByRole("button", { name: /^Render(ing \d+%)?$/ });
    expect(await topButton.textContent()).toMatch(/^Rendering \d+%$/);
    await topButton.click();
    const reopened = page.getByRole("dialog", { name: "Render" });
    await expect
      .poll(() => reopened.getByText(/^Done, 4\.0 seconds$/).count(), {
        timeout: 60_000,
      })
      .toBe(1);
    expect(
      await reopened.getByRole("checkbox", { name: /^Wide/ }).isChecked(),
    ).toBe(true);
    expect(
      await reopened.getByRole("checkbox", { name: /^Tall/ }).isChecked(),
    ).toBe(false);
    await reopened.getByRole("button", { name: "Close" }).click();
    expect(await topButton.textContent()).toBe("Render");
    await close();
  });
});
