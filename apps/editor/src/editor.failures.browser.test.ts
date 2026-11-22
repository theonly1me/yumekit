import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "./testing/editorPage.js";
import { runEngine, type RunningEngine } from "./testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine();
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the editor failure states", () => {
  it("shows that the engine did not accept a wrong token", async () => {
    const wrongToken = "0".repeat(64);
    const editor = await openEditor(
      `${runningEngine().origin}/?token=${wrongToken}`,
    );

    await expect
      .poll(() =>
        editor.page
          .getByRole("heading", { name: "The engine did not accept this link" })
          .count(),
      )
      .toBe(1);
    expect(editor.page.url()).toBe(`${runningEngine().origin}/`);
    await editor.close();
  });

  it("asks for the link from yumekit open when the address has no token", async () => {
    const editor = await openEditor(`${runningEngine().origin}/`);

    await expect
      .poll(() =>
        editor.page
          .getByRole("heading", {
            name: "This page needs the link from yumekit open",
          })
          .count(),
      )
      .toBe(1);
    await editor.close();
  });

  it("shows an empty project, then that the engine is not reachable after it stops", async () => {
    const editor = await openEditor(runningEngine().url);
    await expect
      .poll(() => editor.page.getByText("This video has no scenes yet").count())
      .toBe(1);

    await runningEngine().stop();

    await expect
      .poll(() =>
        editor.page
          .getByRole("heading", { name: "The engine is not reachable" })
          .count(),
      )
      .toBe(1);
    await editor.close();
  });
});
