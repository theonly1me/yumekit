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
  await expect
    .poll(() => editor.page.getByRole("heading", { level: 2 }).textContent())
    .toBe(title);
  const form = editor.page.getByRole("form", { name: "Props of this scene" });
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

describe("the fields of the scene form", () => {
  it("adds, moves, and removes the items of a list of text", async () => {
    const editor = await openScene("Points");

    await editor.form.getByRole("button", { name: "Add an item" }).click();
    await editor.page.keyboard.type("Delta");
    await expect.poll(propsOf("points")).toMatchObject({
      items: ["Alpha", "Beta", "Gamma", "Delta"],
    });
    await editor.form.getByRole("button", { name: "Move item 4 up" }).click();
    await expect.poll(propsOf("points")).toMatchObject({
      items: ["Alpha", "Beta", "Delta", "Gamma"],
    });
    await editor.form.getByRole("button", { name: "Remove item 1" }).click();

    await expect.poll(propsOf("points")).toMatchObject({
      items: ["Beta", "Delta", "Gamma"],
    });
    expect(
      await editor.form.getByRole("textbox", { name: "Item 1" }).inputValue(),
    ).toBe("Beta");
    await editor.close();
  });

  it("adds a bar to a list of objects and sets its label and value", async () => {
    const editor = await openScene("Chart");

    await editor.form.getByRole("button", { name: "Add a bar" }).click();
    await editor.page.keyboard.type("Food");
    await editor.form.getByLabel("Value", { exact: true }).last().fill("12.5");

    await expect.poll(propsOf("chart")).toEqual({
      heading: "Costs",
      bars: [
        { label: "Rent", value: 40 },
        { label: "Food", value: 12.5 },
      ],
    });
    await editor.close();
  });

  it("sets a choice, and removes an optional choice with Default", async () => {
    const editor = await openScene("Harbor");
    const direction = editor.form.getByLabel("Direction", { exact: true });

    await direction.selectOption({ label: "Left" });
    await expect.poll(propsOf("harbor")).toEqual({
      assetId: "harbor-still",
      direction: "left",
    });
    await direction.selectOption({ label: "Default" });

    await expect.poll(propsOf("harbor")).toEqual({ assetId: "harbor-still" });
    await editor.close();
  });

  it("offers only the project assets of the kind that the prop names", async () => {
    const editor = await openScene("Harbor");

    const options = editor.form
      .getByLabel("Image", { exact: true })
      .locator("option");

    await expect
      .poll(() => options.allTextContents())
      .toEqual(["harbor-still"]);
    await editor.close();
  });

  it("shows a long text prop as a text area", async () => {
    const editor = await openScene("Closing line");

    const tagName = await editor.form
      .getByLabel("Quote", { exact: true })
      .evaluate((element) => element.tagName);

    expect(tagName).toBe("TEXTAREA");
    await editor.close();
  });

  it("shows the code of a custom scene read only, with no form", async () => {
    const editor = await openScene("Frame counter");

    const code = editor.page.getByLabel("Scene code");

    expect(await code.textContent()).toContain("defineReactScene");
    expect(await code.evaluate((element) => element.tagName)).toBe("PRE");
    expect(await editor.form.count()).toBe(0);
    expect(
      await editor.page
        .getByText("Your agent writes and changes the code of a custom scene.")
        .count(),
    ).toBe(1);
    await editor.close();
  });
});
