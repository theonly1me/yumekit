import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { buildRenderProject, probeVideo } from "../testing/renderProject.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function openExportSheet(outputLabel: "Wide" | "Tall") {
  const editor = await openEditor(runningEngine().url);
  const { page } = editor;
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const sheet = page.getByRole("dialog");
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
  engine = await runEngine({ withChromium: true });
  await buildRenderProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("export from the editor", () => {
  it("shows the progress of an export and ends with a file that ffprobe reads", async () => {
    const { page, sheet, close } = await openExportSheet("Wide");
    await page.evaluate(() => {
      const seen = new Set<string>();
      new MutationObserver(() => {
        for (const bar of document.querySelectorAll('[role="progressbar"]')) {
          seen.add(bar.getAttribute("aria-valuenow") ?? "");
        }
        document.body.dataset["seenProgress"] = [...seen].join("|");
      }).observe(document.body, {
        subtree: true,
        childList: true,
        attributeFilter: ["aria-valuenow"],
      });
    });

    await sheet.getByRole("button", { name: "Export 1 video" }).click();

    await expect
      .poll(
        () => sheet.getByRole("button", { name: "Show the file" }).count(),
        {
          timeout: 60_000,
        },
      )
      .toBe(1);
    const seenProgress = await page.evaluate(
      () => document.body.dataset["seenProgress"] ?? "",
    );
    expect(
      seenProgress.split("|").some((percent) => {
        const value = Number(percent);
        return value > 0 && value < 100;
      }),
    ).toBe(true);
    expect(await sheet.getByText("Your video is ready").count()).toBe(1);
    expect(
      await sheet
        .getByText("project/renders", { exact: true })
        .getAttribute("title"),
    ).toMatch(/[\\/]project[\\/]renders$/);
    const file = join(runningEngine().projectFolder, "renders", "wide.mp4");
    const probe = await probeVideo(file);
    expect(probe.format.duration).toBeCloseTo(4, 1);
    expect(probe.streams).toContainEqual({
      codec_type: "video",
      width: 320,
      height: 180,
    });

    const [video] = await Promise.all([
      page.waitForEvent("popup"),
      sheet.getByRole("button", { name: "Show the file" }).click(),
    ]);
    await video.waitForURL(/^blob:/);
    await close();
  });

  it("shows a failed export in plain words and opens the scene where it failed", async () => {
    const { page, sheet, scrubberFrame, close } = await openExportSheet("Tall");

    await sheet.getByRole("button", { name: "Export 1 video" }).click();

    const failure = sheet.getByRole("alert");
    await expect.poll(() => failure.count(), { timeout: 60_000 }).toBe(1);
    const message = (await failure.textContent()) ?? "";
    expect(message).toContain("This scene breaks on purpose.");
    expect(await sheet.getByText("Did not export").count()).toBe(1);
    expect(
      await sheet
        .getByText(
          "Ask your agent to correct the scene Broken, or change it in the Scene tab.",
        )
        .count(),
    ).toBe(1);
    expect(await sheet.getByText(/get_scene|put_scene/).count()).toBe(0);
    const failedFrame = Number(/at frame (\d+)/.exec(message)?.[1]);

    await sheet.getByRole("button", { name: "Open this scene" }).click();

    expect(await page.getByRole("dialog").count()).toBe(0);
    await expect
      .poll(() =>
        page.getByLabel("Name of the scene", { exact: true }).inputValue(),
      )
      .toBe("Broken");
    expect(
      await page
        .getByRole("tab", { name: /^Tall/ })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(await scrubberFrame()).toBe(failedFrame);
    await close();
  });

  it("keeps an export running after the sheet closes, and shows it again when the sheet opens", async () => {
    const { page, sheet, close } = await openExportSheet("Wide");
    await sheet.getByRole("button", { name: "Export 1 video" }).click();

    await page.getByRole("button", { name: "Close" }).click();

    const topButton = page.getByRole("button", {
      name: /^Export(ing \d+%)?$/,
    });
    expect(await topButton.textContent()).toMatch(/^Exporting \d+%$/);
    await topButton.click();
    const reopened = page.getByRole("dialog");
    await expect
      .poll(
        () => reopened.getByRole("button", { name: "Show the file" }).count(),
        { timeout: 60_000 },
      )
      .toBe(1);
    expect(
      await reopened.getByRole("checkbox", { name: /^Wide/ }).isChecked(),
    ).toBe(true);
    expect(
      await reopened.getByRole("checkbox", { name: /^Tall/ }).isChecked(),
    ).toBe(false);
    await reopened.getByRole("button", { name: "Close" }).click();
    expect(await topButton.textContent()).toBe("Export");
    await close();
  });
});
