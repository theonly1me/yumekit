import { stat } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { requestTextsSent, setScenario } from "../testing/chatTesting.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { followingLeadScenario } from "../testing/fakeAgent.js";
import { buildRenderProject, probeVideo } from "../testing/renderProject.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ withChromium: true, fakeAgent: true });
  await buildRenderProject(engine);
  await setScenario({ engine, scenario: followingLeadScenario });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("Sharper in Export", () => {
  it("is off at the start, shows the price, and asks the AI for a larger copy next to the normal file", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("checkbox", { name: /^Tall/ }).uncheck();
    await sheet.locator("summary", { hasText: "More" }).click();
    const sharper = sheet.getByRole("switch", { name: "Sharper copy of Wide" });

    await expect.poll(() => sharper.count()).toBe(1);
    expect(await sharper.isChecked()).toBe(false);
    expect(await sheet.locator(".export-sharper").innerText()).toContain(
      "2 times wider and taller. Free. The free test service makes a plain larger copy.",
    );
    await sharper.check();
    await sheet.getByRole("button", { name: "Export 1 video" }).click();

    await expect
      .poll(
        () =>
          sheet
            .locator(".exported-file")
            .filter({ hasText: "Sharper copy" })
            .count(),
        { timeout: 90_000 },
      )
      .toBe(1);
    const exported = join(
      runningEngine().projectFolder,
      "exports",
      "editor-test-wide.mp4",
    );
    expect((await stat(exported)).isFile()).toBe(true);
    const renders = join(runningEngine().projectFolder, "renders");
    const probe = await probeVideo(join(renders, "wide-sharper.mp4"));
    expect(probe.streams).toContainEqual({
      codec_type: "video",
      width: 640,
      height: 360,
    });
    expect(await sheet.getByRole("button", { name: "Play" }).count()).toBe(2);
    expect(await requestTextsSent(runningEngine())).toContainEqual(
      expect.stringContaining(
        '1. make_sharper_copy {"output_id":"wide","server":"sample"',
      ),
    );
    await editor.close();
  });
});
