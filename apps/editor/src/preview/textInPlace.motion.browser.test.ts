import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { startPreviewEdit } from "../testing/previewText.js";
import {
  buildKitSceneProject,
  storedPropsOf,
} from "../testing/kitSceneProject.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

const frameWhileWordsComeIn = 6;

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

const openingProps = () =>
  storedPropsOf({ engine: runningEngine(), sceneId: "opening" });

async function editHeadingWhileWordsComeIn() {
  const editor = await openEditor(runningEngine().url);
  await editor.page
    .getByRole("slider", { name: "Position in the video" })
    .fill(String(frameWhileWordsComeIn));
  const heading = editor.page
    .frameLocator('iframe[title="Preview of the video"]')
    .locator('[data-text-prop="heading"]');
  await expect.poll(() => heading.locator("span").count()).toBe(2);
  await startPreviewEdit({ page: editor.page, text: heading });
  return { ...editor, heading };
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildKitSceneProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("a heading that comes in word by word, changed in place", () => {
  it("shows each word of the heading at full strength while the person edits it", async () => {
    const editor = await editHeadingWhileWordsComeIn();

    const shown = await editor.heading.evaluate((element) =>
      [element, ...element.querySelectorAll("span")].map((part) => {
        const style = getComputedStyle(part);
        return `${style.opacity} ${style.transform}`;
      }),
    );

    expect(shown).toEqual(["1 none", "1 none", "1 none"]);
    expect(await editor.heading.innerText()).toBe("First heading");
    await editor.page.keyboard.press("Escape");
    await editor.close();
  });

  it("saves the full new text that the person types over the heading", async () => {
    const editor = await editHeadingWhileWordsComeIn();

    await editor.page.keyboard.type("A new heading");
    await editor.page.keyboard.press("Enter");

    await expect.poll(openingProps).toEqual({
      heading: "A new heading",
      subheading: "A small line",
    });
    await runningEngine().callTool({ name: "undo", input: {} });
    await expect.poll(openingProps).toEqual({
      heading: "First heading",
      subheading: "A small line",
    });
    await editor.close();
  });

  it("adds a word at the end with no lost word and no doubled word", async () => {
    const editor = await editHeadingWhileWordsComeIn();

    await editor.page.keyboard.press("End");
    await editor.page.keyboard.type(" today");
    await editor.page.keyboard.press("Enter");

    await expect.poll(openingProps).toEqual({
      heading: "First heading today",
      subheading: "A small line",
    });
    await editor.close();
  });
});
