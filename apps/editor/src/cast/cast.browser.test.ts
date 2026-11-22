import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { castOf, onePixelPng } from "../testing/castTesting.js";
import { requestTextsSent, setScenario } from "../testing/chatTesting.js";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";
import { emptyCastText } from "./CastSheet.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildCounterProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the Cast view", () => {
  it("says what to do when the cast is empty, then adds an entry with a picture through the upload route and removes it", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await page.getByRole("button", { name: "Cast", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Cast" });

    await expect.poll(() => sheet.innerText()).toContain(emptyCastText);

    await sheet.getByRole("button", { name: "Add to the cast" }).click();
    await sheet.getByRole("button", { name: "Product" }).click();
    await sheet.getByLabel("Name").fill("Blue mug");
    await sheet
      .getByLabel("What it looks like")
      .fill("A blue mug with a white rim");
    await sheet.locator('input[type="file"]').setInputFiles({
      name: "mug-photo.png",
      mimeType: "image/png",
      buffer: onePixelPng,
    });
    await expect
      .poll(() =>
        sheet.getByRole("img", { name: /Picture 1 of Blue mug/ }).count(),
      )
      .toBe(1);
    await sheet.getByRole("button", { name: "Save" }).click();

    await expect
      .poll(() => castOf(runningEngine()))
      .toEqual([
        {
          id: "blue-mug",
          kind: "product",
          name: "Blue mug",
          description: "A blue mug with a white rim",
          referenceAssetIds: ["mug-photo"],
        },
      ]);
    await expect
      .poll(() => sheet.locator(".cast-row h3").allInnerTexts())
      .toEqual(["Blue mug"]);

    await sheet.getByRole("button", { name: "Remove", exact: true }).click();

    await expect.poll(() => castOf(runningEngine())).toEqual([]);
    await expect.poll(() => sheet.innerText()).toContain(emptyCastText);
    await editor.close();
  });

  it("changes an entry in place and keeps its id", async () => {
    await runningEngine().callTool({
      name: "put_cast_member",
      input: { cast_id: "mia", kind: "person", name: "Mia", description: "" },
    });
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await page.getByRole("button", { name: "Cast", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Cast" });

    await sheet.getByRole("button", { name: "Change" }).click();
    await sheet.getByLabel("What it looks like").fill("Short black hair");
    await sheet.getByRole("button", { name: "Save" }).click();

    await expect
      .poll(() => castOf(runningEngine()))
      .toEqual([
        {
          id: "mia",
          kind: "person",
          name: "Mia",
          description: "Short black hair",
          referenceAssetIds: [],
        },
      ]);
    await editor.close();
  });

  it("sends the fixed request of Make a picture of this to the AI and closes the view", async () => {
    await setScenario({ engine: runningEngine(), scenario: { steps: [] } });
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await page.getByRole("button", { name: "Cast", exact: true }).click();

    await page.getByRole("button", { name: "Make a picture of this" }).click();

    await expect
      .poll(() => requestTextsSent(runningEngine()))
      .toContainEqual(
        expect.stringContaining(
          'Make a picture of "Mia" from the cast. It looks like this: Short black hair. Add the picture to the pictures of that cast entry.',
        ),
      );
    expect(await page.getByRole("dialog", { name: "Cast" }).count()).toBe(0);
    await editor.close();
  });
});
