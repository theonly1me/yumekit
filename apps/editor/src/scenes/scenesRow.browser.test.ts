import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

beforeAll(async () => {
  engine = await runEngine();
  await buildCounterProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the scenes row", () => {
  it("makes each column of a tall output as wide as its still, like a filmstrip", async () => {
    if (engine === undefined) throw new Error("The engine did not start");
    const editor = await openEditor(engine.url);
    await editor.page
      .getByRole("button", { name: "Tall", exact: true })
      .click();
    const panels = editor.page.getByRole("list", { name: "Scenes" });
    await panels.locator(".panel").first().waitFor();

    const boxes = await panels.locator("li").evaluateAll((items) =>
      items.map((item) => {
        const frame = item.querySelector(".panel-frame");
        const title = item.querySelector(".panel-title");
        return {
          column: item.getBoundingClientRect().width,
          still: frame?.getBoundingClientRect().width ?? 0,
          stillLeft: frame?.getBoundingClientRect().left ?? 0,
          stillRight: frame?.getBoundingClientRect().right ?? 0,
          titleEnds: title === null ? "" : getComputedStyle(title).textOverflow,
        };
      }),
    );

    const [first, second] = boxes;
    expect(boxes).toHaveLength(2);
    expect(first?.column).toBeCloseTo(first?.still ?? 0, 0);
    expect((second?.stillLeft ?? 0) - (first?.stillRight ?? 0)).toBeLessThan(
      16,
    );
    expect(first?.titleEnds).toBe("ellipsis");
    await editor.close();
  });
});
