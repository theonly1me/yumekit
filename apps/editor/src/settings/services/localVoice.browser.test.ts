import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { openTools } from "../../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({
    withChromium: true,
    mediaTools: {
      mcpServers: {
        sample: {},
        "local-voice": {},
        openai: { disabled: true },
        gemini: { disabled: true },
        fal: { disabled: true },
        sand: { disabled: true },
      },
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the natural voice in the Services group", () => {
  it("is the voice with no pick and no key, and the picker says that it is free, shows its one download, and offers to get it now", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openTools(page);

    const voiceRow = page
      .getByRole("list", { name: "Services" })
      .getByRole("listitem")
      .filter({ hasText: "Voice" })
      .first();
    await expect.poll(() => voiceRow.textContent()).toContain("Natural voice");

    await page.getByRole("button", { name: "Change Voice" }).click();
    const list = page.getByRole("group", { name: "Models for Voice" });
    const service = list
      .locator(".model-service")
      .filter({ hasText: "Natural voice" });
    await expect
      .poll(() => service.textContent())
      .toContain("Free. It runs on your computer. One download of 148 MB.");
    expect(
      await service.getByRole("button", { name: "Get it now" }).count(),
    ).toBe(1);
    expect(await service.textContent()).not.toContain("System voice");
    await editor.close();
  });
});
