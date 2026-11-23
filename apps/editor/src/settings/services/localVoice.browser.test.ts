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
      },
    },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the voice of this computer in the Services group", () => {
  it("is the voice with no pick and no key, and the list says that it is free and shows the size of the natural voice", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openTools(page);

    const voiceRow = page
      .getByRole("list", { name: "Services" })
      .getByRole("listitem")
      .filter({ hasText: "Voice" })
      .first();
    await expect
      .poll(() => voiceRow.textContent())
      .toContain("Voice of this computer, System voice");

    await page.getByRole("button", { name: "Change Voice" }).click();
    const list = page.getByRole("group", { name: "Models for Voice" });
    const service = list
      .locator(".model-service")
      .filter({ hasText: "Voice of this computer" });
    await expect
      .poll(() => service.textContent())
      .toContain("Free. It runs on your computer.");
    await expect
      .poll(() => service.textContent())
      .toContain("Natural voice. Download once, 148 MB");
    await editor.close();
  });
});
