import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildKitSceneProject,
  storedPropsOf,
} from "../testing/kitSceneProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

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

async function issueOf(options: {
  page: Awaited<ReturnType<typeof openScene>>["page"];
  field: Awaited<ReturnType<typeof openScene>>["form"];
}) {
  await expect
    .poll(() => options.field.getAttribute("aria-invalid"))
    .toBe("true");
  const issueId = (await options.field.getAttribute("aria-describedby")) ?? "";
  return options.page.locator(`[id="${issueId}"]`).textContent();
}

beforeAll(async () => {
  engine = await runEngine();
  await buildKitSceneProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("plain words and number fields in the scene form", () => {
  it("takes only digits, a minus sign, and a decimal point in a number field", async () => {
    const editor = await openScene("Chart");
    const value = editor.form.getByLabel("Value", { exact: true });
    await value.click();
    await value.press("ControlOrMeta+a");

    await value.pressSequentially("ten");
    expect(await value.inputValue()).toBe("40");
    await value.press("ControlOrMeta+a");
    await value.pressSequentially("-1e2.5x");

    expect(await value.inputValue()).toBe("-12.5");
    await expect.poll(propsOf("chart")).toEqual({
      heading: "Costs",
      bars: [{ label: "Rent", value: -12.5 }],
    });
    await editor.close();
  });

  it("asks for at least 1 character when a required text is empty", async () => {
    const editor = await openScene("Opening title");
    const heading = editor.form.getByLabel("Heading", { exact: true });

    await heading.fill("");

    expect(await issueOf({ page: editor.page, field: heading })).toBe(
      "Give at least 1 character",
    );
    expect(await editor.page.getByText(/zod|expected|received/).count()).toBe(
      0,
    );
    await editor.close();
  });

  it("asks for at least 1 item when the last item of a list is removed", async () => {
    const editor = await openScene("Points");
    for (const index of [3, 2, 1]) {
      await editor.form
        .getByRole("button", { name: `Remove item ${String(index)}` })
        .click();
    }

    await expect
      .poll(() => editor.form.getByRole("alert").textContent())
      .toBe("Add at least 1 item");
    await editor.close();
  });
});
