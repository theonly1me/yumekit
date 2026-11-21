import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";
import {
  buildKitSceneProject,
  storedPropsOf,
} from "../testing/kitSceneProject.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function openScene(title: string) {
  const editor = await openEditor(runningEngine().url);
  await editor.page.getByRole("button", { name: new RegExp(title) }).click();
  const form = editor.page.getByRole("form", { name: "Props of this scene" });
  await form.waitFor();
  return { ...editor, form };
}

const propsOf = (sceneId: string) => () =>
  storedPropsOf({ engine: runningEngine(), sceneId });

beforeAll(async () => {
  engine = await runEngine();
  await buildKitSceneProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the scene panel", () => {
  it("changes the preview after a change in the form", async () => {
    const editor = await openScene("Opening title");
    const preview = editor.page.frameLocator(
      'iframe[title="Preview of the current frame"]',
    );
    await expect.poll(() => preview.getByText("First heading").count()).toBe(1);

    await editor.form
      .getByLabel("Heading", { exact: true })
      .fill("A new heading");

    await expect.poll(() => preview.getByText("A new heading").count()).toBe(1);
    await expect.poll(propsOf("opening")).toEqual({
      heading: "A new heading",
      subheading: "A small line",
    });
    await editor.close();
  });

  it("shows a rejected value next to its field and keeps what the person typed", async () => {
    const editor = await openScene("Chart");
    const value = editor.form.getByLabel("Value", { exact: true });

    await value.fill("ten");

    await expect
      .poll(() => value.getAttribute("aria-invalid"), { timeout: 10_000 })
      .toBe("true");
    const issueId = (await value.getAttribute("aria-describedby")) ?? "";
    expect(await editor.page.locator(`[id="${issueId}"]`).textContent()).toBe(
      "Value: Invalid input: expected number, received string",
    );
    expect(await value.inputValue()).toBe("ten");
    expect(await propsOf("chart")()).toEqual({
      heading: "Costs",
      bars: [{ label: "Rent", value: 40 }],
    });
    await editor.close();
  });

  it("restores the old value with Cmd+Z, and does it again with Shift+Cmd+Z", async () => {
    const editor = await openScene("Closing line");
    const quote = editor.form.getByLabel("Quote", { exact: true });
    await quote.fill("A changed quote");
    await quote.blur();
    await expect.poll(propsOf("closing")).toEqual({ quote: "A changed quote" });

    await editor.page.keyboard.press("ControlOrMeta+z");

    await expect
      .poll(propsOf("closing"))
      .toEqual({ quote: "Every frame stays editable." });
    await expect
      .poll(() => quote.inputValue())
      .toBe("Every frame stays editable.");
    await editor.page.keyboard.press("ControlOrMeta+Shift+z");
    await expect.poll(() => quote.inputValue()).toBe("A changed quote");
    await editor.close();
  });

  it("leaves Cmd+Z to a text field that the person typed in since it got focus", async () => {
    const editor = await openScene("Opening title");
    const subheading = editor.form.getByLabel("Subheading", { exact: true });
    const before = await propsOf("opening")();
    await subheading.click();
    await subheading.press("End");
    await subheading.pressSequentially("!");

    await editor.page.keyboard.press("ControlOrMeta+z");

    await expect.poll(() => subheading.inputValue()).toBe("A small line");
    await subheading.blur();
    await expect.poll(propsOf("opening")).toEqual(before);
    await editor.close();
  });

  it("undoes with the button and says when there is nothing to redo", async () => {
    const editor = await openScene("Points");
    await editor.form
      .getByLabel("Heading", { exact: true })
      .fill("Changed points");
    await expect.poll(propsOf("points")).toMatchObject({
      heading: "Changed points",
    });

    await editor.page.getByRole("button", { name: "Undo last change" }).click();
    await expect.poll(propsOf("points")).toMatchObject({ heading: "Points" });
    await editor.page.getByRole("button", { name: "Redo last change" }).click();
    await editor.page.getByRole("button", { name: "Redo last change" }).click();

    await expect
      .poll(() => editor.page.getByRole("status").last().textContent())
      .toBe(
        "There is no undone change to redo. A new change clears the redo steps.",
      );
    await expect.poll(propsOf("points")).toMatchObject({
      heading: "Changed points",
    });
    await editor.close();
  });
});
