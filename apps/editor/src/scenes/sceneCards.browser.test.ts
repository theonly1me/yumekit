import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildCounterProject,
  clipLengthFrames,
} from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { scenesRowClipsOf } from "../testing/projectFacts.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function rowOf(outputId: string) {
  return scenesRowClipsOf({ engine: runningEngine(), outputId });
}

async function orderOf(outputId: string): Promise<string> {
  return (await rowOf(outputId)).map((clip) => clip.id).join(" ");
}

async function openPicked(title: string) {
  const editor = await openEditor(runningEngine().url);
  const card = editor.page.locator(".card", { hasText: title });
  await card.click();
  const actions = editor.page.getByRole("group", {
    name: /^Actions for scene/,
  });
  return { ...editor, card, actions };
}

beforeAll(async () => {
  engine = await runEngine();
  await buildCounterProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the actions of a picked scene card", () => {
  it("makes the scene one second longer in each output, and Cmd+Z undoes it", async () => {
    const editor = await openPicked("Second counter");
    const clock = editor.page.getByTestId("timecode");

    await editor.actions
      .getByRole("button", { name: "One second longer" })
      .click();

    const lengths = async (outputId: string) =>
      (await rowOf(outputId)).map((clip) => clip.durationFrames).join(" ");
    await expect.poll(() => lengths("wide")).toBe("30 60");
    expect(await lengths("tall")).toBe("30 60");
    await expect.poll(() => clock.textContent()).toBe("0:01 of 0:03");
    expect(await editor.card.textContent()).toContain("2 seconds");

    await editor.page.locator("body").click({ position: { x: 5, y: 5 } });
    await editor.page.keyboard.press("ControlOrMeta+z");

    await expect.poll(() => lengths("wide")).toBe("30 30");
    await expect.poll(() => clock.textContent()).toBe("0:01 of 0:02");
    await editor.close();
  });

  it("moves a picked card with Alt and the arrow keys, and the preview follows", async () => {
    const editor = await openPicked("Second counter");

    await editor.page.keyboard.press("Alt+ArrowLeft");

    await expect.poll(() => orderOf("wide")).toBe("second first");
    expect(await orderOf("tall")).toBe("second first");
    await expect
      .poll(() => editor.page.locator(".card").first().textContent())
      .toContain("1. Second counter");
    await editor.page
      .getByRole("slider", { name: "Position in the video" })
      .fill("0");
    await expect.poll(editor.previewFrame).toBe(clipLengthFrames);

    await editor.page.locator('[data-card="second"]').focus();
    await editor.page.keyboard.press("Alt+ArrowRight");
    await expect.poll(() => orderOf("wide")).toBe("first second");
    await editor.close();
  });

  it("moves a card when the person drags it onto another card", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;

    await page
      .locator('[data-card="second"]')
      .dragTo(page.locator('[data-card="first"]'));

    await expect.poll(() => orderOf("wide")).toBe("second first");
    await runningEngine().callTool({
      name: "move_scene_clip",
      input: { clip_id: "second", to_index: 1 },
    });
    await expect.poll(() => orderOf("wide")).toBe("first second");
    await editor.close();
  });

  it("duplicates the picked scene after it and deletes the copy", async () => {
    const editor = await openPicked("Second counter");

    await editor.actions.getByRole("button", { name: "Duplicate" }).click();

    await expect.poll(() => orderOf("wide")).toBe("first second second-copy");
    const copy = editor.page.locator('[data-card="second-copy"]');
    await expect
      .poll(() => copy.textContent())
      .toContain("Second counter (copy)");
    await expect.poll(() => copy.getAttribute("aria-pressed")).toBe("true");

    await editor.actions.getByRole("button", { name: "Delete" }).click();

    await expect.poll(() => orderOf("wide")).toBe("first second");
    await expect.poll(() => editor.page.locator(".card").count()).toBe(2);
    await editor.close();
  });

  it("opens the Scene tab with the cursor in the first text field for Edit text", async () => {
    const editor = await openPicked("First counter");

    await editor.actions.getByRole("button", { name: "Edit text" }).click();

    const tab = editor.page.getByRole("tab", { name: "Scene 1" });
    await expect.poll(() => tab.getAttribute("aria-selected")).toBe("true");
    const name = editor.page.getByLabel("Name of the scene", { exact: true });
    await expect
      .poll(() => name.evaluate((field) => field === document.activeElement))
      .toBe(true);
    await editor.close();
  });

  it("opens Make a real video clip for the picked scene", async () => {
    const editor = await openPicked("First counter");

    await editor.actions
      .getByRole("button", { name: "Make a real video clip" })
      .click();

    const sheet = editor.page.getByRole("dialog", {
      name: "Make a real video clip",
    });
    await sheet.waitFor();
    await sheet.getByRole("button", { name: "Close" }).click();
    expect(await sheet.count()).toBe(0);
    await editor.close();
  });
});
