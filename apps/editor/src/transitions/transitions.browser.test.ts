import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { scenesRowClipsOf } from "../testing/projectFacts.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function secondKindOf(outputId: string) {
  const [, second] = await scenesRowClipsOf({
    engine: runningEngine(),
    outputId,
  });
  return second?.transition?.kind ?? "cut";
}

beforeAll(async () => {
  engine = await runEngine();
  await buildCounterProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("transitions in the editor", () => {
  it("the mark between two cards sets how the next scene comes in, in each output", async () => {
    const editor = await openEditor(runningEngine().url);
    const mark = editor.page.getByRole("button", {
      name: "Change how scene 2 comes in. Now: Cut",
    });

    await mark.click();
    await editor.page
      .getByRole("group", { name: "How scene 2 comes in" })
      .getByRole("button", { name: "Slide" })
      .click();

    await expect.poll(() => secondKindOf("wide")).toBe("slide");
    expect(await secondKindOf("tall")).toBe("slide");
    await expect
      .poll(() =>
        editor.page
          .getByRole("button", {
            name: "Change how scene 2 comes in. Now: Slide",
          })
          .count(),
      )
      .toBe(1);
    await editor.close();
  });

  it("Between scenes in Settings sets one kind for the whole video", async () => {
    const editor = await openEditor(runningEngine().url);
    await editor.page
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    const row = editor.page.getByRole("group", { name: "Between scenes" });

    await row.getByRole("button", { name: "Fade" }).click();

    await expect.poll(() => secondKindOf("wide")).toBe("fade");
    expect(await secondKindOf("tall")).toBe("fade");
    await expect
      .poll(() =>
        row.getByRole("button", { name: "Fade" }).getAttribute("aria-pressed"),
      )
      .toBe("true");
    await editor.close();
  });
});
