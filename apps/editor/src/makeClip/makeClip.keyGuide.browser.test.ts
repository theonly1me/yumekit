import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import {
  keyTestServer,
  openMakeClip,
  withoutOtherBundled,
} from "../testing/mediaTestTools.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({
    mediaTools: {
      mcpServers: {
        sample: {},
        keytest: keyTestServer,
        ...withoutOtherBundled,
      },
    },
  });
  await buildCounterProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the key guide in Make a real video clip", () => {
  it("shows the steps and the key field inside the sheet, and continues with the same choices after the saved key", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await openMakeClip(page);
    const sheet = page.getByRole("dialog", { name: "Make a real video clip" });
    await sheet.getByLabel("What happens in the clip").fill("A slow pan");
    await sheet.getByLabel("Test video model").check();
    await sheet.getByRole("button", { name: "720p" }).click();

    expect(await sheet.getByText("Key test server needs a key").count()).toBe(
      1,
    );
    expect(
      await sheet.getByText("Open the key page and sign in.").count(),
    ).toBe(1);
    expect(
      await sheet.getByText("Then this clip costs about $0.50.").count(),
    ).toBe(1);
    expect(
      await sheet.getByRole("button", { name: "Make the clip" }).count(),
    ).toBe(0);
    await sheet.getByLabel("Test key").fill("made-up-key-for-the-guide");
    await sheet
      .getByRole("button", { name: "Save the key and continue" })
      .click();

    await sheet.getByRole("button", { name: "Make the clip" }).waitFor();
    expect(await page.getByRole("dialog", { name: "Settings" }).count()).toBe(
      0,
    );
    expect(await sheet.getByLabel("Test video model").isChecked()).toBe(true);
    expect(
      await sheet
        .getByRole("button", { name: "720p" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      await sheet.getByLabel("What happens in the clip").inputValue(),
    ).toBe("A slow pan");
    expect(await sheet.locator(".clip-price").textContent()).toBe(
      "About $0.50",
    );
    await editor.close();
  });
});
