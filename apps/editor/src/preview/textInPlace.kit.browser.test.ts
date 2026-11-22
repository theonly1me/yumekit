import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chatOf } from "../testing/chatTesting.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { startPreviewEdit } from "../testing/previewText.js";
import {
  buildKitSceneProject,
  storedPropsOf,
} from "../testing/kitSceneProject.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

const playClipFrames = 600;

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

const propsOf = (sceneId: string) => () =>
  storedPropsOf({ engine: runningEngine(), sceneId });

async function openAt(options: { frame: number; tab?: RegExp }) {
  const editor = await openEditor(runningEngine().url);
  if (options.tab !== undefined) {
    await editor.page.getByRole("tab", { name: options.tab }).click();
  }
  await editor.page
    .getByRole("slider", { name: "Position in the video" })
    .fill(String(options.frame));
  const preview = editor.page.frameLocator(
    'iframe[title="Preview of the video"]',
  );
  return { ...editor, preview };
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildKitSceneProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("a text of the preview that changes in place", () => {
  it("changes the scene with one undo step that the chat lists as a change by the person", async () => {
    const editor = await openAt({ frame: 28 });
    await startPreviewEdit({
      page: editor.page,

      text: editor.preview.getByText("First heading"),
    });

    await editor.page.keyboard.type("A new heading");
    await editor.page.keyboard.press("Enter");

    await expect.poll(propsOf("opening")).toEqual({
      heading: "A new heading",
      subheading: "A small line",
    });
    const chat = chatOf(editor.page);
    await expect
      .poll(() => chat.entryTexts(1))
      .toEqual(["You changed the text of a scene.\nUndo"]);
    await chat.history
      .locator(".change")
      .last()
      .getByRole("button", { name: "Undo", exact: true })
      .click();
    await expect.poll(propsOf("opening")).toEqual({
      heading: "First heading",
      subheading: "A small line",
    });
    await expect
      .poll(() => editor.preview.getByText("First heading").count())
      .toBe(1);
    await editor.close();
  });

  it("keeps the old text after Escape", async () => {
    const editor = await openAt({ frame: 148 });
    const before = await propsOf("closing")();
    await startPreviewEdit({
      page: editor.page,

      text: editor.preview.getByText("Every frame stays editable."),
    });

    await editor.page.keyboard.type("A text to throw away");
    await expect
      .poll(() => editor.preview.getByText("A text to throw away").count())
      .toBe(1);
    await editor.page.keyboard.press("Escape");

    await expect
      .poll(() =>
        editor.preview.getByText("Every frame stays editable.").count(),
      )
      .toBe(1);
    expect(await editor.preview.getByText("A text to throw away").count()).toBe(
      0,
    );
    expect(await propsOf("closing")()).toEqual(before);
    await editor.close();
  });

  it("saves the text after a click outside it, in the tall shape", async () => {
    const editor = await openAt({ frame: 28, tab: /^Tall/ });
    await startPreviewEdit({
      page: editor.page,

      text: editor.preview.getByText("A small line"),
    });

    await editor.page.keyboard.type("A tall line");
    await editor.page.getByText("Editor test").click();

    await expect.poll(propsOf("opening")).toEqual({
      heading: "First heading",
      subheading: "A tall line",
    });
    await expect
      .poll(() => editor.preview.getByText("A tall line").count())
      .toBe(1);
    await editor.close();
  });

  it("changes each of two texts of one scene", async () => {
    const editor = await openAt({ frame: 58 });
    await startPreviewEdit({
      page: editor.page,
      text: editor.preview.getByText("Points", { exact: true }),
    });
    await editor.page.keyboard.type("Steps");
    await editor.page.keyboard.press("Enter");
    await expect
      .poll(() => editor.preview.getByText("Steps", { exact: true }).count())
      .toBe(1);

    await startPreviewEdit({
      page: editor.page,
      text: editor.preview.getByText("Beta"),
    });
    await editor.page.keyboard.type("Second step");
    await editor.page.keyboard.press("Enter");

    await expect.poll(propsOf("points")).toEqual({
      heading: "Steps",
      items: ["Alpha", "Second step", "Gamma"],
    });
    await editor.close();
  });

  it("stops the play when the person clicks a text", async () => {
    await runningEngine().callTool({
      name: "resize_scene_clip",
      input: { clip_id: "opening", duration_frames: playClipFrames },
    });
    const editor = await openAt({ frame: 0 });
    await editor.page.getByRole("button", { name: "Play" }).click();
    await expect
      .poll(() => editor.page.getByRole("button", { name: "Pause" }).count())
      .toBe(1);

    await editor.preview.getByText("First heading").click({ force: true });

    await expect
      .poll(() => editor.page.getByRole("button", { name: "Play" }).count())
      .toBe(1);
    const stoppedFrame = await editor.scrubberFrame();
    await editor.page.waitForTimeout(500);
    expect(await editor.scrubberFrame()).toBe(stoppedFrame);
    expect(stoppedFrame).toBeLessThan(playClipFrames);
    await editor.page.keyboard.press("Escape");
    await editor.close();
  });

  it("says how to change a text under the preview", async () => {
    const editor = await openAt({ frame: 0 });

    await expect
      .poll(() => editor.page.locator(".frame-hint").innerText())
      .toMatch(/^Click the text in the video to change it\. /);
    await editor.close();
  });
});
